// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export: the runtime-owned lifecycle-event taxonomy, the
// event-tap capability PORT interface (EventTapHost) and the example substrate.
// The events and the event-tap port are also reachable at their own subpaths
// (`./events`, `./ports/event-tap`). PURE contracts — zero implementation, zero
// `@cratylus/*` deps.
// ─────────────────────────────────────────────────────────────────────────────

export * from './events.js';
export * from './ports/event-tap.js';
export * from './example-substrate.js';
