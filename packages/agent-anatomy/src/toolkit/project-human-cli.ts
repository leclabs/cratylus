// The `project-human` writer — regenerate the committed organ READMEs that are
// projection-owned (`PROJECTED_ORGANS`) from their value cells. Run it after
// editing any value cell of a projected organ; `test/projection-boundary.test.ts`
// fails until the committed README matches re-projection byte-for-byte.
//
// Usage:  tsx src/toolkit/project-human-cli.ts [--check]
//   (default)  write each projected organ's README.md
//   --check    write nothing; exit 1 if any committed README ≠ its projection

import { readFileSync, writeFileSync } from 'node:fs';
import { PROJECTED_ORGANS } from './organ-docs.js';
import { organReadmePath, renderOrganReadme } from './project-human.js';

async function main(check: boolean): Promise<number> {
  let drift = 0;
  for (const organ of PROJECTED_ORGANS) {
    const want = await renderOrganReadme(organ);
    const path = organReadmePath(organ);
    if (check) {
      let have = '';
      try {
        have = readFileSync(path, 'utf8');
      } catch {
        have = '';
      }
      if (have !== want) {
        process.stderr.write(`DRIFT ${organ}/README.md (run project:human)\n`);
        drift++;
      }
      continue;
    }
    writeFileSync(path, want);
    process.stdout.write(`EMIT ${organ}/README.md (project-human)\n`);
  }
  if (check && drift === 0) {
    process.stdout.write(
      `OK ${PROJECTED_ORGANS.length} organ README(s) in sync\n`,
    );
  }
  return drift > 0 ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.slice(2).includes('--check');
  process.exit(await main(check));
}
