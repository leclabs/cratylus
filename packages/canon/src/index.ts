// ─────────────────────────────────────────────────────────────────────────────
// canon AS A PLUGIN — the package's `defineAgentPlugin` default export.
//
// This makes canon the FIRST agent-plugin: the baseline catalog + golden
// example + zero-config default, distributed as a peer plugin (not special-cased
// as "the corpus"). A consumer `npm i @cratylus/canon` then `extends` this
// exported object — addressing by IMPORTED BINDING, never a string id.
//
// The dir fields point at the live source dirs this corpus already carries: the
// fragment modules under `src/dimensions/<dim>/*.ts`, and the agent / skill preset
// modules. The forge resolver scans these paths exactly as the existing
// directory-scan does; no resolver logic lives here.
//
// SELF-LOCATION (why absolute, not `'./src/dimensions'`): a consumer `extends`
// this plugin by importing the OBJECT, which has lost its package-root provenance
// — a bare relative dir would be unresolvable to the config-is-code loader,
// wherever the package is installed. So the plugin resolves its own dirs against
// `import.meta.url` at definition time; the loader consumes the absolute paths
// verbatim. This module is at `src/index.ts`, so the dirs are its siblings.
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from 'node:url';
import { defineAgentPlugin } from '@cratylus/schema';
import { foundingDoctrine } from './genus/founding-doctrine.js';
import { MANIFEST } from './manifest.js';

/** Resolve a sibling dir of this module to an absolute path (self-location). */
const dir = (rel: string): string =>
  fileURLToPath(new URL(rel, import.meta.url));

export default defineAgentPlugin({
  name: 'canon',
  // WHICH dimensions exist — this corpus's own manifest, carried on the plugin so
  // a consumer projecting canon gets canon's dimension set without the projector
  // containing it. The same carry as `preamble` below.
  manifest: MANIFEST,
  fragments: dir('./dimensions'),
  agents: dir('./agents'),
  skills: dir('./skills'),
  // The axiom rides the PLUGIN, so it survives projection by any consumer.
  preamble: foundingDoctrine,
  hooks: dir('./hooks'),
});
