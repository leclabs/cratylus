// Hermetic two-host fixture proof — the ssh placer + fleet orchestration
// exercised against a FAKE in-memory fleet (no real ssh, no live network). This
// proves parity with deploy.py's contract:
//   - fleet resolution: `upmav=lcaraccioli`, `upgoose` excluded-from-`--fleet`
//   - ssh seed-if-absent via the remote `test -e` heredoc (existing untouched)
//   - the bare-home guard server-side; `~/.claude` resolved via $HOME
//   - per-host result codes: 0 landed, 2 unreachable-deferred

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deployFleet,
  loadConfig,
  placeAgentsSsh,
  placeSkillsSsh,
} from '../../src/deploy/index.js';
import {
  buildRenderTree,
  fakeRunner,
  makeFleet,
  tmp,
  writeConfig,
} from './helpers.js';

const silent = { log: () => {}, warn: () => {} };

describe('placeAgentsSsh (fake fleet)', () => {
  it('resolves ~/.claude via $HOME, scps the def, seeds sidecars if-absent', () => {
    const { agentsDir } = buildRenderTree(tmp('agent-forge-render-'));
    const fleet = makeFleet({
      'lcaraccioli@upmav.lan': { reachable: true, home: '/Users/lcaraccioli' },
    });
    const runner = fakeRunner(fleet);

    const r = placeAgentsSsh(
      'lcaraccioli',
      'upmav.lan',
      '~/.claude',
      agentsDir,
      ['mav'],
      { ...silent, dry: false, runner },
    );
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(1);

    const host = fleet.hosts.get('lcaraccioli@upmav.lan')!;
    // def scp'd to the $HOME-resolved .claude
    expect(host.files.has('/Users/lcaraccioli/.claude/agents/mav.md')).toBe(
      true,
    );
    // sidecars seeded server-side, if-absent — the v2 stores, never v1
    expect(host.files.has('/Users/lcaraccioli/.agents/mav/SEMANTIC.md')).toBe(
      true,
    );
    expect(host.files.has('/Users/lcaraccioli/.agents/mav/PROCEDURAL.md')).toBe(
      true,
    );
    expect(
      host.files.has('/Users/lcaraccioli/.agents/mav/EPISODIC.jsonl'),
    ).toBe(true);
    expect(host.files.has('/Users/lcaraccioli/.agents/mav/SELF.md')).toBe(
      false,
    );
    expect(host.files.has('/Users/lcaraccioli/.agents/mav/MEMORY.md')).toBe(
      false,
    );
    expect(r.report.seeded).toContain('mav/SEMANTIC.md');
  });

  it('NEVER clobbers an existing remote sidecar (reports PRESENT)', () => {
    const { agentsDir } = buildRenderTree(tmp('agent-forge-render-'));
    const existing = new Map<string, string>([
      ['/Users/lcaraccioli/.agents/mav/SEMANTIC.md', 'LIVED HISTORY'],
    ]);
    const fleet = makeFleet({
      'lcaraccioli@upmav.lan': {
        reachable: true,
        home: '/Users/lcaraccioli',
        files: existing,
      },
    });
    const runner = fakeRunner(fleet);
    const r = placeAgentsSsh(
      'lcaraccioli',
      'upmav.lan',
      '~/.claude',
      agentsDir,
      ['mav'],
      { ...silent, dry: false, runner },
    );
    // SEMANTIC present-untouched; the other two seeded
    expect(r.report.present).toContain('mav/SEMANTIC.md');
    expect(r.report.seeded).toContain('mav/PROCEDURAL.md');
    expect(existing.get('/Users/lcaraccioli/.agents/mav/SEMANTIC.md')).toBe(
      'LIVED HISTORY',
    );
  });

  it('an unreachable host defers with rc=2 (never silently "landed")', () => {
    const { agentsDir } = buildRenderTree(tmp('agent-forge-render-'));
    const fleet = makeFleet({
      'lcaraccioli@dead.lan': { reachable: false, home: '/Users/lcaraccioli' },
    });
    const runner = fakeRunner(fleet);
    const r = placeAgentsSsh(
      'lcaraccioli',
      'dead.lan',
      '~/.claude',
      agentsDir,
      ['mav'],
      { ...silent, dry: false, runner },
    );
    expect(r.rc).toBe(2);
    expect(r.report.copied).toBe(0);
  });

  it('the bare-home guard fires server-side (--home /Users/x -> /Users/x/.claude)', () => {
    const { agentsDir } = buildRenderTree(tmp('agent-forge-render-'));
    const fleet = makeFleet({
      'lcaraccioli@upmav.lan': { reachable: true, home: '/Users/lcaraccioli' },
    });
    const runner = fakeRunner(fleet);
    const notes: string[] = [];
    placeAgentsSsh(
      'lcaraccioli',
      'upmav.lan',
      '/Users/lcaraccioli', // a bare home, NOT ending in .claude
      agentsDir,
      ['mav'],
      { log: () => {}, warn: (l) => notes.push(l), dry: false, runner },
    );
    const host = fleet.hosts.get('lcaraccioli@upmav.lan')!;
    expect(host.files.has('/Users/lcaraccioli/.claude/agents/mav.md')).toBe(
      true,
    );
    expect(notes.join('\n')).toMatch(/is a home dir -> deploying to/);
  });
});

