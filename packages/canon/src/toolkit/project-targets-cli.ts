// CLI for `project-targets`: regenerate the committed hook + rule deploy targets from
// their source cells, or `--check` (diff-only, nonzero exit on drift). The runnable
// half of the byte-lock (`test/hook-rule-boundary.test.ts` is the gate).
//
//   tsx src/toolkit/project-targets-cli.ts            # regenerate in place
//   tsx src/toolkit/project-targets-cli.ts --check    # report drift, change nothing

import { regenerateTargets } from './project-targets.js';

const check = process.argv.includes('--check');
const { drift, written } = await regenerateTargets({ check });

if (check) {
  if (drift.length > 0) {
    process.stderr.write(
      `DRIFT — ${drift.length} target(s) differ from their source cell:\n${drift
        .map((p) => `  ${p}`)
        .join('\n')}\nRun \`pnpm canon:project:targets\` to regenerate.\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    'OK — every hook + rule target matches its source cell.\n',
  );
} else {
  process.stdout.write(
    `regenerated ${written.length} hook + rule target(s)${
      drift.length ? ` (${drift.length} had drifted)` : ''
    }.\n`,
  );
}
