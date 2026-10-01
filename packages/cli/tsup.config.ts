import { defineConfig } from 'tsup';

// ONE bin, ONE program: the projector's commands and the capabilities are built into
// one Commander program, so its help lists them all.
// The capability plugins are STATIC imports of declared
// dependencies, so they are resolved by the package manager at install time —
// never by an ambient sibling lookup that only a flat co-install satisfies.
export default defineConfig({
  entry: {
    cratylus: 'src/cratylus.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: { entry: { index: 'src/index.ts' } },
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
});
