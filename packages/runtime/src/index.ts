// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export: the runtime-owned lifecycle-event taxonomy, the
// event-tap capability PORT interface (EventTapHost) and the example substrate.
// The events and the event-tap port are also reachable at their own subpaths
// (`./events`, `./ports/event-tap`). Zero `@cratylus/*` deps.
//
// THE LEDGER API, for a harness binding (the omp extension's builder dispatch
// check) and for another package (forge): the ledger fold, readiness, served
// concepts and owned examples of a cut (`cutView`), every recorded cut with its
// phase (`cutsInLedger`), the pure fold and reading, and the lifecycle append
// (`appendLifecycle`). The same facts are reached out of process through the
// CLI: `cratylus workPackage state|inventory --cut <name>` and
// `cratylus lifecycle '<event-json>'`.
// ─────────────────────────────────────────────────────────────────────────────

export * from './events.js';
export * from './ports/event-tap.js';
export * from './example-substrate.js';
export * from './offline-proof.js';
// The capabilities as they explain themselves (the concept journal and the work
// package capability), and the explanation each answers `--explain` with: what a
// projection generates a harness's account of a capability from.
export { JOURNAL } from './capabilities/concepts/dispatch.js';
export { WORK_PACKAGE } from './capabilities/work-package/dispatch.js';
export { type Explanation, explain } from './explanation.js';
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
