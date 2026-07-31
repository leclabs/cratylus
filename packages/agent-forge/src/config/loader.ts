// ─────────────────────────────────────────────────────────────────────────────
// The `agents.config.ts` loader + THE LOAD STEP (the ratified P2 seam).
//
// `c12`/`bundle-require`-style: load a TS/ESM config with NO build step (node ≥24
// strips types on import; the config's `extends` are REAL imports), then wire the
// step P1/P2/P3 left open:
//
//   AgentPlugin (dirs only) ──loadPlugins──▶ LoadedPlugin (fragment contributions)
//                                                     │
//                                                     ▼  resolve()
//                                              ResolvedAgentSet
//
// P1's `AgentPlugin` declares only WHICH DIRS a plugin ships; P2's `resolve()`
// folds an already-loaded `LoadedPlugin` model. The gap between them — scan each
// plugin's dirs into fragment nodes + originating contributions — is THIS module.
// It reuses P3's `discoverPluginFragments` (multi-plugin, object-import addressed,
// cross-plugin acyclicity enforced) for the scan, then lifts each
// `DiscoveredFragment{node, body}` → a `PatchEntry{target: node, op:'replace'}` (a
// plugin ORIGINATES its fragment's base via `replace`, per `resolve.ts`).
//
// MODULE RESOLUTION (the concern P3 handed to P4): an imported plugin OBJECT has
// lost its package-root provenance, so a `fragments` dir must resolve to an
// ABSOLUTE path. A plugin SELF-LOCATES its dirs (canon resolves them against its
// own `import.meta.url`), which works wherever the package is installed. A
// RELATIVE dir is resolved against `rootDir` (the config file's dir by default) as
// a local/dev fallback — e.g. a `file:`-linked pre-publish plugin.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mergeAnatomy } from '../anatomy/index.js';
import {
  type DiscoveredPlugin,
  type PluginFragmentSource,
  discoverPluginFragments,
} from '../catalog/index.js';
import type { AgentPlugin } from '../resolve/plugin.js';
import {
  type LoadedPlugin,
  type PatchEntry,
  type ResolvedAgentSet,
  resolve,
} from '../resolve/resolve.js';
import type { AgentsConfig } from './config.js';

/** A file that does not default-export a well-formed `AgentsConfig`. Loud, never silent. */
export class ConfigShapeError extends Error {
  constructor(readonly configPath: string) {
    super(
      `${configPath}: not a valid agents.config — expected a default export with an \`extends\` array (e.g. \`export default defineAgentsConfig({ extends: [canon], patches: [] })\`)`,
    );
    this.name = 'ConfigShapeError';
  }
}

/** Structural guard: a default export carrying an `extends` array is an `AgentsConfig`. */
function isAgentsConfig(v: unknown): v is AgentsConfig {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as { extends?: unknown }).extends)
  );
}

/**
 * Load an `agents.config.ts` (TS/ESM, NO build step) → its default `AgentsConfig`.
 * The dynamic `import` resolves the config's REAL plugin imports; node strips the
 * TS types. A file that does not default-export an `AgentsConfig` throws loudly.
 */
export async function loadAgentsConfig(
  configPath: string,
): Promise<AgentsConfig> {
  const abs = resolvePath(configPath);
  const mod = (await import(pathToFileURL(abs).href)) as { default?: unknown };
  if (!isAgentsConfig(mod.default)) {
    throw new ConfigShapeError(abs);
  }
  return mod.default;
}

/**
 * THE LOAD STEP: map each extended `AgentPlugin` → a `LoadedPlugin`. Enumerates
 * every plugin's fragment dir via `discoverPluginFragments`, then lifts each
 * discovered fragment `{node, body}` → a `PatchEntry{target: node, op:'replace',
 * value: body}` on that plugin's `contributions`. The output preserves `extends`
 * ORDER (a plugin with no `fragments` dir yields empty contributions but keeps its
 * position), so the resolver's ordered fold sees plugins in authored order.
 *
 * @param rootDir base for resolving a RELATIVE plugin `fragments` dir (self-located
 *        absolute dirs are used verbatim). Defaults to the process cwd.
 */
export async function loadPlugins(
  plugins: readonly AgentPlugin[],
  rootDir: string = process.cwd(),
): Promise<LoadedPlugin[]> {
  const toAbs = (dir: string): string =>
    isAbsolute(dir) ? dir : resolvePath(rootDir, dir);

  // Only plugins that ship a `fragments` dir are scanned; the rest still become
  // LoadedPlugins (empty contributions), so extends-position is preserved.
  const withFragments = plugins.filter(
    (p): p is AgentPlugin & { fragments: string } => p.fragments !== undefined,
  );
  const sources: PluginFragmentSource[] = withFragments.map((p) => ({
    name: p.name,
    fragmentsDir: toAbs(p.fragments),
  }));

  // Single call → cross-plugin acyclicity is enforced across ALL sources at once
  // (P3 reuses P2's `validateReferenceGraph`). Output is 1:1 with `sources` order.
  const discovered = await discoverPluginFragments(
    sources,
    mergeAnatomy(plugins),
  );
  const byPlugin = new Map<AgentPlugin, DiscoveredPlugin>();
  withFragments.forEach((p, i) => {
    const d = discovered[i];
    if (d) byPlugin.set(p, d);
  });

  return plugins.map((p) => {
    const d = byPlugin.get(p);
    const contributions: PatchEntry[] = (d?.fragments ?? []).map((f) => ({
      target: f.node,
      op: 'replace',
      value: f.body,
    }));
    return { name: p.name, contributions };
  });
}

/**
 * Resolve a loaded `AgentsConfig` → `ResolvedAgentSet`: run THE LOAD STEP over
 * `extends`, then call P2's `resolve()` with the consumer `patches`. This is the
 * one shared path both skins (CLI + programmatic) call — no divergent code path.
 */
export async function resolveAgentsConfig(
  config: AgentsConfig,
  rootDir?: string,
): Promise<ResolvedAgentSet> {
  const extended = await loadPlugins(config.extends, rootDir);
  return resolve({ extends: extended, patches: config.patches });
}

/**
 * Top-level: load an `agents.config.ts` FILE and resolve it. Relative plugin dirs
 * resolve against the config file's own dir. Returns both the loaded config (for
 * reporting `extends`) and the resolved set.
 */
export async function composeFromFile(
  configPath: string,
): Promise<{ config: AgentsConfig; resolved: ResolvedAgentSet }> {
  const abs = resolvePath(configPath);
  const config = await loadAgentsConfig(abs);
  const resolved = await resolveAgentsConfig(config, dirname(abs));
  return { config, resolved };
}
