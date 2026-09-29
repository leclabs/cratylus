// ─────────────────────────────────────────────────────────────────────────────
// The plan runtime CAPABILITY — plans and their units, met in the plan's own
// verbs, reached via `cratylus plan <verb>`.
//
// Ships INSIDE the runtime, as the event-tap capability does: `main.ts` routes
// `plan <verb>` to {@link dispatchPlan}. It composes the plan (`plan.ts`), unit
// (`unit.ts`) and pin (`pin.ts`) records with the design, the notebook's owed
// rulings and the view, and receives its lifecycles from the host runtime config.
// A host is built per invocation from the repository it runs in.
// ─────────────────────────────────────────────────────────────────────────────

export { dispatchPlan, planHost } from './dispatch.js';
export { lifecycles } from './reading.js';
