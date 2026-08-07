import { defineConfig } from 'tsup';

// ONE bin. `cratylus` is gone: a second command existed only because the two
// surfaces lived in two packages and each built its own `cac`. They are one command
// now — capability verbs route to the runtime, everything else to the projector.
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
