// The `config/` public surface — the config-is-code layer.
// `defineAgentsConfig` is what an `agents.config.ts` imports; the loader + scaffold
// are what the CLI (and any programmatic caller) drives.
export { type AgentsConfig, defineAgentsConfig } from './config.js';
export {
  ConfigShapeError,
  composeFromFile,
  loadAgentsConfig,
  loadPlugins,
  resolveAgentsConfig,
} from './loader.js';
export {
  type AddResult,
  CONFIG_FILE,
  ConfigEditError,
  DEFAULT_PLUGIN_PACKAGE,
  type ScaffoldOpts,
  type ScaffoldResult,
  SCAFFOLD_SOURCE,
  addPlugin,
  identForPackage,
  scaffoldAgentsConfig,
  scaffoldSource,
} from './scaffold.js';
