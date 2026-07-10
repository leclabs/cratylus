// CLI-level wiring proof for `agent-forge deploy` (local single-host) + `agent-forge found`
// (greenfield founding). The engine itself is covered exhaustively elsewhere;
// these assert the command layer threads opts → engine and reports the rc.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCompanions, runDeploy } from '../../src/cli/commands/deploy.js';
import { runFound } from '../../src/cli/commands/found.js';
import { CONFIG_ENV } from '../../src/deploy/index.js';
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

describe('runDeploy (local single-host)', () => {
  it('deploys agents in-place to <home>/.claude (scope user, --home sandbox)', async () => {
    // Point config resolution at a configless temp so the run is hermetic.
    process.env[CONFIG_ENV] = join(
      tmp('polis-empty-'),
      '.agent-factory.config',
    );
    const { agentsDir, skillsDir } = buildRenderTree(
      tmp('agent-forge-render-'),
    );
    const home = tmp('agent-forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      kind: 'agent',
      scope: 'user',
      host: null, // local
      home,
      dryRun: false,
    });
    delete process.env[CONFIG_ENV];
    expect(rc).toBe(0);
    // bare-home guard appended .claude
    expect(existsSync(join(home, '.claude', 'agents', 'mav.md'))).toBe(true);
    expect(
      existsSync(join(home, '.claude', 'agents', 'mav', 'EPISODIC.jsonl')),
    ).toBe(true);
  });

  it('--kind all deploys agent + skill + hooks in ONE invocation (local single-host)', async () => {
    process.env[CONFIG_ENV] = join(
      tmp('polis-empty-'),
      '.agent-factory.config',
    );
    // agents/ + skills/ under root; hooks fragment at the render root (hooksDir).
    const root = tmp('agent-forge-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const { hooksDir } = buildHooksTree(root); // hooksDir === root
    const home = tmp('agent-forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      hooksDir,
      kind: 'all',
      scope: 'user',
      host: null, // local
      home,
      dryRun: false,
    });
    delete process.env[CONFIG_ENV];
    expect(rc).toBe(0);
    const cd = join(home, '.claude');
    // agent kind landed
    expect(existsSync(join(cd, 'agents', 'mav.md'))).toBe(true);
    expect(existsSync(join(cd, 'agents', 'mav', 'EPISODIC.jsonl'))).toBe(true);
    // skill kind landed
    expect(existsSync(join(cd, 'skills', 'wake', 'SKILL.md'))).toBe(true);
    // hooks kind landed (worker scripts + merged settings.json)
    expect(
      existsSync(join(cd, 'hooks', 'stance-guardrail', 'stance-guardrail.sh')),
    ).toBe(true);
    expect(existsSync(join(cd, 'settings.json'))).toBe(true);
  });

  it('--kind agent deploys ONLY agent (single-kind half unchanged)', async () => {
    process.env[CONFIG_ENV] = join(
      tmp('polis-empty-'),
      '.agent-factory.config',
    );
    const root = tmp('agent-forge-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const { hooksDir } = buildHooksTree(root);
    const home = tmp('agent-forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      hooksDir,
      kind: 'agent',
      scope: 'user',
      host: null,
      home,
      dryRun: false,
    });
    delete process.env[CONFIG_ENV];
    expect(rc).toBe(0);
    const cd = join(home, '.claude');
    expect(existsSync(join(cd, 'agents', 'mav.md'))).toBe(true);
    // skill + hooks kinds were NOT touched
    expect(existsSync(join(cd, 'skills'))).toBe(false);
    expect(existsSync(join(cd, 'settings.json'))).toBe(false);
  });

  it('--kind all + --fleet applies the fleet target to ALL three kinds (regression: the trailing-step leak)', async () => {
    // A single LOCAL fleet host so the run is hermetic (no ssh). Proves --fleet
    // reaches agent + skill + hooks — the OLD `&&`-chain leaked --fleet onto only
    // the trailing kind, leaving agent + skill local.
    const fireHome = tmp('agent-forge-fire-home-');
    const cfgRoot = tmp('polis-cfg-');
    writeFileSync(
      join(cfgRoot, '.agent-factory.config'),
      JSON.stringify({
        schema: 1,
        reader: 'strong-llm-lean',
        fleet: { hosts: ['fire'], exclude: [] },
        host: { fire: { local: true, home: fireHome } },
      }),
      'utf-8',
    );
    process.env[CONFIG_ENV] = join(cfgRoot, '.agent-factory.config');
    const root = tmp('agent-forge-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const { hooksDir } = buildHooksTree(root);
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      hooksDir,
      kind: 'all',
      scope: 'user',
      fleet: true,
      dryRun: false,
    });
    delete process.env[CONFIG_ENV];
    expect(rc).toBe(0);
    const cd = join(fireHome, '.claude');
    expect(existsSync(join(cd, 'agents', 'mav.md'))).toBe(true); // agent fleet-landed
    expect(existsSync(join(cd, 'skills', 'wake', 'SKILL.md'))).toBe(true); // skill fleet-landed
    expect(existsSync(join(cd, 'settings.json'))).toBe(true); // hooks fleet-landed
  });

  it('--fleet without a config returns rc=1 (no flag-only fleet fallback)', async () => {
    process.env[CONFIG_ENV] = join(
      tmp('polis-empty-'),
      '.agent-factory.config',
    );
    const { agentsDir, skillsDir } = buildRenderTree(
      tmp('agent-forge-render-'),
    );
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      kind: 'agent',
      scope: 'user',
      fleet: true,
    });
    delete process.env[CONFIG_ENV];
    expect(rc).toBe(1);
  });
});

describe('runFound (greenfield founding)', () => {
  it('projects the culture + lays AGENTS.md + plans scaffold', async () => {
    const { agentsDir, skillsDir } = buildRenderTree(
      tmp('agent-forge-render-'),
    );
    const target = tmp('agent-forge-found-');
    const rc = await runFound({
      target,
      agentsDir,
      skillsDir,
      subject: 'a test society',
    });
    expect(rc).toBe(0);
    // culture projected (no sidecars — founding lays the SOUL, not the individual)
    expect(existsSync(join(target, '.claude', 'agents', 'mav.md'))).toBe(true);
    expect(
      existsSync(join(target, '.claude', 'skills', 'memory', 'SKILL.md')),
    ).toBe(true);
    expect(
      existsSync(join(target, '.claude', 'agents', 'mav', 'SEMANTIC.md')),
    ).toBe(false);
    // founding marker + subject woven in
    const agentsMd = readFileSync(join(target, 'AGENTS.md'), 'utf-8');
    expect(agentsMd).toMatch(/a test society/);
    // plans scaffold
    expect(existsSync(join(target, 'plans', 'founding', 'PLAN.md'))).toBe(true);
    expect(
      existsSync(join(target, 'plans', 'founding', 'pending', '.gitkeep')),
    ).toBe(true);
  });

  it('refuses to clobber an existing AGENTS.md without --force', async () => {
    const { agentsDir, skillsDir } = buildRenderTree(
      tmp('agent-forge-render-'),
    );
    const target = tmp('agent-forge-found-');
    expect(await runFound({ target, agentsDir, skillsDir, subject: 's' })).toBe(
      0,
    );
    // second run refuses
    expect(await runFound({ target, agentsDir, skillsDir, subject: 's' })).toBe(
      1,
    );
    // --force re-founds
    expect(
      await runFound({
        target,
        agentsDir,
        skillsDir,
        subject: 's',
        force: true,
      }),
    ).toBe(0);
  });
});
