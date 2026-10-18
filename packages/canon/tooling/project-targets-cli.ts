// CLI for `project-targets`: regenerate the committed hook deploy targets from
// their source cells.
//
//   tsx tooling/project-targets-cli.ts

import { regenerateTargets } from './project-targets.js';

const { drift, written } = await regenerateTargets();

process.stdout.write(
  `regenerated ${written.length} hook target(s)${
    drift.length ? ` (${drift.length} had drifted)` : ''
  }.\n`,
);
