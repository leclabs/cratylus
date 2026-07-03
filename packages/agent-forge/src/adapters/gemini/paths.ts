import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface GeminiPaths {
  rulesFile: string; // GEMINI.md — the stock context filename [GM1]; a bare
  // AGENTS.md would need explicit `context.fileName` wiring, which this
  // adapter does not emit.
  settingsFile: string; // settings.json (hooks, mcp only — permissions/env
  // have no documented settings.json shape [GM1]; see write.ts)
  agentsDir: string; // subagent extensions
  skillsDir: string; // skill directories
  commandsDir: string; // .gemini/commands/*.toml [GM5]
  geminiDir: string;
}

/**
 * Resolve Gemini CLI config paths.
 *
 * - user:    ~/.gemini/{GEMINI.md, settings.json, agents/, skills/, commands/}
 * - project: <cwd>/{GEMINI.md, .gemini/settings.json, .gemini/agents/, .gemini/skills/, .gemini/commands/}
 */
export function paths(scope: Scope, cwd: string): GeminiPaths {
  if (scope === 'user') {
    const geminiDir = join(homedir(), '.gemini');
    return {
      geminiDir,
      rulesFile: join(geminiDir, 'GEMINI.md'),
      settingsFile: join(geminiDir, 'settings.json'),
      agentsDir: join(geminiDir, 'agents'),
      skillsDir: join(geminiDir, 'skills'),
      commandsDir: join(geminiDir, 'commands'),
    };
  }
  const geminiDir = join(cwd, '.gemini');
  return {
    geminiDir,
    rulesFile: join(cwd, 'GEMINI.md'),
    settingsFile: join(geminiDir, 'settings.json'),
    agentsDir: join(geminiDir, 'agents'),
    skillsDir: join(geminiDir, 'skills'),
    commandsDir: join(geminiDir, 'commands'),
  };
}
