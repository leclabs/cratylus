import { defineConfig } from 'tsup';

// runtime is a library: one entry per `exports` subpath, each with its .d.ts, so a
// consumer imports the contracts (`.`, `./events`, `./ports/event-tap`), a
// capability module, the capability keyspace, or `capabilityCommands` (`./main`) with types
// intact. The executable is the installable CLI package's; this one ships no bin.
export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      main: 'src/main.ts',
      'bin-name': 'src/bin-name.ts',
      capability: 'src/capability.ts',
      'runtime-config': 'src/runtime-config.ts',
      ulid: 'src/ulid.ts',
      'verb-flags': 'src/verb-flags.ts',
      events: 'src/events.ts',
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
