// ─────────────────────────────────────────────────────────────────────────────
// The workPackage runtime CAPABILITY — a cut's work packages, their dependency
// graph, the builders' commits and the cut's counts, reached via
// `cratylus workPackage <verb> --cut <context>/<name>`.
//
// Ships INSIDE the runtime, beside `concepts`: `main.ts` routes
// `workPackage <verb>` to {@link dispatchWorkPackage}. The cut's log is kept
// under the repository's git common directory, shared by its worktrees; its
// efficiency figures are recorded in the concept journal.
// ─────────────────────────────────────────────────────────────────────────────

export { dispatchWorkPackage } from './dispatch.js';
