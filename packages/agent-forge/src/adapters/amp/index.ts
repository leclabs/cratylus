import { existsSync } from 'node:fs';
import type { Adapter, AdapterCapabilities, Scope } from '../../core/index.js';
import { canonicalToAmp } from './events.js';
import { paths } from './paths.js';
import { writeAmpAgents, writeAmpCommands, writeAmpHooks } from './plugins.js';
import { readAmp } from './read.js';
import { writeAmp } from './write.js';

/**
 * Amp adapter. Ground truth: harness-landscape-research.RETURN.md §2 "Amp"
 * ([AM1]–[AM9]).
 *
 * - user:    `~/.config/amp/{settings.json,AGENTS.md,plugins/}` + the shared
 *   `~/.agents/skills/` [AM1][AM4].
 * - project: `<cwd>/AGENTS.md` + `<cwd>/.agents/skills/`; `<cwd>/.amp/`
 *   carries `settings.json` (flat `amp.*` keys, MCP under
 *   `amp.mcpServers`) [AM1].
 *
 * Amp ("neo", 2026-05-06 [AM3]) folded toolboxes/custom-commands/hooks/
 * permissions into one TS Plugin API. Agents are built-ins reached through
 * `amp.createAgent()`; slash commands route through `amp.registerCommand()`;
 * event delivery is `amp.on(event, handler)` — legacy `amp.hooks` never
 * emitted. All three are capability `plugin`, delivered by the generated
 * `.amp/plugins/agent-forge-{agents,commands,hooks}.ts` [AM1][AM2][AM9].
 */

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'partial', // single concatenated AGENTS.md; per-rule metadata lost [AM1]
    skills: 'partial', // spec-form SKILL.md; files/paths/user_invocable unmodeled [AM4]
    commands: 'plugin', // amp.registerCommand() [AM2]
    agents: 'plugin', // amp.createAgent() [AM1][AM9]
    hooks: 'plugin', // amp.on() event registration; legacy amp.hooks retired [AM2][AM3][AM7]
    mcp: 'partial', // amp.mcpServers; auth/http_headers/bearer_token_env_var unmodeled
    permissions: 'none', // per-tool-call decisions live in plugin handlers, no config DSL [AM8]
    env: 'none', // no documented global env surface [AM1]
  },
  hooks: {
    supported: Object.keys(
      canonicalToAmp,
    ) as AdapterCapabilities['hooks']['supported'],
    matchers: 'none', // no verified amp.on() payload-matching field
    payload: 'shim', // a generated translation shim, not a native payload contract
  },
  scopes: ['user', 'project'],
};

export const ampAdapter: Adapter = {
  id: 'amp',
  capabilities,
  eventMap: canonicalToAmp,
  pluginEmitters: {
    agents: writeAmpAgents,
    commands: writeAmpCommands,
    hooks: writeAmpHooks,
  },
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return existsSync(p.ampDir) || existsSync(p.rulesFile);
  },
  read: readAmp,
  write: writeAmp,
};

export default ampAdapter;
