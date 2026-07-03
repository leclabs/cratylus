import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface CopilotPaths {
  /** Root convention file — read+written by many harnesses [CP3]. */
  rulesFile: string;
  /** Copilot's own always-on instructions tier [CP3][CP8]. */
  instructionsFile: string;
  /** Glob-scoped `applyTo` instruction files (repo-only; no personal tier documented) [CP3]. */
  instructionsDir?: string;
  /** Agent Skills spec directory [CP2][CP8]. */
  skillsDir: string;
  /** Custom agents (`*.agent.md`) [CP1][CP8]. */
  agentsDir: string;
  /** Prompt files → `/name` (VS Code; repo-only, no personal tier documented) [CP5]. */
  promptsDir?: string;
  /** Copilot's own hooks dialect directory [CP4][CP8]. */
  hooksDir: string;
  /** MCP registration: VS Code `.vscode/mcp.json` (project) or CLI `mcp-config.json` (user) [CP6][CP8][CP12]. */
  mcpFile: string;
}

/**
 * Resolve Copilot config paths.
 *
 * - user:    ~/.copilot/ (`COPILOT_HOME`) — copilot-instructions.md, skills/,
 *   agents/, hooks/, mcp-config.json [CP8].
 * - project: <cwd>/{AGENTS.md, .github/{copilot-instructions.md,
 *   instructions/, skills/, agents/, prompts/, hooks/}, .vscode/mcp.json}
 *   [CP1][CP2][CP3][CP4][CP5][CP6].
 */
export function paths(scope: Scope, cwd: string): CopilotPaths {
  if (scope === 'user') {
    const root = join(homedir(), '.copilot');
    return {
      rulesFile: join(root, 'copilot-instructions.md'),
      instructionsFile: join(root, 'copilot-instructions.md'),
      skillsDir: join(root, 'skills'),
      agentsDir: join(root, 'agents'),
      hooksDir: join(root, 'hooks'),
      mcpFile: join(root, 'mcp-config.json'),
    };
  }
  const github = join(cwd, '.github');
  return {
    rulesFile: join(cwd, 'AGENTS.md'),
    instructionsFile: join(github, 'copilot-instructions.md'),
    instructionsDir: join(github, 'instructions'),
    skillsDir: join(github, 'skills'),
    agentsDir: join(github, 'agents'),
    promptsDir: join(github, 'prompts'),
    hooksDir: join(github, 'hooks'),
    mcpFile: join(cwd, '.vscode', 'mcp.json'),
  };
}
