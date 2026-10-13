// Local placers overwrite rendered files, leave unrelated files alone, and honor dry runs.

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { placeAgentsLocal, placeSkillsLocal } from '../../src/deploy/index.js';
import { buildRenderTree, tmp } from './helpers.js';

const silent = { dry: false, log: () => {}, warn: () => {} };

describe('placeAgentsLocal', () => {
  it('never prunes: a name removed from a later deploy leaves the others standing', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const omp = join(tmp('forge-host-'), '.omp');
    placeAgentsLocal(omp, agentsDir, ['mav', 'nico'], silent);
    // redeploy only mav — nico's landed def is not swept
    placeAgentsLocal(omp, agentsDir, ['mav'], silent);
    expect(existsSync(join(omp, 'agents', 'nico.md'))).toBe(true);
  });

  it('warns (not throws) on a missing def', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const omp = join(tmp('forge-host-'), '.omp');
    const warns: string[] = [];
    const r = placeAgentsLocal(omp, agentsDir, ['ghost'], {
      dry: false,
      log: () => {},
      warn: (l) => warns.push(l),
    });
    expect(r.report.copied).toBe(0);
    expect(warns.join('\n')).toMatch(/no def for ghost/);
  });

  it('dry-run changes nothing on disk', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const omp = join(tmp('forge-host-'), '.omp');
    placeAgentsLocal(omp, agentsDir, ['mav'], { ...silent, dry: true });
    expect(existsSync(join(omp, 'agents', 'mav.md'))).toBe(false);
  });
});

describe('placeSkillsLocal', () => {
  it('copies each skill dir SKILL.md to the host skills root', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    const omp = join(tmp('forge-host-'), '.omp');

    const r = placeSkillsLocal(omp, tree, ['wake', 'memory'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(2);
    expect(existsSync(join(omp, 'skills', 'memory', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(omp, 'skills', 'wake', 'SKILL.md'))).toBe(true);
  });

  it('recurses nested subdirs (scripts/references) preserving structure + exec bit', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    // a skill dir carrying co-located companions in nested subdirs
    const recur = join(tree.skillsDir, 'recur');
    mkdirSync(join(recur, 'scripts'), { recursive: true });
    mkdirSync(join(recur, 'references'), { recursive: true });
    writeFileSync(join(recur, 'SKILL.md'), '# recur\n', 'utf-8');
    const script = join(recur, 'scripts', 'x.mjs');
    writeFileSync(script, '#!/usr/bin/env node\n', 'utf-8');
    chmodSync(script, 0o755); // exec bit set at source
    writeFileSync(join(recur, 'references', 'y.md'), '# y\n', 'utf-8');

    const omp = join(tmp('forge-host-'), '.omp');
    const r = placeSkillsLocal(omp, tree, ['recur'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(1);

    // (1) the subtree lands INTACT at the mirrored dest paths
    const destScript = join(omp, 'skills', 'recur', 'scripts', 'x.mjs');
    expect(readFileSync(destScript, 'utf-8')).toBe('#!/usr/bin/env node\n');
    expect(
      readFileSync(join(omp, 'skills', 'recur', 'references', 'y.md'), 'utf-8'),
    ).toBe('# y\n');
    // (2) exec bit preserved on scripts/*
    expect(statSync(destScript).mode & 0o111).not.toBe(0);
  });

  it('a flat SKILL.md-only skill deploys exactly one file (no regression)', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    const omp = join(tmp('forge-host-'), '.omp');
    placeSkillsLocal(omp, tree, ['wake'], silent);
    // wake is SKILL.md-only — dest holds exactly that, no phantom subdirs
    expect(readdirSync(join(omp, 'skills', 'wake'))).toEqual(['SKILL.md']);
  });

  it('stages a committed `assets:` companion beside SKILL.md', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    // seed a committed asset in the memory skill source dir
    writeFileSync(
      join(tree.skillsDir, 'memory', 'logo.txt'),
      'LOGO\n',
      'utf-8',
    );
    const omp = join(tmp('forge-host-'), '.omp');

    const r = placeSkillsLocal(
      omp,
      { ...tree, companions: { memory: { assets: ['logo.txt'] } } },
      ['memory'],
      silent,
    );
    expect(r.rc).toBe(0);
    expect(existsSync(join(omp, 'skills', 'memory', 'logo.txt'))).toBe(true);
  });
});
