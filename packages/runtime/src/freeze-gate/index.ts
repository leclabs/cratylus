// ─────────────────────────────────────────────────────────────────────────────
// THE FREEZE GATE — `cratylus freeze-gate <state>`, run as git's
// `reference-transaction` hook (decisions 0128, 0129, 0133), with the hook's
// argument and its stdin, one `<old> <new> <ref>` line per update.
// Harness-facing: never a capability verb, never offered to an agent as a tool.
//
// The freeze holds where a change would be recorded. Every route that moves a
// branch (a commit, with or without its hooks, an amend, a merge, a cherry-pick,
// a rebase, `update-ref`, a push into the repository) passes this hook, in
// whichever work tree of the repository it is made, so the project's history is
// held here; the journal holds its own appends (`concepts
// define|supersede|retire`). Wired in the repository's common hooks folder, git
// runs it in every work tree and, on a push, in the git directory.
//
// In the `prepared` state, each update of a branch (`refs/heads/…`) to a commit
// is read for what it brings in: the paths its new tip changes from the branch's
// tip now (git's old value is not trusted, it is zero when unverified); for a
// branch that does not exist yet, the paths changed by every commit it brings in
// that no branch holds. Renames are read as a deletion and an addition.
//
// THE JOURNAL IS APPEND-ONLY. An update that changes or deletes a journal entry
// (`design/journal/*.json`) is refused, whoever makes it, the architect
// included; an added entry is admitted.
//
// WHAT IS FROZEN is read from the record (decisions 0132, 0134): a cut's
// examples, its checks and the files they use as the branch's tip before the
// update holds them, and, for what that tip does not hold or a branch that does
// not exist yet, as the working copy holds them; the ledger where cratylus keeps
// it, in the work tree the update is made in, or, on a push, the repository's
// own. The update is refused when a path is a frozen cut's example or held-out
// example text, a frozen check or a file a frozen check uses (`workPackage
// frozen`), or a journal entry (as the new tip holds it) superseding or retiring
// a concept a frozen cut realizes, unless the acting agent (`CRATYLUS_AGENT`) is
// that cut's architect. The refusal names the ref, the cut, its architect and
// the paths; git then aborts the transaction, so the ref stays where it was.
//
// A freeze that cannot be read (the ledger present but an entry unreadable, or
// a frozen cut's examples file missing) refuses every branch update, saying why.
// Other states, other refs, a deletion, and a repository with no ledger pass
// what is frozen silently.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { actingAgent } from '../acting-agent.js';
import { CLI_BIN } from '../bin-name.js';
import { JOURNAL_DIR } from '../capabilities/concepts/journal.js';
import { topOf } from '../capabilities/work-package/git.js';
import {
  type FrozenCut,
  type LedgerEntry,
  frozenIn,
  recordedFiles,
  workingCopy,
} from '../capabilities/work-package/index.js';
import { ledgerAt } from '../capabilities/work-package/ledger.js';
import { covers } from '../capabilities/work-package/uses.js';

const OBJECT = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const ZERO = /^0+$/;

/** Run git in `cwd`, feeding it `input`; its stdout, untrimmed. */
function git(cwd: string, args: readonly string[], input = ''): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 1 << 28,
  });
}

/** The work tree the update made from `from` is made in, else the
 *  repository's own (a push runs the hook in the git directory); `undefined`
 *  for a repository with no work tree. */
function workTreeOf(from: string): string | undefined {
  const top = topOf(from);
  if (top !== undefined) return top;
  const [first = '', second] = git(from, ['worktree', 'list', '--porcelain'])
    .split('\n')
    .map((line) => line.trim());
  return first.startsWith('worktree ') && second !== 'bare'
    ? first.slice('worktree '.length)
    : undefined;
}

/** The commit `ref` names in the repository holding `from`, or `undefined`
 *  when it names none yet. */
function tipOf(from: string, ref: string): string | undefined {
  try {
    return git(from, ['rev-parse', '--verify', '-q', `${ref}^{commit}`]).trim();
  } catch {
    return undefined;
  }
}

/** What updating a branch whose tip is `now` to `tip` brings into it, in the
 *  repository holding `from`: each path changed, with git's status letter. */
function broughtIn(
  from: string,
  now: string | undefined,
  tip: string,
): { readonly status: string; readonly path: string }[] {
  const listed = (
    now !== undefined
      ? git(from, [
          'diff-tree',
          '-r',
          '--no-renames',
          '--name-status',
          '-z',
          now,
          tip,
        ])
      : git(
          from,
          [
            'diff-tree',
            '--stdin',
            '-r',
            '-m',
            '--root',
            '--no-renames',
            '--no-commit-id',
            '--name-status',
            '-z',
          ],
          git(from, ['rev-list', tip, '--not', '--branches']),
        )
  )
    .split('\0')
    .filter((p) => p !== '');
  const changes = new Map<string, string>();
  for (let i = 0; i + 1 < listed.length; i += 2) {
    const [status = '', path = ''] = [listed[i], listed[i + 1]];
    const was = changes.get(path);
    // A path one commit adds and another changes is still a change.
    if (was === undefined || was === 'A') changes.set(path, status[0] ?? '');
  }
  return [...changes].map(([path, status]) => ({ path, status }));
}

/** The context and concept the journal entry at `path` in `tip` supersedes or
 *  retires, or `undefined` when it does neither. */
function changedConcept(
  from: string,
  tip: string,
  path: string,
): { readonly context: string; readonly name: string } | undefined {
  try {
    const entry = JSON.parse(git(from, ['cat-file', 'blob', `${tip}:${path}`]));
    return (entry.kind === 'supersede' || entry.kind === 'retire') &&
      typeof entry.context === 'string' &&
      typeof entry.name === 'string'
      ? { context: entry.context, name: entry.name }
      : undefined;
  } catch {
    return undefined;
  }
}

