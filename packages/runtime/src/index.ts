// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export: the example substrate and the offline proof.
// Zero `@cratylus/*` deps.
//
// THE LEDGER API, for a harness binding (the omp extension's builder dispatch
// check) and for another package (forge): the ledger fold, readiness, served
// concepts and owned examples of a cut (`cutView`), every recorded cut with its
// phase (`cutsInLedger`), the pure fold and reading, and the lifecycle append
// (`appendLifecycle`). The same facts are reached out of process through the
// CLI: `cratylus workPackage state|inventory --cut <name>` and
// `cratylus lifecycle '<event-json>'`.
// ─────────────────────────────────────────────────────────────────────────────

export * from './example-substrate.js';
export * from './offline-proof.js';
// The concept journal as it explains itself: its verbs, each with its effect.
export { JOURNAL } from './capabilities/concepts/dispatch.js';
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
  readCut,
} from './capabilities/work-package/index.js';
export {
  type LifecycleEvent,
  appendLifecycle,
  lifecycleEvent,
} from './lifecycle/index.js';
export { WATCHED, completionCheck } from './completion-check/index.js';
