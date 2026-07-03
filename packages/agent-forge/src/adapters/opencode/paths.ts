import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface OpencodePaths {
  /** AGENTS.md location for rules */
  rulesFile: string;
  /** .opencode/ directory (project) or ~/.config/opencode/ (user) */
  opencodeDir: string;
  /** Plugins directory; agent-forge-hooks.{ts,yaml} live here */
  pluginsDir: string;
  /** Generated executable JS shim that delegates to shell */
  hooksShimFile: string;
  /** Sidecar canonical-form YAML, our source of truth on re-read */
  hooksManifestFile: string;
  /** Skills directory containing per-skill subdirs with SKILL.md */
  skillsDir: string;
  /** `.opencode/agents/*.md`, filename = id [OC2] */
  agentsDir: string;
  /** `.opencode/commands/*.md`, filename = id [OC4] */
  commandsDir: string;
  /**
   * ONE config home: `opencode.json` — project root (project/local) or
   * `~/.config/opencode/opencode.json` (user). MCP lives under its `mcp` key
   * (typed local/remote, command as ARRAY [OC7]); permissions under its
   * `permission` key [OC8]. No sidecar mcp.json/permissions.json/env.json —
   * those are fabricated paths, never written, never read.
   */
  configFile: string;
}

/**
 * Resolve OpenCode config paths.
 *
 * - user:    ~/.config/opencode/{AGENTS.md,opencode.json,agents/,commands/}
 *            plus the hook-shim and skill-cell subdirs alongside them.
 * - project: <cwd>/{AGENTS.md,opencode.json}; <cwd>/.opencode/ carries the
 *            hook-shim and skill-cell subdirs, plus agents/ and commands/.
 * - local:   N/A — opencode has no clean local-scope convention; defaults
 *            to project paths plus a warning at compile time.
 */
export function paths(scope: Scope, cwd: string): OpencodePaths {
  if (scope === 'user') {
    const opencodeDir = join(homedir(), '.config', 'opencode');
    const pluginsDir = join(opencodeDir, 'plugins');
    return {
      rulesFile: join(opencodeDir, 'AGENTS.md'),
      opencodeDir,
      pluginsDir,
      hooksShimFile: join(pluginsDir, 'agent-forge-hooks.ts'),
      hooksManifestFile: join(pluginsDir, 'agent-forge-hooks.yaml'),
      skillsDir: join(opencodeDir, 'skills'),
      agentsDir: join(opencodeDir, 'agents'),
      commandsDir: join(opencodeDir, 'commands'),
      configFile: join(opencodeDir, 'opencode.json'),
    };
  }
  // project / local both go to the project tree
  const opencodeDir = join(cwd, '.opencode');
  const pluginsDir = join(opencodeDir, 'plugins');
  return {
    rulesFile: join(cwd, 'AGENTS.md'),
    opencodeDir,
    pluginsDir,
    hooksShimFile: join(pluginsDir, 'agent-forge-hooks.ts'),
    hooksManifestFile: join(pluginsDir, 'agent-forge-hooks.yaml'),
    skillsDir: join(opencodeDir, 'skills'),
    agentsDir: join(opencodeDir, 'agents'),
    commandsDir: join(opencodeDir, 'commands'),
    // Project-root config home, NOT under .opencode/ [OC1].
    configFile: join(cwd, 'opencode.json'),
  };
}
