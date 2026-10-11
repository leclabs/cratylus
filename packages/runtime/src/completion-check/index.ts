// ─────────────────────────────────────────────────────────────────────────────
// THE COMPLETION CHECK — `cratylus completion-check`, run by a git `post-commit`
// hook (this repository's `.husky/post-commit`). Harness-facing: never a
// capability verb, never offered to an agent as a tool.
//
// It reads HEAD's message in the working directory's repository and watches
// only the one enumerated form fixed by decision 0081: a subject opening
// `feat(cut:<id>): `. For such a commit, when the ledger does not show cut
// `<id>` complete, it writes a warning to the commit's output (stderr) naming
// the cut, the phase the ledger computes and every work package not approved
// (and none that is), telling the agent that made the commit to report the gap
// as a defect in how the ledger captures the harness's events.
//
// It is silent otherwise, always exits 0, never refuses a commit and never
// writes the ledger.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { Command } from 'commander';
import { cutView } from '../capabilities/work-package/index.js';

/** The one watched form: a subject opening `feat(cut:<id>): `. */
export const WATCHED = /^feat\(cut:([^)\s]+)\): /;

/** The warning for HEAD of the repository holding `from`, or `undefined` when
 *  the check is silent. Never throws. */
export function completionCheck(from: string): string | undefined {
  let subject: string;
  try {
    subject = execFileSync('git', ['log', '-1', '--format=%s'], {
      cwd: from,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
  const cut = WATCHED.exec(subject)?.[1];
  if (cut === undefined) return undefined;
  const report =
    'Report this gap, to whoever dispatched you, as a defect in how the ledger captures the harness’s events.';
  try {
    const { state } = cutView(from, cut);
    if (state.phase === 'complete') return undefined;
    const unapproved = [...state.packages.values()].filter(
      (p) => p.status !== 'approved',
    );
    return [
      `cratylus completion-check: this commit declares cut '${cut}' complete, but the ledger shows it ${state.phase}.`,
      unapproved.length === 0
        ? 'The ledger holds no work package for it.'
        : `Not approved: ${unapproved.map((p) => `${p.name} (${p.status})`).join(', ')}.`,
      report,
    ].join('\n');
  } catch (error) {
    return [
      `cratylus completion-check: this commit declares cut '${cut}' complete, but the ledger cannot show it complete: ${error instanceof Error ? error.message : String(error)}.`,
      report,
    ].join('\n');
  }
}

/** `completion-check`: harness-facing, hidden from help, never a tool. */
export function completionCheckCommand(): Command {
  return new Command('completion-check')
    .description(
      'Warn when HEAD declares a cut complete that the ledger does not show complete (run by the post-commit hook; never refuses)',
    )
    .action(() => {
      const warning = completionCheck(process.cwd());
      if (warning !== undefined) process.stderr.write(`${warning}\n`);
      process.exitCode = 0;
    });
}

// Run from source by `.husky/post-commit`, which runs before any build.
if (import.meta.url === `file://${process.argv[1]}`) {
  const warning = completionCheck(process.cwd());
  if (warning !== undefined) process.stderr.write(`${warning}\n`);
}
