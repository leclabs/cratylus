import { defineConfig } from 'tsup';

// Build-only toolsource → ONE self-contained, dependency-free artifact
// (`dist/episodic.mjs`) that the `memory` skill bundles and deploys to every
// host (memory-tool-bundling). This is NOT a library: no dts, no `index.ts`
// exports surface, no multi-entry — just the bundled CLI. `src/bin.ts` carries
// the shebang, so the artifact runs as `node episodic.mjs <cmd>`.
export default defineConfig({
  entry: { episodic: 'src/bin.ts' },
  format: ['esm'],
  outExtension: () => ({ js: '.mjs' }),
  bundle: true,
  treeshake: true,
  dts: false,
  clean: true,
});
