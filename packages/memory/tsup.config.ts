import { defineConfig } from 'tsup';

// memory is now a LIBRARY (contra its old single bundled `memory.mjs` CLI):
// it is a runtime-capability plugin, so it emits `.d.ts` and exposes its `exports`
// subpaths one-for-one — `.` (the runtimePlugin + AgentMemory + main + seedTemplates
// barrel) and `./seedTemplates` (the seed templates forge S6 imports). There
// is NO `bin` pass: the old top-level `memory` binary is dropped (npm scope-strip →
// global `memory` collision); verbs are reached via `cratylus-run memory <verb>`.
// `@cratylus/runtime` stays external (a workspace dep, not inlined).
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