describe('placeSkillsSsh (fake fleet) — co-located recursion', () => {
  it('recurses a skill dir subtree (scripts/references) to the remote; scp -p preserves mode', () => {
    const tree = buildRenderTree(tmp('agent-forge-render-'));
    // a skill dir carrying co-located companions in nested subdirs
    const recur = join(tree.skillsDir, 'recur');
    mkdirSync(join(recur, 'scripts'), { recursive: true });
    mkdirSync(join(recur, 'references'), { recursive: true });
    writeFileSync(join(recur, 'SKILL.md'), '# recur\n');
    writeFileSync(join(recur, 'scripts', 'x.mjs'), '#!/usr/bin/env node\n');
    writeFileSync(join(recur, 'references', 'y.md'), '# y\n');

    const fleet = makeFleet({
      'lcaraccioli@upmav.lan': { reachable: true, home: '/Users/lcaraccioli' },
    });
    const runner = fakeRunner(fleet);
    const r = placeSkillsSsh(
      'lcaraccioli',
      'upmav.lan',
      '~/.claude',
      tree,
      ['recur'],
      { ...silent, dry: false, runner },
    );
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(1);

    const host = fleet.hosts.get('lcaraccioli@upmav.lan')!;
    const base = '/Users/lcaraccioli/.claude/skills/recur';
    // (3) the whole subtree scp'd to the mirrored remote paths
    expect(host.files.has(`${base}/SKILL.md`)).toBe(true);
    expect(host.files.has(`${base}/scripts/x.mjs`)).toBe(true);
    expect(host.files.has(`${base}/references/y.md`)).toBe(true);
    // every scp is mode-preserving (`-p`) so exec bits ride the hop
    const scpCalls = fleet.calls.filter((c) => c[0] === 'scp');
    expect(scpCalls.length).toBe(3);
    expect(scpCalls.every((c) => c.includes('-p'))).toBe(true);
    // the nested remote subdirs were pre-created
    const mkdirs = fleet.calls
      .filter(
        (c) => c[0] === 'ssh' && String(c[c.length - 1]).startsWith('mkdir -p'),
      )
      .map((c) => String(c[c.length - 1]));
    expect(mkdirs.some((m) => m.includes(`${base}/scripts`))).toBe(true);
    expect(mkdirs.some((m) => m.includes(`${base}/references`))).toBe(true);
  });

  it('a flat SKILL.md-only skill scps exactly one file (no regression)', () => {
    const tree = buildRenderTree(tmp('agent-forge-render-'));
    const fleet = makeFleet({
      'lcaraccioli@upmav.lan': { reachable: true, home: '/Users/lcaraccioli' },
    });
    const runner = fakeRunner(fleet);
    const r = placeSkillsSsh(
      'lcaraccioli',
      'upmav.lan',
      '~/.claude',
      tree,
      ['wake'],
      { ...silent, dry: false, runner },
    );
    expect(r.rc).toBe(0);
    const host = fleet.hosts.get('lcaraccioli@upmav.lan')!;
    const skillFiles = [...host.files.keys()].filter((p) =>
      p.startsWith('/Users/lcaraccioli/.claude/skills/wake/'),
    );
    expect(skillFiles).toEqual([
      '/Users/lcaraccioli/.claude/skills/wake/SKILL.md',
    ]);
  });
});

describe('deployFleet — two-host orchestration (fire local + upmav ssh)', () => {
  it('deploys fire (local) + upmav (ssh), excludes upgoose, reports per-host', () => {
    // fire is local → sandbox its .claude parent in config so we never touch $HOME.
    const fireHome = tmp('agent-forge-fire-home-');
    const root = writeConfig(tmp('demo-cfg-'), fireHome);
    const cfg = loadConfig(root)!;
    const tree = buildRenderTree(tmp('agent-forge-render-'));

    const fleet = makeFleet({
      'lcaraccioli@upmav.lan': { reachable: true, home: '/Users/lcaraccioli' },
    });
    const runner = fakeRunner(fleet);

    const r = deployFleet({
      kind: 'agent',
      scope: 'user',
      tree,
      cfg,
      // no --home: config drives each host (fire→sandbox, upmav→~/.claude via $HOME)
      runner,
      dry: false,
      log: () => {},
      warn: () => {},
    });

    // upgoose is NEVER touched
    expect(r.excluded).toContain('upgoose');
    expect(r.resolved.map((h) => h.name)).toEqual(['fire', 'upmav']);
    // both landed
    expect(r.results.find((x) => x.name === 'fire')?.status).toBe('landed');
    expect(r.results.find((x) => x.name === 'upmav')?.status).toBe('landed');
    expect(r.rc).toBe(0);
    // upmav resolved to user=lcaraccioli (the acceptance contract)
    const upmav = r.resolved.find((h) => h.name === 'upmav')!;
    expect(upmav.user).toBe('lcaraccioli');
    expect(upmav.hostname).toBe('upmav.lan');
  });

  it('a deferred (unreachable) host yields unreachable-deferred, fleet rc still 0', () => {
    const fireHome = tmp('agent-forge-fire-home-');
    const root = writeConfig(tmp('demo-cfg-'), fireHome);
    const cfg = loadConfig(root)!;
    const tree = buildRenderTree(tmp('agent-forge-render-'));
    const fleet = makeFleet({
      'lcaraccioli@upmav.lan': { reachable: false, home: '/Users/lcaraccioli' },
    });
    const runner = fakeRunner(fleet);
    const r = deployFleet({
      kind: 'agent',
      scope: 'user',
      tree,
      cfg,
      runner,
      dry: false,
      log: () => {},
      warn: () => {},
    });
    expect(r.results.find((x) => x.name === 'upmav')?.status).toBe(
      'unreachable-deferred',
    );
    // a deferred host is not a FAILURE — fleet rc stays 0 (deploy.py contract)
    expect(r.rc).toBe(0);
  });
});
