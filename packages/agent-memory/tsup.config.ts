import { defineConfig } from 'tsup';

// Build-only toolsource → ONE self-contained, dependency-free artifact
// (`dist/memory.mjs`) — the standalone `memory` tool. Installed on PATH via the
// package `bin` (`memory`) and carried to every host beside the memory skill.
// This is NOT a library: no dts, no `index.ts` exports surface, no multi-entry —
// just the bundled CLI. `src/bin.ts` carries the shebang, so the artifact runs
// as `memory <cmd>` (or `node memory.mjs <cmd>`).
export default defineConfig({
  entry: { memory: 'src/bin.ts' },
  format: ['esm'],
  outExtension: () => ({ js: '.mjs' }),
  bundle: true,
  treeshake: true,
  dts: false,
  clean: true,
});
