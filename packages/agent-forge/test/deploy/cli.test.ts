// CLI-level wiring proof for `agent-forge deploy` (local single-host) + `agent-forge found`
// (greenfield founding). The engine itself is covered exhaustively elsewhere;
// these assert the command layer threads opts → engine and reports the rc.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCompanions, runDeploy } from '../../src/cli/commands/deploy.js';
import { runFound } from '../../src/cli/commands/found.js';
import { CONFIG_ENV } from '../../src/deploy/index.js';
import { buildBundleSrc, buildRenderTree, tmp } from './helpers.js';

describe('parseCompanions', () => {
  it('parses <skill>=<spec> bundle declarations into a companions map', () => {
    const c = parseCompanions('memory=agent-memory/dist/episodic.mjs', null);
    expect(c).toEqual({
      memory: { bundle: ['agent-memory/dist/episodic.mjs'] },
    });
  });

  it('accumulates repeated keys and merges bundle + assets', () => {
    const c = parseCompanions('memory=a.mjs', 'memory=logo.png');
    expect(c).toEqual({ memory: { bundle: ['a.mjs'], assets: ['logo.png'] } });
  });

  it('hard-errors on a malformed (no `=`) declaration', () => {
    expect(() => parseCompanions('memory', null)).toThrow(
      /must be <skill>=<spec>/,
    );
  });

  it('returns undefined when nothing is declared', () => {
    expect(parseCompanions(null, null)).toBeUndefined();
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

  it('the bundle hard-error surfaces through the CLI (rc=1) when episodic.mjs is unbuilt', async () => {
    process.env[CONFIG_ENV] = join(
      tmp('polis-empty-'),
      '.agent-factory.config',
    );
    const { agentsDir, skillsDir } = buildRenderTree(
      tmp('agent-forge-render-'),
    );
    const unbuilt = buildBundleSrc(tmp('agent-forge-bundle-'), false); // NOT built
    const home = tmp('agent-forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      kind: 'skill',
      scope: 'user',
      host: null,
      home,
      companions: { memory: { bundle: ['agent-memory/dist/episodic.mjs'] } },
      bundleBaseRoot: unbuilt,
      only: 'memory',
    });
    delete process.env[CONFIG_ENV];
    // runDeploy catches the BundleMissingError and returns rc=1 (CLI contract);
    // the engine itself throws BundleMissingError (covered in bundle.test.ts).
    expect(rc).toBe(1);
    // nothing landed (the hard-error fired before any host bytes moved)
    expect(existsSync(join(home, '.claude', 'skills', 'memory'))).toBe(false);
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
      existsSync(join(target, '.claude', 'agents', 'mav', 'SELF.md')),
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
