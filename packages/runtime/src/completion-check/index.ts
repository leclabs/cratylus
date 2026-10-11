// ─────────────────────────────────────────────────────────────────────────────
// THE COMPLETION CHECK — `cratylus completion-check`, run by a git `post-commit`
// hook (this repository's `.husky/post-commit`). Harness-facing: never a
// capability verb, never offered to an agent as a tool.
//
// It reads HEAD's message in the working directory's repository and watches
// only the one enumerated form fixed by decision 0081: a subject opening
// `feat(cut:<id>): `. For such a commit, when the ledger does not show cut
// `<id>` complete, it writes a warning to the commit's output (stderr) naming
// the cut, the phase the ledger computes, every work package not approved (and
// none that is) and each kind of entry it read past, written by a newer
// runtime, telling the agent that made the commit to report the gap as a
// defect in how the ledger captures the harness's events.
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
  const report = [
    'The ledger is written only from what the harness reports of its agents (their dispatches, returns, verdicts and reports), never by hand: do not record, approve or force anything in it yourself.',
    'If you observed verdicts or returns the ledger lacks, that is a defect in how the harness’s events were captured: report it as such to whoever dispatched you, naming what you observed and what the ledger shows.',
  ].join('\n');
  try {
    const { state, readPast } = cutView(from, cut);
    if (state.phase === 'complete') return undefined;
    const unapproved = [...state.packages.values()].filter(
      (p) => p.status !== 'approved',
    );
    return [
      `cratylus completion-check: this commit declares cut '${cut}' complete, but the ledger shows it ${state.phase}.`,
      unapproved.length === 0
        ? 'The ledger holds no work package for it.'
        : `Not approved: ${unapproved.map((p) => `${p.name} (${p.status})`).join(', ')}.`,
      ...(readPast.kinds.size === 0
        ? []
        : [
            `The ledger holds entries of kinds this runtime does not know, read past (${[...readPast.kinds].map(([kind, n]) => `${kind}: ${n}`).join(', ')}), so what it shows may be incomplete.`,
          ]),
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
