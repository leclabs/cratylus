// ─────────────────────────────────────────────────────────────────────────────
// The note runtime CAPABILITY — the notebook, met in its own verbs, reached via
// `cratylus note <verb>`.
//
// Ships INSIDE the runtime, as the event-tap capability does: `main.ts` routes
// `note <verb>` to {@link dispatchNote}. It composes the notebook records
// (`notebook.ts`) with the view, and names what a note blocks through the plan
// capability's reading. A host is built per invocation from the repository it
// runs in.
// ─────────────────────────────────────────────────────────────────────────────

export { dispatchNote, noteHost } from './dispatch.js';
