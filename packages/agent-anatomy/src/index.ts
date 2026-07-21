// ─────────────────────────────────────────────────────────────────────────────
// agent-anatomy AS A PLUGIN — the package's `defineAgentPlugin` default export.
//
// This makes agent-anatomy the FIRST agent-plugin: the baseline catalog + golden
// example + zero-config default, distributed as a peer plugin (not special-cased
// as "the corpus"). A consumer `npm i @leclabs/agent-anatomy` then `extends` this
// exported object — addressing by IMPORTED BINDING, never a string id.
//
// The dir fields point at the live source dirs this corpus already carries: the
// fragment (dimension-value) modules under `src/organs/<dim>/*.ts`, and the
// agent / skill preset modules. The forge resolver scans these paths exactly as
// the existing directory-scan does; no resolver logic lives here.
// ─────────────────────────────────────────────────────────────────────────────

import { defineAgentPlugin } from '@leclabs/agent-forge/resolve';

export default defineAgentPlugin({
  name: 'anatomy',
  fragments: './src/organs',
  agents: './src/agents',
  skills: './src/skills',
});
