import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface ClaudePaths {
  /** The .claude/ directory itself */
  claudeDir: string;
  /**
   * The primary rules file: `CLAUDE.md` (user/project) or `CLAUDE.local.md`
   * (local — the actual local-scope rules surface [CC1], never unsupported).
   */
  rulesFile: string | null;
  /**
   * The documented `.claude/CLAUDE.md` alt location [CC1] — read as a
   * fallback when `rulesFile` is absent; never written (CLAUDE.md/
   * CLAUDE.local.md are the write targets).
   */
  altRulesFile: string;
  /** `.claude/rules/*.md` — non-concat rules, optional `paths:` frontmatter [CC1]. */
  rulesDir: string;
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
      altRulesFile: join(claudeDir, 'CLAUDE.md'),
      rulesDir: join(claudeDir, 'rules'),
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
      // CLAUDE.local.md is the documented local-scope rules surface [CC1] —
      // local scope is NOT rules-unsupported.
      rulesFile: join(cwd, 'CLAUDE.local.md'),
      altRulesFile: join(claudeDir, 'CLAUDE.md'),
      rulesDir: join(claudeDir, 'rules'),
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
    altRulesFile: join(claudeDir, 'CLAUDE.md'),
    rulesDir: join(claudeDir, 'rules'),
    settingsFile: join(claudeDir, 'settings.json'),
    commandsDir: join(claudeDir, 'commands'),
    agentsDir: join(claudeDir, 'agents'),
    skillsDir: join(claudeDir, 'skills'),
    mcpFile: join(cwd, '.mcp.json'),
  };
}
