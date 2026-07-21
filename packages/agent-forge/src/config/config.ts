// ─────────────────────────────────────────────────────────────────────────────
// The config-is-code layer — `agents.config.ts` is the SINGLE config home
// (NORTH-STAR §5, "one core, two skins"). The `npx` CLI and this programmatic
// config are BOTH thin callers into the same `resolve()`; this module is the TS
// shape the config file default-exports, plus the `defineAgentsConfig` identity
// helper that gives the file type-checking + IDE completion with NO build step.
//
// ── CONFIG/TOPOLOGY FORK — RESOLVED (P4, grounded NORTH-STAR §5) ──────────────
// The census surfaced a fork: the EXISTING `.agent-factory.config` JSON
// (`deploy/config.ts`'s `loadConfig`, the deploy TOPOLOGY) vs the NEW
// `agents.config.ts` (plugin-extends). DECISION: **`agents.config.ts` SUBSUMES
// `.agent-factory.config`.** config-is-code is the single home; the deploy
// topology becomes a FIELD here (`deploy`), not a second parallel config file.
// This is one-core-two-skins §5 taken to its end: one source of truth, the JSON
// retained only as a legacy skin. The subsumption is made REAL in code three ways:
//   1. `AgentsConfig.deploy` carries the topology (typed by reuse of the deploy
//      layer's own `AgentFactoryConfig` shape — DRY, one topology definition).
//   2. `deployTopologyOf` reads it out (the accessor deploy would consume).
//   3. `toAgentFactoryConfig` bridges it to the legacy consumer shape so the
//      existing `deploy/config.ts` resolver (`resolveHost`/`fleetTargets`) folds
//      the code-config topology UNCHANGED — no duplicate topology resolver.
// NOT done in P4 (forward seam, non-blocking): rewiring `deploy`'s `loadConfig`
// call sites to prefer `agents.config.ts` over the JSON — a deploy migration
// owned by the founding-CLI restructure (P6). The DECISION + its type-level home
// + the bridge land here now; the call-site cutover is P6's.
// ─────────────────────────────────────────────────────────────────────────────

import { type AgentFactoryConfig, SCHEMA_VERSION } from '../deploy/config.js';
import type { AgentPlugin } from '../resolve/plugin.js';
import type { PatchEntry } from '../resolve/resolve.js';

/**
 * The deploy TOPOLOGY as an `agents.config.ts` field — the SAME shape the legacy
 * `.agent-factory.config` JSON carries, minus `schema` (in code the TS type IS
 * the schema; a version int is a JSON-file concern). Defined by `Omit` off the
 * deploy layer's `AgentFactoryConfig` so there is exactly ONE topology definition
 * (DRY): the fleet + per-host records deploy already resolves.
 */
export type DeployTopology = Omit<AgentFactoryConfig, 'schema'>;

/**
 * The `agents.config.ts` default-export shape — the single config home.
 * `extends` are REAL imported `AgentPlugin` objects (addressing by imported
 * binding, never a string id; NORTH-STAR §3). `patches` target a fragment by its
 * imported binding (P4 ships the empty/zero-config path; targeting a string
 * fragment needs the reference-bearing authoring shape deferred as a canon
 * candidate, NORTH-STAR §11). `deploy` is the subsumed topology (fork above).
 */
export interface AgentsConfig {
  /** Ordered plugins this project extends — imported objects, fold in position. */
  readonly extends: readonly AgentPlugin[];
  /** Consumer patches — an ARRAY targeting fragments by imported binding (§4). */
  readonly patches?: readonly PatchEntry[];
  /** The deploy topology (subsumes `.agent-factory.config`; fork resolution above). */
  readonly deploy?: DeployTopology;
}

/**
 * Declare an `agents.config.ts`. Identity helper (like `defineConfig`): returns
 * its argument unchanged, present only so the config file gets type-checking +
 * IDE completion on `extends`/`patches`/`deploy` with no build step.
 */
export function defineAgentsConfig(config: AgentsConfig): AgentsConfig {
  return config;
}

/** Read the subsumed deploy topology out of a code-config (`null` when absent). */
export function deployTopologyOf(config: AgentsConfig): DeployTopology | null {
  return config.deploy ?? null;
}

/**
 * Bridge a code-config topology to the legacy `AgentFactoryConfig` consumer shape
 * (re-attaches the current `schema`), so the existing `deploy/config.ts` resolver
 * folds the `agents.config.ts` topology with NO duplicate resolver — the concrete
 * proof the JSON is subsumed, not merely paralleled.
 */
export function toAgentFactoryConfig(
  topology: DeployTopology,
): AgentFactoryConfig {
  return { schema: SCHEMA_VERSION, ...topology };
}
