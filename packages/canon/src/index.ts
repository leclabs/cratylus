// ─────────────────────────────────────────────────────────────────────────────
// canon AS A PLUGIN — the package's `defineAgentPlugin` default export.
//
// This makes canon the FIRST agent-plugin: the baseline catalog + golden
// example + zero-config default, distributed as a peer plugin (not special-cased
// by the projector). A consumer `npm i @cratylus/canon` then `extends` this
// exported object — addressing by IMPORTED BINDING, never a string id.
//
// The dir fields point at the live source dirs this canon already carries: the
// factors' values under `src/factors/<factor>/*.ts`, the agent modules under
// `src/agents/*.ts` (each role's generic holder and the personas, composed in
// `compose.ts`), and the skill modules. The forge resolver scans these paths
// exactly as the existing directory-scan does; no resolver logic lives here.
//
// SELF-LOCATION (why absolute, not `'./src/factors'`): a consumer `extends`
// this plugin by importing the OBJECT, which has lost its package-root provenance
// — a bare relative dir would be unresolvable to the config-is-code loader,
// wherever the package is installed. So the plugin resolves its own dirs against
// `import.meta.url` at definition time; the loader consumes the absolute paths
// verbatim. This module is at `src/index.ts`, so the dirs are its siblings.
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from 'node:url';
import { defineAgentPlugin } from '@cratylus/schema';
import { CANONICAL_EVENTS, MANIFEST } from './manifest.js';
import { RULESETS } from './rulesets.js';

export {
  CompositionRefusal,
  holder,
  type Overrides,
  persona,
  type RoleProfile,
  type Stated,
} from './compose.js';
export { ASSIGNMENT_CONTRACTS, DELIVERABLE_CONTRACTS } from './contracts.js';
export { MANIFEST, RULESETS };
export { businessAnalystRole } from './roles/business-analyst.js';
export { codeReviewerRole } from './roles/code-reviewer.js';
export { softwareEngineerRole } from './roles/software-engineer.js';
export { techLeadRole } from './roles/tech-lead.js';
export { testEngineerRole } from './roles/test-engineer.js';

/** Resolve a sibling dir of this module to an absolute path (self-location). */
const dir = (rel: string): string =>
  fileURLToPath(new URL(rel, import.meta.url));

export default defineAgentPlugin({
  name: 'canon',
  // WHICH factors exist — this canon's own manifest, carried on the plugin so
  // a consumer projecting canon gets canon's factor set without the projector
  // containing it.
  manifest: MANIFEST,
  // WHICH lifecycle events exist — carried the same way, and for the same reason.
  // The projector needs the members to emit a host's runtime configuration and
  // receives them here as DATA on the plugin, never as an import of this package.
  events: CANONICAL_EVENTS,
  // WHICH rulesets exist — carried the same way, so an install offers the rulesets
  // the canon declares (`rulesets.ts`).
  rulesets: RULESETS,
  factors: dir('./factors'),
  agents: dir('./agents'),
  skills: dir('./skills'),
});
