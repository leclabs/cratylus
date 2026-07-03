import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

export interface CursorPaths {
  rulesFile: string; // AGENTS.md — concatenated/plain rules only [CU1]
  rulesDir: string; // .cursor/rules/*.mdc — glob/activation-scoped rules [CU1]
  skillsDir: string;
  agentsDir: string; // .cursor/agents/*.md [CU3]
  commandsDir: string; // .cursor/commands/*.md [CU6]
  hooksFile: string; // .cursor/hooks.json
  mcpFile: string; // .cursor/mcp.json
  cursorDir: string;
}

export function paths(scope: Scope, cwd: string): CursorPaths {
  if (scope === 'user') {
    const cursorDir = join(homedir(), '.cursor');
    return {
      cursorDir,
      // No documented file surface for User Rules (settings UI, plain text)
      // [CU1] — this path is retained for read-side compatibility only; write
      // never targets it (E8.S5 "~/.cursor/AGENTS.md is no longer written").
      rulesFile: join(cursorDir, 'AGENTS.md'),
      rulesDir: join(cursorDir, 'rules'),
      skillsDir: join(cursorDir, 'skills'),
      agentsDir: join(cursorDir, 'agents'),
      commandsDir: join(cursorDir, 'commands'),
      hooksFile: join(cursorDir, 'hooks.json'),
      mcpFile: join(cursorDir, 'mcp.json'),
    };
  }
  const cursorDir = join(cwd, '.cursor');
  return {
    cursorDir,
    rulesFile: join(cwd, 'AGENTS.md'),
    rulesDir: join(cursorDir, 'rules'),
    skillsDir: join(cursorDir, 'skills'),
    agentsDir: join(cursorDir, 'agents'),
    commandsDir: join(cursorDir, 'commands'),
    hooksFile: join(cursorDir, 'hooks.json'),
    mcpFile: join(cursorDir, 'mcp.json'),
  };
}
