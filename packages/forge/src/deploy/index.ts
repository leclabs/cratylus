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
  type SkillCompanions,
  type StageAssetsOpts,
  stageAssets,
  walkSkillFiles,
} from './bundle.js';

export {
  type DeployKind,
  emptyReport,
  type PlaceOpts,
  type PlaceReport,
  type PlaceResult,
  type RenderTree,
} from './types.js';

export { placeAgentsLocal, placeSkillsLocal } from './local.js';

export {
  hookTreeNames,
  mergeHooksSettings,
  placeHooksLocal,
} from './hooks.js';

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
  DEFAULT_PROJECT_TEMPLATE,
  type ProjectTemplate,
} from './project-template.js';

export {
  DEFAULT_SUBJECT,
  type ScaffoldProjectOpts,
  type ScaffoldProjectResult,
  scaffoldProject,
} from './init.js';
