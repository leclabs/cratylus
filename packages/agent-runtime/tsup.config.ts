import { defineConfig } from 'tsup';

// agent-runtime IS a library (contra agent-memory's single bundled CLI): it emits
// .d.ts for every entry and exposes one entry per `exports` subpath, so a consumer
// imports the contract (`.`), a single port (`./ports/*`), or the event taxonomy
// (`./events`) with types intact. No CLI/bin pass — that is a later shard. The
// entries mirror the package.json `exports` map one-for-one.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    events: 'src/events.ts',
    'ports/memory': 'src/ports/memory.ts',
    'ports/event-tap': 'src/ports/event-tap.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
});