/** The architects of `cut` whom a change to `path` needs: the context's for an
 *  example, every context's otherwise; none when `cut` does not freeze it. */
function holders(cut: FrozenCut, path: string): string[] {
  if (cut.examples.includes(path))
    return [cut.architects[path.split('/')[2] as string] ?? 'none'];
  if ([...cut.checks, ...cut.uses].some((entry) => covers(entry, path)))
    return Object.values(cut.architects);
  return [];
}

const isEntry = (path: string): boolean =>
  path.startsWith(`${JOURNAL_DIR}/`) && path.endsWith('.json');

/** What `freeze-gate <state>` says for the updates `input` of the repository
 *  holding `from`, made by the agent `env` names: the refusal, or `undefined`
 *  when every update is admitted. */
export function freezeGate(
  state: string | undefined,
  input: string,
  from: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  if (state !== 'prepared') return undefined;
  const updates = input.split('\n').flatMap((line) => {
    const [, tip, ref] = line.trim().split(/\s+/);
    return tip !== undefined &&
      ref?.startsWith('refs/heads/') &&
      OBJECT.test(tip) &&
      !ZERO.test(tip)
      ? [{ tip, ref }]
      : [];
  });
  if (updates.length === 0) return undefined;
  const agent = actingAgent(env);
  const by = agent === undefined ? 'an unknown agent' : `'${agent}'`;
  const top = workTreeOf(from);
  let entries: readonly LedgerEntry[] | Error = [];
  if (top !== undefined)
    try {
      entries = ledgerAt(top, (m) => new Error(m)).entries();
    } catch (error) {
      entries = error instanceof Error ? error : new Error(String(error));
    }
  const refusals: string[] = [];
  for (const { tip, ref } of updates) {
    const now = tipOf(from, ref);
    const changes = broughtIn(from, now, tip);
    const rewritten = changes
      .filter(({ status, path }) => status !== 'A' && isEntry(path))
      .map(({ path }) => path.slice(JOURNAL_DIR.length + 1, -'.json'.length));
    if (rewritten.length > 0)
      refusals.push(
        `${CLI_BIN} freeze-gate: ${ref} is not moved: it changes or deletes the journal ${rewritten.length === 1 ? 'entry' : 'entries'} ${rewritten.join(', ')}; the journal is append-only, so no one, an architect included, changes or deletes an entry, and the update is made by ${by}`,
      );
    if (top === undefined) continue;
    let cuts: readonly FrozenCut[];
    try {
      if (entries instanceof Error) throw entries;
      cuts = frozenIn(
        now === undefined ? workingCopy(top) : recordedFiles(top, now),
        entries,
        (m) => new Error(m),
      );
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error);
      refusals.push(
        `${CLI_BIN} freeze-gate: ${ref} is not moved: what is frozen cannot be read, so every branch update is refused: ${why}`,
      );
      continue;
    }
    const paths = changes.map(({ path }) => path);
    for (const cut of cuts) {
      const needed = new Set<string>();
      const hit = paths.filter((path) => {
        const concept = isEntry(path)
          ? changedConcept(from, tip, path)
          : undefined;
        const architects =
          concept !== undefined &&
          cut.concepts.some(
            (c) => c.context === concept.context && c.name === concept.name,
          )
            ? [cut.architects[concept.context] ?? 'none']
            : holders(cut, path);
        for (const architect of architects) needed.add(architect);
        return architects.some((architect) => architect !== agent);
      });
      if (hit.length === 0) continue;
      const architect = [...needed].map((a) => `'${a}'`).join(', ');
      refusals.push(
        `${CLI_BIN} freeze-gate: ${ref} is not moved: ${hit.join(', ')} ${hit.length === 1 ? 'is' : 'are'} frozen by the cut '${cut.cut}' (architect ${architect}); only its architect may change ${hit.length === 1 ? 'it' : 'them'} until the cut is integrated, and the update is made by ${by}`,
      );
    }
  }
  return refusals.length === 0 ? undefined : refusals.join('\n');
}

/** Read the hook's stdin, and say and exit as `freezeGate` decides. A gate
 *  that cannot read the repository refuses. */
function run(state: string | undefined): void {
  const input = process.stdin.isTTY ? '' : readFileSync(0, 'utf8');
  // Git may name its directory relative to where it ran the hook; the gate
  // finds the repository from there itself, and reads work trees by their top.
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE'])
    Reflect.deleteProperty(process.env, name);
  let refusal: string | undefined;
  try {
    refusal = freezeGate(state, input, process.cwd());
  } catch (error) {
    refusal = `${CLI_BIN} freeze-gate: no branch is moved: the repository cannot be read, so every branch update is refused: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (refusal !== undefined) process.stderr.write(`${refusal}\n`);
  process.exitCode = refusal === undefined ? 0 : 1;
}

/** `freeze-gate`: harness-facing, hidden from help, never a tool. */
export function freezeGateCommand(): Command {
  return new Command('freeze-gate')
    .description(
      'Refuse a branch update that changes or deletes a journal entry, or brings in a change to what a cut not integrated freezes, unless its architect makes it (run as the reference-transaction hook)',
    )
    .argument('[state]')
    .allowExcessArguments()
    .action((state: string | undefined) => run(state));
}

// Run from source by `.husky/reference-transaction`, which runs before any build.
if (import.meta.url === `file://${process.argv[1]}`) run(process.argv[2]);
