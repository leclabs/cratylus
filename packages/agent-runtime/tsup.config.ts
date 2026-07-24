import { defineConfig } from 'tsup';

// agent-runtime is a library AND (as of S3) a thin bin. The LIBRARY pass emits .d.ts
// for every entry and exposes one entry per `exports` subpath — the S1 contracts
// (`.`, `./events`, `./ports/*`) plus the S3 kernel (`./loader`, `./dispatch`) — so a
// consumer imports the contract, a port, or the runtime kernel with types intact.
// The BIN pass is separate (no dts, shebang banner) so `agent-runtime` runs as an
// executable; the bin name is a placeholder S9 rebrands.
export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      loader: 'src/loader.ts',
      dispatch: 'src/dispatch.ts',
      main: 'src/main.ts',
      events: 'src/events.ts',
      'ports/memory': 'src/ports/memory.ts',
      'ports/event-tap': 'src/ports/event-tap.ts',
      'capabilities/event-tap': 'src/capabilities/event-tap/index.ts',
    },
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: true,
    sourcemap: true,
  },
]);
