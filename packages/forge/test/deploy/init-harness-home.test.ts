// `scaffoldProject` places the culture under the target harness's dot-dir.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROJECT_TEMPLATE,
  scaffoldProject,
} from '../../src/deploy/index.js';
import { buildRenderTree, tmp } from './helpers.js';

describe('scaffoldProject harnessHome', () => {
  it('puts the omp harness dirs where that harness reads them', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-omp-');
    const r = scaffoldProject({
      target,
      tree: { agentsDir, skillsDir },
      template: DEFAULT_PROJECT_TEMPLATE,
      harnessHome: '.omp',
      subject: 'a test project',
    });
    expect(r.rc).toBe(0);
    expect(r.agents).toBe(2);
    expect(r.skills).toBe(2);
    expect(existsSync(join(target, '.omp', 'agents', 'mav.md'))).toBe(true);
    expect(existsSync(join(target, '.omp', 'agents', 'nico.md'))).toBe(true);
    expect(existsSync(join(target, '.omp', 'skills', 'memory', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(target, '.omp', 'skills', 'wake', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(target, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(target, 'plans'))).toBe(false);
  });

  it('reports the harness home it actually used in the log line', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-log-');
    const lines: string[] = [];
    scaffoldProject({
      target,
      tree: { agentsDir, skillsDir },
      template: DEFAULT_PROJECT_TEMPLATE,
      harnessHome: '.omp',
      log: (l) => lines.push(l),
    });
    expect(lines.join('\n')).toMatch(/culture projected: .* -> .*\/\.omp\//);
  });
});
