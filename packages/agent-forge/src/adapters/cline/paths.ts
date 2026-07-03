import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

/**
 * Cline config-surface paths. Ground truth: harness-landscape-research
 * RETURN §2 "Cline" ([CL1]-[CL6]).
 *
 * - `rulesFile` (project only): root `AGENTS.md` — Cline is an AGENTS.md-native
 *   reader [S22]; a plain (non-glob) rule lands here, never as a `.clinerules`
 *   file.
 * - `rulesDir`: project `.clinerules/` carries GLOB-activated rules only
 *   (`<id>.md` with `paths:` frontmatter [CL1][S22]); user (global) scope has
 *   no documented AGENTS.md-equivalent, so EVERY global rule — plain or
 *   glob — lands in this same directory, the real `~/Documents/Cline/Rules`
 *   home (never `~/.cline/rules`) [CL1].
 * - `hooksDir`: per-event executable scripts (no extension) [CL2][CL3].
 * - `workflowsDir`: `/name.md` workflows [CL4].
 * - `skillsDir`: native `SKILL.md` discovery [CL5].
 * - `mcpFile`: real only for the CLI at USER scope (`~/.cline/mcp.json`)
 *   [CL6] — the extension reads VS Code globalStorage instead, and no
 *   project-scope file is documented at all, so write never targets this
 *   path at project scope.
 */
export interface ClinePaths {
  clineDir: string;
  rulesFile: string;
  rulesDir: string;
  hooksDir: string;
  workflowsDir: string;
  skillsDir: string;
  mcpFile: string;
}

export function paths(scope: Scope, cwd: string): ClinePaths {
  if (scope === 'user') {
    const clineDir = join(homedir(), '.cline');
    const documentsRules = join(homedir(), 'Documents', 'Cline', 'Rules');
    return {
      clineDir,
      // No documented user-scope AGENTS.md-equivalent for Cline — unused,
      // kept only for interface symmetry with the project-scope shape.
      rulesFile: join(documentsRules, 'AGENTS.md'),
      rulesDir: documentsRules,
      hooksDir: join(documentsRules, 'Hooks'),
      workflowsDir: join(homedir(), 'Documents', 'Cline', 'Workflows'),
      skillsDir: join(clineDir, 'skills'),
      mcpFile: join(clineDir, 'mcp.json'),
    };
  }
  const clineDir = join(cwd, '.cline');
  return {
    clineDir,
    rulesFile: join(cwd, 'AGENTS.md'),
    rulesDir: join(cwd, '.clinerules'),
    hooksDir: join(cwd, '.clinerules', 'hooks'),
    workflowsDir: join(cwd, '.clinerules', 'workflows'),
    skillsDir: join(clineDir, 'skills'),
    mcpFile: join(clineDir, 'mcp.json'),
  };
}
