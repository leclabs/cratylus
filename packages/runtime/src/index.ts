// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export. Zero `@cratylus/*` deps.
//
// THE LEDGER API, for a harness binding and for another package: the work the
// ledger records in flight and ended (`workIn`), the pure fold (`foldWork`),
// and the lifecycle append (`appendLifecycle`). The same facts are reached out
// of process through the CLI: `cratylus ledger state` and `cratylus lifecycle
// '<event-json>'`. The acting agent a capability call is made by is named in
// `ACTING_AGENT_ENV`.
// ─────────────────────────────────────────────────────────────────────────────

// The concept journal as it explains itself: its verbs, each with its effect.
export { JOURNAL } from './capabilities/concepts/dispatch.js';
// A context's current design as a release delivers it, projected at the release's build.
export {
  type DeliveredContext,
  deliverContext,
} from './capabilities/concepts/delivered.js';
// The version skew capability as it explains itself, which the omp extension carries in the
// artifacts it projects, so the version tool is offered whatever command they reach.
export { VERSION_SKEW } from './capabilities/version-skew/index.js';
export { explain } from './explanation.js';
export { ACTING_AGENT_ENV, actingAgent } from './acting-agent.js';
export {
  type Cost,
  type Ending,
  LEDGER,
  LEDGER_DIR,
  LIFECYCLE_KINDS,
  type LedgerDraft,
  type LedgerEntry,
  OUTCOMES,
  type Outcome,
  type Story,
  type Task,
  type Work,
  foldWork,
  workIn,
} from './capabilities/ledger/index.js';
export {
  type LifecycleEvent,
  appendLifecycle,
  lifecycleEvent,
} from './lifecycle/index.js';
