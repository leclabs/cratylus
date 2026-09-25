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
// Two callers, one module, run from source (pre-commit runs before any build):
//   - `.husky/pre-commit` runs it with no argument, over the staged changes;
//   - `.github/workflows/gates.yml` runs it over the pushed range, as one
//     `git diff` range argument.
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
 * The paths the gate refuses: every change under the records root that is not an
 * addition. Empty means the changes pass.
 */
export function immutabilityGate(changes: readonly Change[]): string[] {
  return changes
    .filter(
      ({ status, path }) =>
        status !== 'A' &&
        (path === RECORDS_ROOT || path.startsWith(`${RECORDS_ROOT}/`)),
    )
    .map(({ path }) => path);
}

/**
 * The changes of the repository at `cwd`: the staged ones when `range` is absent,
 * otherwise those of the `git diff` range `range` (`<base>..<head>`,
 * `<base>...<head>`).
 */
export function changes(range?: string, cwd: string = process.cwd()): Change[] {
  const out = execFileSync(
    'git',
    [
      'diff',
      '--name-status',
      '--no-renames',
      '--no-relative',
      '-z',
      ...(range === undefined ? ['--cached'] : [range]),
      '--',
    ],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const fields = out.split('\0');
  const found: Change[] = [];
  for (let i = 0; i + 1 < fields.length; i += 2)
    found.push({ status: fields[i] as string, path: fields[i + 1] as string });
  return found;
}

/** Run the gate over the staged changes (no argument) or one range. */
export function main(args: readonly string[]): number {
  if (args.length > 1) {
    process.stderr.write('usage: immutability-gate [<range>]\n');
    return 2;
  }
  const refused = immutabilityGate(changes(args[0]));
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
