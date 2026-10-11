// The OMP-native projection and configurable behavior harness surfaces.

// The anatomy→omp projection: one `agents/<name>.md` definition under the owned
// root, which omp discovers itself as an extension package's, for dispatch and for
// `omp --agent <name>` alike. The composed Target body is harness-neutral.
// The behavior runner binds caller-supplied model, peer and tool fixtures.
export { createOmpAgentScenarioRunner } from './scenario.js';
export type {
  OmpBehaviorRecord,
  OmpScenario,
  OmpScenarioHarnessConfig,
  OmpScenarioRunner,
} from './scenario.js';
export {
  OMP_AGENT_DEF_DIR,
  OMP_EXTENSIONS_DIR,
  OMP_ISOLATION_MODULE,
  OMP_NATIVE_AGENTS,
  OMP_ASSIGNMENT_KEY,
  OMP_PACKAGE_DIR,
  OMP_SESSION_MODULE,
  type ResolvedSkill,
  agentToOmpMd,
  ompAgentRel,
  ompCapabilityExtensions,
  OMP_CRATYLUS_MODULE,
  ompDispatchIsolation,
  ompIsolationExtensions,
  ompHarnessAdapter,
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
