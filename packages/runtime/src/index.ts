// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export: the runtime-owned lifecycle-event taxonomy and
// the capability PORT interfaces (EventTapHost, DesignHost, PlanHost, NoteHost).
// The events and the event-tap port are also reachable at their own subpaths
// (`./events`, `./ports/event-tap`); the design, plan and note ports ship in the
// barrel only. PURE contracts — zero implementation, zero `@cratylus/*` deps.
// ─────────────────────────────────────────────────────────────────────────────

export * from './events.js';
export * from './ports/event-tap.js';
export * from './ports/design.js';
export * from './ports/plan.js';
export * from './ports/note.js';
