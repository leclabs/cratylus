// The deploy layer — agent-forge's host-placement stage. Consumes an
// already-projected render tree (agents/ + skills/) and applies the scope
// accident to a host `.claude/` root: ships the generated defs (SOUL,
// overwritten freely), seeds the self-authored sidecars if-absent (never
// clobbered), stages skill-dir committed `assets:` companions, resolves per-host
// topology from `.agent-factory.config`, and founds a greenfield society (`init`).
//
// Faithful TS port of agent-anatomy's Python toolkit (deploy.py / config.py / place/ /
// init.py). The PROJECTION itself is agent-forge's claude adapter; this layer
// consumes its output.

export {
  CONFIG_ENV,
  CONFIG_NAME,
  ConfigError,
  type FleetTargetsOpts,
  type HostParams,
  type AgentFactoryConfig,
  type ResolveHostOpts,
  SCHEMA_VERSION,
  configPath,
  fleetTargets,
  loadConfig,
  repoRoot,
  resolveHost,
} from './config.js';

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
} from './bundle.js';

export {
  type CommandResult,
  type CommandRunner,
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
  placeAgentsSsh,
  placeHooksSsh,
  placeSkillsSsh,
  realRunner,
  shQuote,
  type SshPlaceOpts,
} from './ssh.js';

export {
  type DeployFleetOpts,
  type DeployOpts,
  type DeploySingleOpts,
  type DeploySingleResult,
  type FleetHostStatus,
  type FleetResult,
  type Scope,
  deployFleet,
  deployHost,
  deploySingle,
  resolveNames,
  treeNames,
} from './deploy.js';

export {
  DEFAULT_SUBJECT,
  PLAN_STATES,
  foundingAgentsMd,
  foundingPlanMd,
  type InitOpts,
  type InitResult,
  initSociety,
} from './init.js';
