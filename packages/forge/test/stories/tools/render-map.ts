/**
 * Regenerate test/stories/MAP.md from the scanned story-test call sites.
 * Run from packages/forge: `pnpm exec tsx test/stories/tools/render-map.ts`
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMap } from '../render.js';
import { scanStoryTests } from '../scan.js';

const storiesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const { refs, violations } = scanStoryTests(storiesDir);
if (violations.length) {
  console.error(`scan violations:\n${violations.join('\n')}`);
  process.exit(1);
}
writeFileSync(join(storiesDir, 'MAP.md'), renderMap(refs), 'utf8');
console.log(`MAP.md rendered: ${refs.length} test refs`);
