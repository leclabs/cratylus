// ─────────────────────────────────────────────────────────────────────────────
// The event-tap runtime CAPABILITY — the passive {@link EventTapHost} observer,
// reached via `cratylus eventTap <verb>`.
//
// Packaged as a capability MODULE of `@cratylus/runtime` (a subpath export,
// not a standalone `@cratylus/*` package) — see the shard's package-vs-module
// decision. It depends on NOTHING from `@cratylus/forge`: the runtime→forge DAG is
// never inverted. It no longer "provides its own Claude harness mapping" either —
// that sentence described a byte-identical copy of forge's map. The map arrives as
// configuration the projection emitted (ARCHITECTURE property 4).
//
// `main.ts` routes `eventTap <verb>` to {@link dispatchEventTap} (the verb surface
// that parses the tap's own flags).
//
// ONE SIGN, TWO REGISTERS: `event-tap` (the dir basename, the port module, the
// skill cell) and `eventTap` (the keyspace member, the routing word every refusal
// opens with) are the kebab/camel faces of a single anchor. The abbreviation `tap`
// is NOT a third sign and is not accepted anywhere — see `dispatch.ts`'s header.
// ─────────────────────────────────────────────────────────────────────────────

export {
  EventTapHostClaude,
  EVENT_TAP_ID,
  type EventTapInstall,
} from './claude.js';
export {
  EVENT_TAP_HARNESSES,
  hasEventTapStrategy,
  invokingHarness,
} from './harness.js';
export {
  dispatchEventTap,
  type EventTapDispatchOpts,
  type EventTapResult,
  type EventTapVerb,
} from './dispatch.js';
export {
  buildEventTapBlock,
  type ClaudeHooksBlock,
  mergeJsonKeys,
  reverseNativeEvents,
} from './claude-serialize.js';
