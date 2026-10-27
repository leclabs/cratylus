// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/runtime — the per-host RUNTIME contract leaf.
//
// The barrel for the `.` export. Zero `@cratylus/*` deps.
// ─────────────────────────────────────────────────────────────────────────────

// The model check as it explains itself, which the omp extension offers as a tool.
export { MODEL_CHECK } from './capabilities/model/index.js';
// The version skew capability as it explains itself, which the omp extension carries in the
// artifacts it projects, so the version tool is offered whatever command they reach.
export { VERSION_SKEW } from './capabilities/version-skew/index.js';
export { explain } from './explanation.js';
// The command as it describes itself: what it is for, how using it starts, where its theory is.
export {
  type CommandExplanation,
  EXPLANATION,
  ORIENTATION,
  PURPOSE,
  START,
  THEORY,
} from './self-description.js';
