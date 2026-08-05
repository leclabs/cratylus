// `scaffoldProject` places the culture under the TARGET HARNESS's dot-dir, not a
// baked-in `.claude`. The harness home is a defaulted parameter (the adapter's
// `HarnessAdapter.home`), matching the shape `userScope`/`projectScope` already
// carry in `../../src/deploy/scope.ts`.
//
// Two facts are asserted, and the second is the one that used to be false: a
// NON-claude scaffold must put its dirs where THAT harness reads them, and must
// leave no `.claude` behind.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROJECT_TEMPLATE,
  scaffoldProject,
} from '../../src/deploy/index.js';
import { buildRenderTree, tmp } from './helpers.js';

describe('scaffoldProject harnessHome', () => {
  it('defaults to .claude when the caller predates the parameter', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-default-');
    const r = scaffoldProject({
      target,
      tree: { agentsDir, skillsDir },
      template: DEFAULT_PROJECT_TEMPLATE,
      subject: 'a test project',
    });
    expect(r.rc).toBe(0);
    expect(existsSync(join(target, '.claude', 'agents', 'mav.md'))).toBe(true);
    expect(
      existsSync(join(target, '.claude', 'skills', 'memory', 'SKILL.md')),
    ).toBe(true);
  });

  it('puts a non-claude harness’s dirs where THAT harness reads them', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-codex-');
    const r = scaffoldProject({
      target,
      tree: { agentsDir, skillsDir },
      template: DEFAULT_PROJECT_TEMPLATE,
      harnessHome: '.codex',
      subject: 'a test project',
    });
    expect(r.rc).toBe(0);
    expect(r.agents).toBe(2);
    expect(r.skills).toBe(2);
    // culture landed under the codex home
    expect(existsSync(join(target, '.codex', 'agents', 'mav.md'))).toBe(true);
    expect(existsSync(join(target, '.codex', 'agents', 'nico.md'))).toBe(true);
    expect(
      existsSync(join(target, '.codex', 'skills', 'memory', 'SKILL.md')),
    ).toBe(true);
    expect(
      existsSync(join(target, '.codex', 'skills', 'wake', 'SKILL.md')),
    ).toBe(true);
    // and NOTHING was left in the claude home
    expect(existsSync(join(target, '.claude'))).toBe(false);
    // the harness-agnostic half of the scaffold is unmoved
    expect(existsSync(join(target, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(target, 'plans', 'founding', 'PLAN.md'))).toBe(true);
  });

  it('reports the harness home it actually used in the log line', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-log-');
    const lines: string[] = [];
    scaffoldProject({
      target,
      tree: { agentsDir, skillsDir },
      template: DEFAULT_PROJECT_TEMPLATE,
      harnessHome: '.codex',
      log: (l) => lines.push(l),
    });
    expect(lines.join('\n')).toMatch(/culture projected: .* -> .*\/\.codex\//);
    expect(lines.join('\n')).not.toMatch(/\.claude/);
  });
});
