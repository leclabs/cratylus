import { defineConfig } from 'tsup';

// TWO bin passes — one package, two commands.
// `cratylus` is build time, `cratylus-run` is run time; they remain SEPARATE
// commands because they serve separate DAGs, and shipping them from one package
// is what makes that a seam rather than a second install.
// The capability plugins are STATIC imports of declared
// dependencies, so they are resolved by the package manager at install time —
// never by an ambient sibling lookup that only a flat co-install satisfies.
export default defineConfig({
  entry: {
    bin: 'src/bin.ts',
    cratylus: 'src/cratylus.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: { entry: { index: 'src/index.ts' } },
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
});
