// The `config/` public surface — the config-is-code layer (NORTH-STAR §5).
// `defineAgentsConfig` is what an `agents.config.ts` imports; the loader + scaffold
// are what the CLI (and any programmatic caller) drives.
export {
  type AgentsConfig,
  type DeployTopology,
  defineAgentsConfig,
  deployTopologyOf,
  toAgentFactoryConfig,
} from './config.js';
export {
  ConfigShapeError,
  composeFromFile,
  loadAgentsConfig,
  loadPlugins,
  resolveAgentsConfig,
  resolveDeployConfig,
} from './loader.js';
export {
  type AddResult,
  CANON_PACKAGE,
  CONFIG_FILE,
  ConfigEditError,
  type ScaffoldResult,
  SCAFFOLD_SOURCE,
  addPlugin,
  identForPackage,
  scaffoldAgentsConfig,
} from './scaffold.js';
