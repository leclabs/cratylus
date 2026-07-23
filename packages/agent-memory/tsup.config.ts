import { defineConfig } from 'tsup';

// agent-memory is now a LIBRARY (contra its old single bundled `memory.mjs` CLI):
// it is a runtime-capability plugin, so it emits `.d.ts` and exposes its `exports`
// subpaths one-for-one — `.` (the runtimePlugin + AgentMemory + main + seedTemplates
// barrel) and `./seedTemplates` (the seed templates agent-forge S6 imports). There
// is NO `bin` pass: the old top-level `memory` binary is dropped (npm scope-strip →
// global `memory` collision); verbs are reached via `agent-runtime memory <verb>`.
// `@leclabs/agent-runtime` stays external (a workspace dep, not inlined).
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    seeds: 'src/seeds.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
});
