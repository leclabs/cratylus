// OMP deploy pruning — retired artifacts converge to the render tree.
//
// Pruning is bounded by a manifest of what a prior deploy wrote. Anything absent
// from that record is somebody else's artifact and is untouchable.
//
// Subtraction on the operator's machine is a data-loss hazard, so the prune is
// bounded by a MANIFEST of what a prior deploy of this render tree actually
// wrote. Attribution is by record, never by naming convention — anything absent
// from the manifest is somebody else's artifact and is untouchable. The
// exoneration test below is therefore not optional: a prune with no exonerating
// fixture is a data-loss gate.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import { deploySingle } from '../../src/deploy/index.js';
import { tmp } from './helpers.js';

const silent = { log: () => {}, warn: () => {} };

/** Build a render tree holding exactly the named agents + skills, the agent defs
 *  carrying the given harness extension (`HarnessAdapter.agentExt`). */
function renderTreeExt(
  agents: string[],
  agentExt: string,
  skills: string[] = [],
): { agentsDir: string; skillsDir: string } {
  const root = tmp('v4-render-');
  const agentsDir = join(root, 'agents');
  const skillsDir = join(root, 'skills');
  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });
  for (const a of agents) {
    writeFileSync(join(agentsDir, `${a}${agentExt}`), `# ${a} def\n`, 'utf-8');
  }
  for (const s of skills) {
    mkdirSync(join(skillsDir, s), { recursive: true });
    writeFileSync(join(skillsDir, s, 'SKILL.md'), `# ${s}\n`, 'utf-8');
  }
  return { agentsDir, skillsDir };
}

describe('deploy prune — OMP convergence to the render tree', () => {
  it('NEUTRAL ROOT: a retired skill is swept out of `../.agents`, foreign files spared', () => {
    const omp = adapterByName('omp');
    const home = tmp('v4-host-');
    const a = renderTreeExt([], omp.agentExt, ['probe', 'wake']);
    const b = renderTreeExt([], omp.agentExt, ['probe']);
    const deploy = (tree: { agentsDir: string; skillsDir: string }) =>
      deploySingle({
        kind: 'skill',
        scope: 'user',
        tree,
        home,
        harnessHome: omp.home,
        agentExt: omp.agentExt,
        skillRel: (n: string, agents: readonly string[]) =>
          omp.skillRel(n, agents),
        ...silent,
      });

    deploy(a);
    const retired = join(home, '.agents', 'skills', 'wake', 'SKILL.md');
    expect(
      existsSync(retired),
      'the skill landed outside the harness home',
    ).toBe(true);
    // A file this tool never wrote, in the very dir the prune now reaches into.
    const foreign = join(home, '.agents', 'skills', 'wake', 'NOTES.md');
    writeFileSync(foreign, 'WAKE LIVED HISTORY\n', 'utf-8');

    deploy(b);
    expect(existsSync(retired), 'the retired skill is swept').toBe(false);
    expect(
      readFileSync(foreign, 'utf-8'),
      'an artifact this tool never recorded is untouchable, in every root',
    ).toBe('WAKE LIVED HISTORY\n');
    // …and the live skill is still there.
    expect(
      existsSync(join(home, '.agents', 'skills', 'probe', 'SKILL.md')),
    ).toBe(true);
  });
});
