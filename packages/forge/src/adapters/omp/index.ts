// The omp (Oh My Pi) harness surface. PROJECTION-ONLY, like its siblings.

// The anatomy→omp projection — the third harness, and the first whose per-agent
// scope is a DIRECTORY (`profiles/<name>/agent/`) rather than a file's front-matter
// or a global selector. The composed Target body is harness-neutral, so the
// `ResolvedSkill` shape is shared with the claude and codex adapters.
export {
  type ResolvedSkill,
  agentToOmpAppendSystem,
  skillToOmpMd,
  ompGuardrailExtensions,
  ompProfileDir,
  ompAgentRel,
  ompExtensionRel,
  ompHarnessAdapter,
} from './render.js';

// The canonical→native event map and the ACT bindings beside it. Exported so a
// corpus gate can assert every key is a declared member — and, here specifically,
// that no entry carries an `unnarrowed` loss, because omp's hook surface is CODE
// and can narrow on anything the event carries.
export {
  canonicalToOmp,
  canonicalActToOmp,
  ompBindingOf,
  OMP_BLOCKING_EVENTS,
} from './events.js';
