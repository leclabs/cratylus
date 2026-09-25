// ─────────────────────────────────────────────────────────────────────────────
// The note runtime CAPABILITY — the notebook, met in its own verbs, reached via
// `cratylus note <verb>`.
//
// Ships INSIDE the runtime, as the event-tap and carry-on capabilities do: the
// kernel routes `note <verb>` to {@link dispatchNote} ahead of the discovered
// dispatch. It composes the notebook records (`notebook.ts`) with the view, and
// names what a note blocks through the plan capability's reading.
//
// No `runtimePlugin` instance: nothing registers one, and a host is built per
// invocation from the repository it runs in.
// ─────────────────────────────────────────────────────────────────────────────

export { dispatchNote, noteHost } from './dispatch.js';
