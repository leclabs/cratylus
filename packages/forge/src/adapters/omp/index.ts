// The omp (Oh My Pi) harness surface. PROJECTION-ONLY, like claude's.

// The anatomy→omp projection — the only one of the two harnesses whose
// persona is a NATIVE artifact of the harness: one `agent/agents/<name>.md`
// definition that omp discovers itself, read back by ONE generic launcher for a
// main session. The composed Target body is harness-neutral, so the
// `ResolvedSkill` shape is shared with the claude adapter.
export {
  OMP_AGENT_DEF_DIR,
  OMP_GUARDRAIL_MODULE,
  OMP_ISOLATION_MODULE,
  OMP_LAUNCHER_FILE,
  OMP_LAUNCHER_SCRIPT,
  OMP_OVERLAY_FILE,
  OMP_PERSONA_DIR,
  OMP_PERSONA_BADGE_MODULE,
  OMP_SESSION_DIR,
  OMP_SESSION_MODULE,
  type ResolvedSkill,
  agentToOmpMd,
  ompAgentRel,
  ompDispatchIsolation,
  ompGuardrailExtensions,
  ompIsolationExtensions,
  ompHarnessAdapter,
  ompLaunchSurface,
  ompOverlayYaml,
  ompPersonaBadgeExtensions,
  ompRoleRouting,
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
  OMP_REFUSAL_SHAPE,
} from './events.js';
