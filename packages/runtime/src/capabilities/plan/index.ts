// ─────────────────────────────────────────────────────────────────────────────
// The plan runtime CAPABILITY — plans and their units, met in the plan's own
// verbs, reached via `cratylus plan <verb>`.
//
// Ships INSIDE the runtime, as the event-tap and carry-on capabilities do: the
// kernel routes `plan <verb>` to {@link dispatchPlan} ahead of the discovered
// dispatch. It composes the plan (`plan.ts`), unit (`unit.ts`) and pin
// (`pin.ts`) records with the design, the notebook's owed rulings and the view,
// and receives its lifecycles from the host runtime config.
//
// No `runtimePlugin` instance: nothing registers one, and a host is built per
// invocation from the repository it runs in.
// ─────────────────────────────────────────────────────────────────────────────

export { dispatchPlan, lifecycles, planHost } from './dispatch.js';
