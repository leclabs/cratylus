// The deploy layer — forge's placement stage. Consumes an
// already-projected render tree (agents/ + skills/) and applies the scope
// accident to the LOCAL `.claude/` root: ships the generated defs (Target,
// overwritten freely), seeds the self-authored sidecars if-absent (never
// clobbered), stages skill-dir committed `assets:` companions, and scaffolds a
// greenfield project (`scaffoldProject`), and PRUNES what a prior deploy of the
// same tree left orphaned (`manifest.ts` — attribution by record, never by
// naming convention, because this root also holds artifacts that are not ours).
//
// The PROJECTION itself is forge's claude adapter; this layer consumes its
// output and places it locally. Reaching another machine is transport, not a
// stage — see `deploy.ts`'s stage-boundary note.

export {
  SEED_FILES,
  episodicSeed,
  proceduralSeed,
  semanticSeed,
} from './seeds.js';

export {
  projectScope,
  type ScopeNote,
  type ScopeResult,
  userScope,
} from './scope.js';

export {
  type AssertShimsOpts,
  assertShimsResolvable,
  type ProbeRuntimeBinOpts,
  probeRuntimeBin,
  resetRuntimeBinProbe,
  type RuntimeBinProbe,
  runtimeBinRefusal,
  salientStderr,
  shimsSpawningRuntimeBin,
  type SkillCompanions,
  type StageAssetsOpts,
  stageAssets,
  walkSkillFiles,
  whichOnPath,
} from './bundle.js';

export {
  type DeployKind,
  emptyReport,
  type PlaceOpts,
  type PlaceReport,
  type PlaceResult,
  type RenderTree,
} from './types.js';

export {
  auditLocal,
  placeAgentsLocal,
  placeSkillsLocal,
  renderedFiles,
} from './local.js';
export type { DriftReport, Divergence } from './local.js';

export {
  hookTreeNames,
  mergeHooksSettings,
  placeHooksLocal,
} from './hooks.js';

// The host runtime config — the only deploy target that lands OUTSIDE the harness
// home, because the runtime is harness-independent. ARCHITECTURE property 4's
// producer: everything corpus-specific reaches the runtime as configuration the
// projection emitted.
export {
  type EmitRuntimeConfigOpts,
  type EmitRuntimeConfigResult,
  type EmittedEvents,
  type EmittedRuntimeConfig,
  emitRuntimeConfig,
  RUNTIME_CONFIG_ENV,
  RUNTIME_CONFIG_NAME,
  runtimeConfigDocument,
  runtimeConfigTarget,
  serializeRuntimeConfig,
} from './runtime-config.js';

export {
  applyPrune,
  type DeployManifest,
  emptyManifest,
  hasManifest,
  type KindRecord,
  MANIFEST_REL,
  MANIFEST_VERSION,
  nextKindRecord,
  readManifest,
  staleFiles,
  unattributable,
  unregisterHookCommands,
  unregisterHookCommandsAt,
  writeManifest,
} from './manifest.js';

export {
  type DeployOpts,
  type DeploySingleOpts,
  type DeploySingleResult,
  type Scope,
  deploySingle,
  resolveNames,
  treeNames,
} from './deploy.js';

export {
  DEPLOY_CHECK_EXIT,
  type DeployCheckExit,
} from './check-exit.js';

export {
  DEFAULT_PROJECT_TEMPLATE,
  type ProjectTemplate,
} from './project-template.js';

export {
  DEFAULT_SUBJECT,
  type ScaffoldProjectOpts,
  type ScaffoldProjectResult,
  scaffoldProject,
} from './init.js';
