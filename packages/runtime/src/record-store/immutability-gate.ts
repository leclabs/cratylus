// ─────────────────────────────────────────────────────────────────────────────
// THE IMMUTABILITY GATE — the one enforced law of the substrate: a change that
// modifies or deletes an existing record is refused, at commit and in CI.
//
// A change under the records root (`RECORDS_ROOT`) whose git status is not an
// addition — modified, deleted, renamed, type-changed — is refused, and the
// refusal names every offending path. Additions pass; paths outside the root are
// ignored. A branch merge adds records only, so it passes.
//
// Changes are read with rename detection off, so a rename reaches the gate as
// what it does to the records root: the deletion of its source and the addition
// of its destination. A record renamed away is refused by its deletion; a file
// renamed INTO the root from outside is an addition there.
//
// A change is one commit's: in a range, every commit is judged against its own
// parent, and a merge against each of its parents, so a later commit in the same
// range cannot mask an earlier one (a record added then edited, or edited then
// restored, is refused although the range's endpoints differ by an addition or
// not at all). A merge against each parent sees the other side's records as
// additions, so it passes; a root commit is judged against the empty tree.
//
// A push is read twice, and both readings hold: its commits, as above, and its
// endpoints — a record present at `before` and absent at `after` is refused as a
// deletion. A push that rewrites history (a force-push) drops records without any
// commit of the new range deleting them, and only the endpoints see that. A pull
// request's commits are read alone: its base moves on, so its endpoints differ by
// whatever the base gained.
//
// Two callers, one module, run from source (pre-commit runs before any build):
//   - `.husky/pre-commit` runs it with no argument, over the staged changes;
//   - `.github/workflows/gates.yml` runs it over a pull request's commits, as one
//     `git rev-list` range argument, or over a push, as `--push <before> <after>`.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { RECORDS_ROOT } from './store.js';

/** One path's change, as `git diff --name-status` reports it: its status letter
 *  and its path relative to the repository root. */
export interface Change {
  readonly status: string;
  readonly path: string;
}

/**
 * The paths the gate refuses, each once: every change under the records root that
 * is not an addition. Empty means the changes pass.
 */
export function immutabilityGate(changes: readonly Change[]): string[] {
  const refused = changes
    .filter(
      ({ status, path }) =>
        status !== 'A' &&
        (path === RECORDS_ROOT || path.startsWith(`${RECORDS_ROOT}/`)),
    )
    .map(({ path }) => path);
  return [...new Set(refused)];
}

/** Run git in `cwd`, feeding it `input`; returns its standard output. */
function git(cwd: string, args: readonly string[], input?: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'inherit'],
    maxBuffer: Number.POSITIVE_INFINITY,
  });
}

/** The options every reading lists its changes with, and their parse. */
const LISTING = ['--name-status', '--no-renames', '--no-relative', '-z'];
function listed(out: string): Change[] {
  const fields = out.split('\0');
  const found: Change[] = [];
  for (let i = 0; i + 1 < fields.length; i += 2)
    found.push({ status: fields[i] as string, path: fields[i + 1] as string });
  return found;
}

/**
 * The changes of the repository at `cwd`: the staged ones when `range` is absent;
 * otherwise every commit of the `git rev-list` range `range` (`<base>..<head>`,
 * or `<head>` for its whole history) against each of its parents.
 */
export function changes(range?: string, cwd: string = process.cwd()): Change[] {
  if (range === undefined)
    return listed(git(cwd, ['diff', '--cached', ...LISTING, '--']));
  const commits = git(cwd, ['rev-list', range, '--']);
  return listed(
    git(
      cwd,
      [
        'diff-tree',
        '--stdin',
        '-r',
        '-m',
        '--root',
        '--no-commit-id',
        ...LISTING,
      ],
      commits,
    ),
  );
}

/**
 * The changes of a push from `before` to `after` in the repository at `cwd`: every
 * commit of `before..after` against each of its parents, and the deletion of every
 * path present at `before` and absent at `after`.
 */
export function pushed(
  before: string,
  after: string,
  cwd: string = process.cwd(),
): Change[] {
  return [
    ...changes(`${before}..${after}`, cwd),
    ...listed(
      git(cwd, ['diff', '--diff-filter=D', ...LISTING, before, after, '--']),
    ),
  ];
}

/** Run the gate over the staged changes (no argument), one range, or one push. */
export function main(args: readonly string[]): number {
  let read: Change[];
  if (args.length === 0) read = changes();
  else if (args.length === 1) read = changes(args[0]);
  else if (args.length === 3 && args[0] === '--push')
    read = pushed(args[1] as string, args[2] as string);
  else {
    process.stderr.write(
      'usage: immutability-gate [<range> | --push <before> <after>]\n',
    );
    return 2;
  }
  const refused = immutabilityGate(read);
  if (refused.length === 0) return 0;
  process.stderr.write(
    `immutability gate: a record is never modified, moved or deleted once written; refused:\n${refused
      .map((path) => `  ${path}\n`)
      .join('')}`,
  );
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
