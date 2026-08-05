import { defineConfig } from 'tsup';

// One bin pass. The capability plugins are STATIC imports of declared
// dependencies, so they are resolved by the package manager at install time —
// never by an ambient sibling lookup that only a flat co-install satisfies.
export default defineConfig({
  entry: { bin: 'src/bin.ts' },
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
});
