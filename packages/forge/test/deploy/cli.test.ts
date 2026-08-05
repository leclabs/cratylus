// CLI-level wiring proof for `agent-forge deploy` (local single-host) + the
// greenfield `scaffoldProject` engine. The engine itself is covered exhaustively
// elsewhere; these assert the command layer threads opts → engine and reports the rc.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCompanions, runDeploy } from '../../src/cli/commands/deploy.js';
import {
  DEFAULT_PROJECT_TEMPLATE,
  scaffoldProject,
} from '../../src/deploy/index.js';
import { buildHooksTree, buildRenderTree, tmp } from './helpers.js';

describe('parseCompanions', () => {
  it('parses <skill>=<spec> asset declarations into a companions map', () => {
    const c = parseCompanions('memory=logo.png');
    expect(c).toEqual({ memory: { assets: ['logo.png'] } });
  });

  it('accumulates repeated keys', () => {
    const c = parseCompanions('memory=logo.png,memory=banner.png');
    expect(c).toEqual({ memory: { assets: ['logo.png', 'banner.png'] } });
  });

  it('hard-errors on a malformed (no `=`) declaration', () => {
    expect(() => parseCompanions('memory')).toThrow(/must be <skill>=<spec>/);
  });

  it('returns undefined when nothing is declared', () => {
    expect(parseCompanions(null)).toBeUndefined();
  });
});

describe('runDeploy (local)', () => {
  it('deploys agents in-place to <home>/.claude (scope user, --home sandbox)', async () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const home = tmp('forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      kind: 'agent',
      scope: 'user',
      home,
      dryRun: false,
    });
    expect(rc).toBe(0);
    // bare-home guard appended .claude
    expect(existsSync(join(home, '.claude', 'agents', 'mav.md'))).toBe(true);
    expect(existsSync(join(home, '.agents', 'mav', 'EPISODIC.jsonl'))).toBe(
      true,
    );
  });

  it('--kind all deploys agent + skill + hooks in ONE invocation', async () => {
    // agents/ + skills/ under root; hooks fragment at the render root (hooksDir).
    const root = tmp('forge-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const { hooksDir } = buildHooksTree(root); // hooksDir === root
    const home = tmp('forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      hooksDir,
      kind: 'all',
      scope: 'user',
      home,
      dryRun: false,
    });
    expect(rc).toBe(0);
    const cd = join(home, '.claude');
    // agent kind landed
    expect(existsSync(join(cd, 'agents', 'mav.md'))).toBe(true);
    expect(existsSync(join(home, '.agents', 'mav', 'EPISODIC.jsonl'))).toBe(
      true,
    );
    // skill kind landed
    expect(existsSync(join(cd, 'skills', 'wake', 'SKILL.md'))).toBe(true);
    // hooks kind landed (worker scripts + merged settings.json)
    expect(
      existsSync(join(cd, 'hooks', 'stance-guardrail', 'stance-guardrail.sh')),
    ).toBe(true);
    expect(existsSync(join(cd, 'settings.json'))).toBe(true);
  });

  it('--kind agent deploys ONLY agent (single-kind half unchanged)', async () => {
    const root = tmp('forge-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const { hooksDir } = buildHooksTree(root);
    const home = tmp('forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      hooksDir,
      kind: 'agent',
      scope: 'user',
      home,
      dryRun: false,
    });
    expect(rc).toBe(0);
    const cd = join(home, '.claude');
    expect(existsSync(join(cd, 'agents', 'mav.md'))).toBe(true);
    // skill + hooks kinds were NOT touched
    expect(existsSync(join(cd, 'skills'))).toBe(false);
    expect(existsSync(join(cd, 'settings.json'))).toBe(false);
  });
});

describe('scaffoldProject (greenfield scaffold)', () => {
  it('projects the culture + lays AGENTS.md + plans scaffold', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-');
    const r = scaffoldProject({
      target,
      tree: { agentsDir, skillsDir },
      template: DEFAULT_PROJECT_TEMPLATE,
      subject: 'a test project',
    });
    expect(r.rc).toBe(0);
    // culture projected (no sidecars — scaffold lays the SOUL, not the individual)
    expect(existsSync(join(target, '.claude', 'agents', 'mav.md'))).toBe(true);
    expect(
      existsSync(join(target, '.claude', 'skills', 'memory', 'SKILL.md')),
    ).toBe(true);
    expect(existsSync(join(target, '.agents', 'mav', 'SEMANTIC.md'))).toBe(
      false,
    );
    // project marker + subject woven in
    const agentsMd = readFileSync(join(target, 'AGENTS.md'), 'utf-8');
    expect(agentsMd).toMatch(/a test project/);
    // plans scaffold
    expect(existsSync(join(target, 'plans', 'founding', 'PLAN.md'))).toBe(true);
    expect(
      existsSync(join(target, 'plans', 'founding', 'pending', '.gitkeep')),
    ).toBe(true);
  });

  it('refuses to clobber an existing AGENTS.md without --force', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-');
    const tree = { agentsDir, skillsDir };
    expect(
      scaffoldProject({
        target,
        tree,
        template: DEFAULT_PROJECT_TEMPLATE,
        subject: 's',
      }).rc,
    ).toBe(0);
    // second run refuses
    expect(
      scaffoldProject({
        target,
        tree,
        template: DEFAULT_PROJECT_TEMPLATE,
        subject: 's',
      }).rc,
    ).toBe(1);
    // --force re-scaffolds
    expect(
      scaffoldProject({
        target,
        tree,
        template: DEFAULT_PROJECT_TEMPLATE,
        subject: 's',
        force: true,
      }).rc,
    ).toBe(0);
  });
});
