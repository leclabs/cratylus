// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export: the example substrate and the offline proof.
// Zero `@cratylus/*` deps.
//
// THE LEDGER API, for a harness binding (the omp extension's builder dispatch
// check and freeze gate) and for another package (forge): the ledger fold,
// readiness, served concepts and owned examples of a cut (`cutView`), every
// recorded cut with its phase (`cutsInLedger`), every frozen cut with what it
// freezes (`frozenCuts`), the pure fold and reading, and the lifecycle append
// (`appendLifecycle`). The same facts are reached out of process through the
// CLI: `cratylus workPackage state|inventory --cut <name>`, `cratylus
// workPackage frozen` and `cratylus lifecycle '<event-json>'`. The acting
// agent a capability call is made by is named in `ACTING_AGENT_ENV`.
// ─────────────────────────────────────────────────────────────────────────────

export * from './example-substrate.js';
export * from './offline-proof.js';
// The concept journal as it explains itself: its verbs, each with its effect.
export { JOURNAL } from './capabilities/concepts/dispatch.js';
// The version skew capability as it explains itself, which the omp extension carries in the
// artifacts it projects, so the version tool is offered whatever command they reach.
export { VERSION_SKEW } from './capabilities/version-skew/index.js';
export { explain } from './explanation.js';
export { ACTING_AGENT_ENV, actingAgent } from './acting-agent.js';
export {
  type CommitRecord,
  type ConceptVerdict,
  type Cut,
  type CutConcept,
  type CutExample,
  type CutPhase,
  type CutReading,
  type CutRecord,
  type CutState,
  type CutView,
  type Figures,
  type FrozenCut,
  JUDGMENT_DIR,
  LEDGER_DIR,
  LIFECYCLE_KINDS,
  type LedgerDraft,
  type LedgerEntry,
  type OwnedExample,
  type PackageStatus,
  type Round,
  type ServedConcept,
  type WorkPackage,
  cutView,
  cutsInLedger,
  foldCut,
  frozenCuts,
  readCut,
} from './capabilities/work-package/index.js';
export {
  type LifecycleEvent,
  appendLifecycle,
  lifecycleEvent,
} from './lifecycle/index.js';
export { WATCHED, completionCheck } from './completion-check/index.js';
