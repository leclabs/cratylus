import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface CodexPaths {
  rulesFile: string; // AGENTS.md
  overrideRulesFile: string; // AGENTS.override.md — lifts over rulesFile [CX3]
  configFile: string; // ~/.codex/config.toml or <repo>/.codex/config.toml
  promptsDir: string; // commands as .md prompts
  agentsDir: string; // .toml subagent files
  skillsDir: string; // skills/<name>/SKILL.md — .agents/skills, NOT .codex/skills [CX2]
  codexDir: string; // .codex/ root
}

/**
 * Resolve Codex CLI config paths.
 *
 * - user:    ~/.codex/{config.toml, prompts/, agents/} + ~/.codex/AGENTS(.override).md
 *            + skills at ~/.agents/skills/ (NOT ~/.codex/skills/) [CX2]
 * - project: <cwd>/{AGENTS(.override).md, .codex/config.toml, .codex/prompts/, .codex/agents/}
 *            + skills at <cwd>/.agents/skills/ (NOT <cwd>/.codex/skills/) [CX2]
 */
export function paths(scope: Scope, cwd: string): CodexPaths {
  if (scope === 'user') {
    const codexDir = join(homedir(), '.codex');
    return {
      codexDir,
      rulesFile: join(codexDir, 'AGENTS.md'),
      overrideRulesFile: join(codexDir, 'AGENTS.override.md'),
      configFile: join(codexDir, 'config.toml'),
      promptsDir: join(codexDir, 'prompts'),
      agentsDir: join(codexDir, 'agents'),
      skillsDir: join(homedir(), '.agents', 'skills'),
    };
  }
  const codexDir = join(cwd, '.codex');
  return {
    codexDir,
    rulesFile: join(cwd, 'AGENTS.md'),
    overrideRulesFile: join(cwd, 'AGENTS.override.md'),
    configFile: join(codexDir, 'config.toml'),
    promptsDir: join(codexDir, 'prompts'),
    agentsDir: join(codexDir, 'agents'),
    skillsDir: join(cwd, '.agents', 'skills'),
  };
}
