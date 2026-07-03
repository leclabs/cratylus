/**
 * E7.S8 — never build on unmerged proposals (caution i).
 * Standing guard: no output depends on `.agents/rules/` (agentsmd#179 [S59])
 * or AGENTS.md YAML frontmatter (#10/#135 [S2]) — both open, unmerged.
 * Red the day someone reaches for either.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { type IR, compile } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { manifest, mcpPair, orderedRules, walkFiles } from './fixtures.js';

/** Maximal IR: every resource type populated. */
function maximalIR(): IR {
  return {
    manifest: manifest(ALL_ADAPTERS.map((a) => a.id)),
    rules: orderedRules(),
    skills: [{ name: 'review', description: 'Review code.', body: '# steps' }],
    commands: [{ name: 'plan', body: 'Plan tasks', description: 'planning' }],
    agents: [{ name: 'planner', body: 'You plan.', model: 'gpt-5' }],
    hooks: [
      {
        id: 'pre-bash',
        events: ['tool.use.pre'],
        matcher: 'Bash',
        command: './pre.sh',
      },
    ],
    mcp_servers: mcpPair(),
    permissions: { allow: ['Bash(git status)'] },
    env: { DEBUG: 'true' },
  };
}

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('E7.S8 · unmerged-proposals standing guard', () => {
  story(
    'E7.S8',
    'full compile across all 10 targets emits no .agents/rules/ path and no AGENTS.md with YAML frontmatter [S59][S2]',
    async () => {
      // One isolated dir PER adapter: on a shared cwd, later adapters
      // overwrite the shared root AGENTS.md (last-writer-wins) and would mask
      // a single adapter's regression — the guard must bite per adapter.
      for (const adapter of ALL_ADAPTERS) {
        const cwd = makeTmpDir();
        dirs.push(cwd);
        const report = await compile(maximalIR(), [adapter], 'project', cwd);
        expect(report.results.filter((r) => r.error)).toEqual([]);

        const files = walkFiles(cwd);

        // Guard 1: the .agents/rules/ proposal (agentsmd#179) is unmerged —
        // nothing may be written under it.
        expect(
          files.filter((f) => f.includes('.agents/rules/')),
          `${adapter.id} writes under .agents/rules/`,
        ).toEqual([]);

        // Guard 2: AGENTS.md frontmatter proposals (#10/#135) are unmerged —
        // no emitted AGENTS.md may begin with a `---` fence.
        for (const f of files.filter((p) => p.endsWith('AGENTS.md'))) {
          const text = readFileSync(join(cwd, f), 'utf8');
          expect(
            text.startsWith('---'),
            `${adapter.id}: ${f} begins with frontmatter`,
          ).toBe(false);
        }
      }
    },
  );
});
