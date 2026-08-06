// ─────────────────────────────────────────────────────────────────────────────
// The config-is-code layer — `agents.config.ts` is the SINGLE config home
// (NORTH-STAR §5, "one core, two skins"). The `npx` CLI and this programmatic
// config are BOTH thin callers into the same `resolve()`; this module is the TS
// shape the config file default-exports, plus the `defineAgentsConfig` identity
// helper that gives the file type-checking + IDE completion with NO build step.
//
// ── NO DEPLOY TOPOLOGY — the fork dissolved, not resolved ─────────────────────
// An earlier census framed a fork between the `.cratylus.config` JSON (a
// per-host deploy TOPOLOGY) and this `agents.config.ts`, and resolved it by
// subsumption: the topology became a `deploy` field here. The stage ontology
// then removed the subject on both sides. `deploy` places a render tree into the
// LOCAL `.claude/` root; installing the packages on a host is npm's, and
// iterating N hosts is the operator's outer loop around the whole pipeline.
// Neither is a stage, so there is no topology for any config to carry — the JSON
// and the `deploy` field are both gone. `agents.config.ts` is the single config
// home for the plugin set (`extends` / `patches`), and only that.
// ─────────────────────────────────────────────────────────────────────────────

import type { AgentPlugin } from '../resolve/plugin.js';
import type { PatchEntry } from '../resolve/resolve.js';

/**
 * The `agents.config.ts` default-export shape — the single config home.
 * `extends` are REAL imported `AgentPlugin` objects (addressing by imported
 * binding, never a string id; NORTH-STAR §3). `patches` target a fragment by its
 * imported binding. Only the empty/zero-config path ships today: targeting a string
 * fragment needs the reference-bearing authoring shape, which is deferred as a canon
 * candidate.
 */
export interface AgentsConfig {
  /** Ordered plugins this project extends — imported objects, fold in position. */
  readonly extends: readonly AgentPlugin[];
  /** Consumer patches — an ARRAY targeting fragments by imported binding (§4). */
  readonly patches?: readonly PatchEntry[];
}

/**
 * Declare an `agents.config.ts`. Identity helper (like `defineConfig`): returns
 * its argument unchanged, present only so the config file gets type-checking +
 * IDE completion on `extends`/`patches` with no build step.
 */
export function defineAgentsConfig(config: AgentsConfig): AgentsConfig {
  return config;
}
