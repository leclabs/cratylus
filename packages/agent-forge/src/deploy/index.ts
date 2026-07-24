// The deploy layer — agent-forge's placement stage. Consumes an
// already-projected render tree (agents/ + skills/) and applies the scope
// accident to the LOCAL `.claude/` root: ships the generated defs (SOUL,
// overwritten freely), seeds the self-authored sidecars if-absent (never
// clobbered), stages skill-dir committed `assets:` companions, and scaffolds a
// greenfield project (`scaffoldProject`).
//
// The PROJECTION itself is agent-forge's claude adapter; this layer consumes its
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
