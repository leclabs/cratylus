// ─────────────────────────────────────────────────────────────────────────────
// The design runtime CAPABILITY — the concept lattice, met in the design's own
// verbs, reached via `cratylus design <verb>`.
//
// Ships INSIDE the runtime, as the event-tap capability does: `main.ts` routes
// `design <verb>` to {@link dispatchDesign}. It composes the design records
// (`design.ts`) with the view, and joins the plans standing on each concept
// through the plan capability's reading. A host is built per invocation from the
// repository it runs in.
// ─────────────────────────────────────────────────────────────────────────────

export { designHost, dispatchDesign } from './dispatch.js';
