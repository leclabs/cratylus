import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// FORGE IS A LIBRARY AND HAS NO BIN OF ITS OWN — the `cratylus` command ships from
// the hub package, because two manifests declaring one bin name is an install
// conflict rather than a second home. Anything mounting forge's CLI supplies the
// program name, and these tests are such a consumer.
//
// READ FROM THE HUB'S MANIFEST, never spelled here: the value keeps its one home,
// and a test that hardcoded it would be asserting against itself.
const hub = JSON.parse(
  readFileSync(new URL('../cli/package.json', import.meta.url), 'utf8'),
) as { name: string };

export default defineConfig({
  test: { env: { CRATYLUS_BUILD_BIN: hub.name } },
});
