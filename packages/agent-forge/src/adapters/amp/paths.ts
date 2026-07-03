import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface AmpPaths {
  /** `.amp/` (project) or `~/.config/amp/` (user) — the workspace/user config home [AM1]. */
  ampDir: string;
  /** Flat `amp.*` keys home: `.amp/settings.json` (project) / `~/.config/amp/settings.json` (user) [AM1]. */
  settingsFile: string;
  /** AGENTS.md — project root (cwd) or the user tier `~/.config/amp/AGENTS.md` [AM1]. */
  rulesFile: string;
  /** The shared, natively-read Agent Skills dir — no bespoke amp dir [AM4]. */
  skillsDir: string;
  /** Plugin delivery home for agents/commands/hooks (Bun-run TS) [AM2]. */
  pluginsDir: string;
  /** `.amp/plugins/agent-forge-agents.ts` — default-exports amp.createAgent() calls [AM1][AM9]. */
  agentsPluginFile: string;
  /** Sidecar canonical form for agents, our source of truth on re-read. */
  agentsManifestFile: string;
  /** `.amp/plugins/agent-forge-commands.ts` — default-exports amp.registerCommand() calls [AM2]. */
  commandsPluginFile: string;
  /** Sidecar canonical form for commands, our source of truth on re-read. */
  commandsManifestFile: string;
  /** `.amp/plugins/agent-forge-hooks.ts` — default-exports amp.on() registrations [AM2][AM7]. */
  hooksPluginFile: string;
  /** Sidecar canonical form for hooks, our source of truth on re-read. */
  hooksManifestFile: string;
}

/**
 * Resolve Amp config paths.
 *
 * - user:    `~/.config/amp/{settings.json,AGENTS.md,plugins/}` + the shared
 *            `~/.agents/skills/` [AM1][AM4].
 * - project: `<cwd>/AGENTS.md` + `<cwd>/.agents/skills/`; `<cwd>/.amp/`
 *            carries settings.json + plugins/ [AM1][AM2][AM4].
 */
export function paths(scope: Scope, cwd: string): AmpPaths {
  if (scope === 'user') {
    const ampDir = join(homedir(), '.config', 'amp');
    const pluginsDir = join(ampDir, 'plugins');
    return {
      ampDir,
      settingsFile: join(ampDir, 'settings.json'),
      rulesFile: join(ampDir, 'AGENTS.md'),
      skillsDir: join(homedir(), '.agents', 'skills'),
      pluginsDir,
      agentsPluginFile: join(pluginsDir, 'agent-forge-agents.ts'),
      agentsManifestFile: join(pluginsDir, 'agent-forge-agents.yaml'),
      commandsPluginFile: join(pluginsDir, 'agent-forge-commands.ts'),
      commandsManifestFile: join(pluginsDir, 'agent-forge-commands.yaml'),
      hooksPluginFile: join(pluginsDir, 'agent-forge-hooks.ts'),
      hooksManifestFile: join(pluginsDir, 'agent-forge-hooks.yaml'),
    };
  }
  // project (and local, which has no clean amp-documented convention — falls
  // back to project paths; the engine's own local-tier gate handles scopes
  // an adapter doesn't declare).
  const ampDir = join(cwd, '.amp');
  const pluginsDir = join(ampDir, 'plugins');
  return {
    ampDir,
    settingsFile: join(ampDir, 'settings.json'),
    rulesFile: join(cwd, 'AGENTS.md'),
    skillsDir: join(cwd, '.agents', 'skills'),
    pluginsDir,
    agentsPluginFile: join(pluginsDir, 'agent-forge-agents.ts'),
    agentsManifestFile: join(pluginsDir, 'agent-forge-agents.yaml'),
    commandsPluginFile: join(pluginsDir, 'agent-forge-commands.ts'),
    commandsManifestFile: join(pluginsDir, 'agent-forge-commands.yaml'),
    hooksPluginFile: join(pluginsDir, 'agent-forge-hooks.ts'),
    hooksManifestFile: join(pluginsDir, 'agent-forge-hooks.yaml'),
  };
}
