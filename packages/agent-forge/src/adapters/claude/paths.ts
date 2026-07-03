import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface ClaudePaths {
  /** The .claude/ directory itself */
  claudeDir: string;
  /** CLAUDE.md location (null for local scope) */
  rulesFile: string | null;
  /** settings.json or settings.local.json */
  settingsFile: string;
  commandsDir: string | null;
  agentsDir: string | null;
  skillsDir: string | null;
  /**
   * The documented MCP-server home per scope [CC7]: project → `<repo>/.mcp.json`
   * (root key `mcpServers`); user + local → `~/.claude.json` (user servers at the
   * top-level `mcpServers` key, local servers under `projects[<cwd>].mcpServers`).
   * Never settings.json — settings carries MCP *policy* keys only [CC8].
   */
  mcpFile: string | null;
}

/**
 * Resolve Claude Code config paths for a given scope.
 *
 * - user:    `~/.claude/...` + `~/.claude/CLAUDE.md` + `~/.claude.json` (MCP)
 * - project: `<repo>/.claude/...` + `<repo>/CLAUDE.md` + `<repo>/.mcp.json`
 * - local:   `<repo>/.claude/settings.local.json` (no separate rules/commands/agents)
 *            + `~/.claude.json` keyed per project path (MCP)
 */
export function paths(scope: Scope, cwd: string): ClaudePaths {
  if (scope === 'user') {
    const claudeDir = join(homedir(), '.claude');
    return {
      claudeDir,
      rulesFile: join(claudeDir, 'CLAUDE.md'),
      settingsFile: join(claudeDir, 'settings.json'),
      commandsDir: join(claudeDir, 'commands'),
      agentsDir: join(claudeDir, 'agents'),
      skillsDir: join(claudeDir, 'skills'),
      mcpFile: join(homedir(), '.claude.json'),
    };
  }
  const claudeDir = join(cwd, '.claude');
  if (scope === 'local') {
    return {
      claudeDir,
      rulesFile: null,
      settingsFile: join(claudeDir, 'settings.local.json'),
      commandsDir: null,
      agentsDir: null,
      skillsDir: null,
      mcpFile: join(homedir(), '.claude.json'),
    };
  }
  // project
  return {
    claudeDir,
    rulesFile: join(cwd, 'CLAUDE.md'),
    settingsFile: join(claudeDir, 'settings.json'),
    commandsDir: join(claudeDir, 'commands'),
    agentsDir: join(claudeDir, 'agents'),
    skillsDir: join(claudeDir, 'skills'),
    mcpFile: join(cwd, '.mcp.json'),
  };
}
