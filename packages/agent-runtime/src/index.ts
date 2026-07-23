// ─────────────────────────────────────────────────────────────────────────────
// @leclabs/agent-runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export: the RuntimePlugin face + its `defineRuntimePlugin`
// identity helper, the capability PORT interfaces (MemoryStrategy, EventTapHost),
// and the runtime-owned lifecycle-event taxonomy. Each is also reachable at its own
// subpath (`./ports/memory`, `./ports/event-tap`, `./events`). PURE contracts +
// one identity helper — zero implementation, zero `@leclabs/*` deps.
// ─────────────────────────────────────────────────────────────────────────────

export * from './plugin.js';
export * from './events.js';
export * from './ports/memory.js';
export * from './ports/event-tap.js';
