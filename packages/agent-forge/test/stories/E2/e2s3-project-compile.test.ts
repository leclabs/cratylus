/**
 * E2.S3 · project-scope compile lands in each harness's project namespace dir.
 * Contract: plans/interop-hardening/stories/E2-ir-emission.md.
 *
 * The allowlist below encodes the DOCUMENTED per-adapter project surfaces from
 * RETURN §2 (fixture ground truth) — never the current adapter path tables.
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { compile, readIR, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { compileFixtureIR, hashTree } from './lib.js';

const ALL_IDS = ALL_ADAPTERS.map((a) => a.id);

/**
 * Documented project-scope output surfaces, per RETURN §2 sheet (ref per line).
 * A compile write outside this union is a fabricated path.
 */
const DOCUMENTED_PROJECT_FILES: ReadonlySet<string> = new Set([
  'CLAUDE.md', // claude [CC1]
  'CLAUDE.local.md', // claude local rules file [CC1]
  '.mcp.json', // claude project MCP [CC7]
  'AGENTS.md', // codex [CX3] · cursor [CU1] · copilot [CP3] · opencode [OC3] · crush context_paths [CR2]
  '.codex/config.toml', // codex trusted-project config [CX6]
  '.codex/hooks.json', // codex hooks file [CX4]
  'opencode.json', // opencode project config (MCP lives here) [OC1][OC7]
  'crush.json', // crush project config (MCP lives here) [CR1]
  '.crush.json', // crush project config variant [CR1]
  'CRUSH.md', // crush context file [CR2]
  '.continuerc.json', // continue project overlay [CT5]
  '.vscode/mcp.json', // copilot VS Code MCP [CP6]
  '.aider.conf.yml', // aider config chain [AI1]
  'CONVENTIONS.md', // aider conventions file (wired via read:) [AI2]
]);

const DOCUMENTED_PROJECT_PREFIXES: readonly string[] = [
  '.claude/', // claude settings/commands/agents/skills/rules [CC1][CC2][CC3][CC8]; also read by copilot skills [CP2]
  '.codex/agents/', // codex subagent TOMLs [CX1]
  '.agents/skills/', // Agent Skills shared dir (codex [CX2], copilot [CP2], opencode [OC6], crush [CR1], cursor [CU4])
  '.cursor/', // cursor rules/skills/hooks.json/mcp.json/commands/agents/cli.json [CU1][CU2][CU3][CU4][CU5][CU6][CU9]
  '.github/', // copilot instructions/agents/skills/prompts/hooks [CP1][CP2][CP3][CP4][CP5]
  '.gemini/', // gemini settings.json/agents/skills/commands [GM1][GM2][GM3][GM5]
  '.opencode/plugins/', // opencode plugins [OC5]
  '.opencode/skills/', // opencode skills [OC6]
  '.opencode/agents/', // opencode agents [OC2]
  '.opencode/commands/', // opencode commands [OC4]
  '.clinerules/', // cline rules/workflows/hooks [CL1][CL2][CL4]
  '.cline/skills/', // cline project skills [CL5]
  '.crush/skills/', // crush project skills [CR1]
  '.continue/rules/', // continue rules [CT2]
  '.continue/prompts/', // continue prompts [CT3]
  '.continue/mcpServers/', // continue MCP blocks + foreign mcp.json [CT4]
];
// Deliberately ABSENT (fabricated per §2/§3): .opencode/mcp.json [OC7],
// .opencode/permissions.json [OC8], .opencode/env.json [OC1], .crush/mcp.json [CR1],
// .cline/mcp.json (project) + .cline/hooks.json [CL6][CL2], .codex/skills/ +
// .codex/prompts/ (project) [CX2][CX5], .copilot/ (project) [CP2],
// .continue/config.yaml (project; config.yaml is user-level) [CT1].

function isDocumented(rel: string): boolean {
  return (
    DOCUMENTED_PROJECT_FILES.has(rel) ||
    DOCUMENTED_PROJECT_PREFIXES.some((p) => rel.startsWith(p))
  );
}

describe('E2.S3 · project-scope compile lands in each documented namespace', () => {
  let cwd: string;
  let touched: string[];

  beforeEach(async () => {
    cwd = makeTmpDir();
    await writeIR(compileFixtureIR('project', ALL_IDS), 'project', cwd);
    const before = hashTree(cwd);
    const ir = await readIR('project', cwd);
    await compile(ir, [...ALL_ADAPTERS], 'project', cwd, {});
    const after = hashTree(cwd);
    touched = Object.keys(after).filter(
      (rel) => !rel.startsWith('.agent-forge/') && after[rel] !== before[rel],
    );
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E2.S3',
    'compile populates the documented project surface of each adapter that has one',
    () => {
      // One representative documented emission per adapter (§2 refs above).
      const expected = [
        'CLAUDE.md', // claude [CC1]
        '.claude/skills/review/SKILL.md', // claude [CC3]
        '.codex/config.toml', // codex [CX6]
        '.codex/agents/one.toml', // codex [CX1]
        '.cursor/skills/review/SKILL.md', // cursor [CU4]
        '.cursor/mcp.json', // cursor [CU5]
        '.gemini/agents/one.md', // gemini [GM2]
        '.gemini/skills/review/SKILL.md', // gemini [GM3]
        '.cline/skills/review/SKILL.md', // cline [CL5]
        '.vscode/mcp.json', // copilot [CP6]
        '.crush/skills/review/SKILL.md', // crush [CR1]
        '.opencode/skills/review/SKILL.md', // opencode [OC6]
        // codex/cursor/copilot/opencode/crush/cline [CX3][CU1][CP3][OC3][CR2][CL1]
        // — cline's plain 'main' rule now lands here too (AGENTS.md-native
        // reader [S22]), not as .clinerules/main.md.
        'AGENTS.md',
      ];
      for (const rel of expected) {
        expect(existsSync(join(cwd, rel)), `expected ${rel}`).toBe(true);
      }
    },
  );

  story.tracked(
    'E2.S3',
    'touched-path set ⊆ union of documented per-adapter project surfaces (no fabricated paths)',
    () => {
      // Fails today on §3 fabrications: .codex/skills/ [CX2], .copilot/ [CP2],
      // .crush/mcp.json [CR1], .continue/config.yaml [CT1]. (opencode's
      // .opencode/mcp.json fabrication graduated with the opencode-adapter-
      // truth fix [OC7]; cline's .cline/mcp.json fabrication graduated with
      // the cline-adapter-truth fix — project-scope MCP is now skip+warn,
      // never written [CL6].)
      const strays = touched.filter((rel) => !isDocumented(rel));
      expect(strays).toEqual([]);
    },
  );
});
