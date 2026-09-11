// The omp (Oh My Pi) harness surface. PROJECTION-ONLY, like its siblings.

// The anatomy→omp projection — the third harness, and the first whose per-agent
// scope is a DIRECTORY (`../.agents/<name>/`) rather than a file's front-matter
// or a global selector. The composed Target body is harness-neutral, so the
// `ResolvedSkill` shape is shared with the claude and codex adapters.
export {
  OMP_GUARDRAIL_MODULE,
  OMP_LAUNCHER_FILE,
  OMP_LAUNCHER_SCRIPT,
  OMP_OVERLAY_FILE,
  OMP_SESSION_DIR,
  OMP_SESSION_MODULE,
  type ResolvedSkill,
  agentToOmpAppendSystem,
  ompAgentRel,
  ompGuardrailExtensions,
  ompHarnessAdapter,
  ompLaunchSurface,
  ompOverlayYaml,
  ompScopeActivatedExtensions,
  ompSkillRel,
  skillToOmpMd,
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
