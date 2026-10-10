// ─────────────────────────────────────────────────────────────────────────────
// The concepts runtime CAPABILITY — the concept journal, reached via
// `cratylus concepts <verb>`.
//
// Ships INSIDE the runtime, beside `eventTap` and `design`: `main.ts` routes
// `concepts <verb>` to {@link dispatchConcepts}. Any project that adopts the
// example-driven workflow keeps its own bounded contexts in its own journal,
// `design/journal` at the top of its git repository: concept versions and
// decisions appended through named verbs, the current design, each concept's
// history and the decisions computed from them.
// ─────────────────────────────────────────────────────────────────────────────

export { dispatchConcepts } from './dispatch.js';
