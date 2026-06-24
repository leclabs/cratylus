import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

// One package, three source areas. The library build (core + the 10 adapters)
// emits .d.ts and code-splits the shared core into a chunk; the CLI build is a
// separate pass (no dts, shebang banner) so `koine` runs as an executable.
const adapters = readdirSync('./src/adapters', { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const libEntry: Record<string, string> = {
  'core/index': 'src/core/index.ts',
  'anatomy/index': 'src/anatomy/index.ts',
};
for (const a of adapters) {
  libEntry[`adapters/${a}/index`] = `src/adapters/${a}/index.ts`;
}

export default defineConfig([
  {
    entry: libEntry,
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: true,
    sourcemap: true,
  },
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
