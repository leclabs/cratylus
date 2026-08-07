// The `config/` public surface — the config-is-code layer.
// `defineConfig` is what an `cratylus.config.ts` imports; the loader + scaffold
// are what the CLI (and any programmatic caller) drives.
export { type CratylusConfig, defineConfig } from './config.js';
export {
  ConfigShapeError,
  composeFromFile,
  loadConfig,
  loadPlugins,
  resolveConfig,
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
  scaffoldConfig,
  scaffoldSource,
} from './scaffold.js';
