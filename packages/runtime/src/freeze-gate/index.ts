// ─────────────────────────────────────────────────────────────────────────────
// THE FREEZE GATE — `cratylus freeze-gate <state>`, run as git's
// `reference-transaction` hook (decisions 0128, 0129), with the hook's argument
// and its stdin, one `<old> <new> <ref>` line per update. Harness-facing: never
// a capability verb, never offered to an agent as a tool.
//
// The freeze holds where a change would be recorded. Every route that moves a
// branch (a commit, with or without its hooks, an amend, a merge, a cherry-pick,
// a rebase, `update-ref`) passes this hook, so the project's history is held
// here; the journal holds its own appends (`concepts supersede|retire`).
//
// In the `prepared` state, each update of a branch (`refs/heads/…`) to a commit
// is read for what it brings in: the paths its new tip changes from the branch's
// tip now (git's old value is not trusted, it is zero when unverified); for a
// branch that does not exist yet, the paths changed by every commit it brings in
// that no branch holds. Renames are read as a deletion and an addition, so a
// moved folder names the frozen paths it takes away. The update is refused when
// a path is a frozen cut's example or held-out example text, a frozen check or
// a file a frozen check uses (`workPackage frozen`), or a journal entry
// (`design/journal/*.json`, as the new tip holds it) superseding or retiring a
// concept a frozen cut realizes, unless the acting agent (`CRATYLUS_AGENT`) is
// that cut's architect. The refusal names the ref, the cut, its architect and
// the paths; git then aborts the transaction, so the ref stays where it was.
//
// A freeze that cannot be read (the ledger present but an entry unreadable, or
// a frozen cut's examples file missing) refuses every branch update, saying why.
// Other states, other refs, a deletion, and a repository with no ledger are
// admitted, silently.
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
  frozenCuts,
} from '../capabilities/work-package/index.js';
import { covers } from '../capabilities/work-package/uses.js';

const OBJECT = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const ZERO = /^0+$/;

/** Run git in `top`, feeding it `input`; its stdout, untrimmed. */
function git(top: string, args: readonly string[], input = ''): string {
  return execFileSync('git', args, {
    cwd: top,
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 1 << 28,
  });
}

/** The paths updating `ref` to `tip` brings into it, in the repository at `top`. */
function broughtIn(top: string, ref: string, tip: string): string[] {
  let now: string | undefined;
  try {
    now = git(top, ['rev-parse', '--verify', '-q', `${ref}^{commit}`]).trim();
  } catch {
    now = undefined;
  }
  const listed =
    now !== undefined
      ? git(top, [
          'diff-tree',
          '-r',
          '--no-renames',
          '--name-only',
          '-z',
          now,
          tip,
        ])
      : git(
          top,
          [
            'diff-tree',
            '--stdin',
            '-r',
            '-m',
            '--root',
            '--no-renames',
            '--no-commit-id',
            '--name-only',
            '-z',
          ],
          git(top, ['rev-list', tip, '--not', '--branches']),
        );
  return [...new Set(listed.split('\0').filter((p) => p !== ''))];
}

/** The context and concept the journal entry at `path` in `tip` supersedes or
 *  retires, or `undefined` when it does neither. */
function changedConcept(
  top: string,
  tip: string,
  path: string,
): { readonly context: string; readonly name: string } | undefined {
  try {
    const entry = JSON.parse(git(top, ['cat-file', 'blob', `${tip}:${path}`]));
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
  const top = topOf(from);
  if (updates.length === 0 || top === undefined) return undefined;
  let cuts: readonly FrozenCut[];
  try {
    cuts = frozenCuts(top).cuts;
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error);
    return updates
      .map(
        ({ ref }) =>
          `${CLI_BIN} freeze-gate: ${ref} is not moved: what is frozen cannot be read, so every branch update is refused: ${why}`,
      )
      .join('\n');
  }
  if (cuts.length === 0) return undefined;
  const agent = actingAgent(env);
  const by = agent === undefined ? 'an unknown agent' : `'${agent}'`;
  const refusals: string[] = [];
  for (const { tip, ref } of updates) {
    const paths = broughtIn(top, ref, tip);
    for (const cut of cuts) {
      const needed = new Set<string>();
      const hit = paths.filter((path) => {
        const concept =
          path.startsWith(`${JOURNAL_DIR}/`) && path.endsWith('.json')
            ? changedConcept(top, tip, path)
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

/** Read the hook's stdin, and say and exit as `freezeGate` decides. */
function run(state: string | undefined): void {
  const input = process.stdin.isTTY ? '' : readFileSync(0, 'utf8');
  const refusal = freezeGate(state, input, process.cwd());
  if (refusal !== undefined) process.stderr.write(`${refusal}\n`);
  process.exitCode = refusal === undefined ? 0 : 1;
}

/** `freeze-gate`: harness-facing, hidden from help, never a tool. */
export function freezeGateCommand(): Command {
  return new Command('freeze-gate')
    .description(
      'Refuse a branch update that brings in a change to what a cut not integrated freezes, unless its architect makes it (run as the reference-transaction hook)',
    )
    .argument('[state]')
    .allowExcessArguments()
    .action((state: string | undefined) => run(state));
}

// Run from source by `.husky/reference-transaction`, which runs before any build.
if (import.meta.url === `file://${process.argv[1]}`) run(process.argv[2]);
