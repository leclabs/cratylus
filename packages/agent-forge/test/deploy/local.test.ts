// Local placer parity with place/local.py + seeds.py + scope.py:
//   - defs overwritten freely (regenerated substance)
//   - SELF/MEMORY/EPISODIC seeded only-if-absent; existing sidecars untouched
//   - EPISODIC seeds an EMPTY `.jsonl` (NOT `.md` — store migrated to JSONL)
//   - bare-home guard (self-correct + loud NOTE) / `.claude`-suffix used verbatim
//   - never-prunes (a removed name leaves the live tree's other files standing)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  placeAgentsLocal,
  placeSkillsLocal,
  projectScope,
  userScope,
} from '../../src/deploy/index.js';
import { buildBundleSrc, buildRenderTree, tmp } from './helpers.js';

const silent = { dry: false, log: () => {}, warn: () => {} };

describe('placeAgentsLocal', () => {
  it('writes defs and seeds the three sidecars (EPISODIC is .jsonl, empty)', () => {
    const src = tmp('koine-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('koine-host-'), '.claude');

    const r = placeAgentsLocal(claude, agentsDir, ['mav', 'nico'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(2);

    // def landed
    expect(existsSync(join(claude, 'agents', 'mav.md'))).toBe(true);
    // sidecars seeded
    expect(existsSync(join(claude, 'agents', 'mav', 'SELF.md'))).toBe(true);
    expect(existsSync(join(claude, 'agents', 'mav', 'MEMORY.md'))).toBe(true);
    // EPISODIC migrated to JSONL — empty file, NOT a .md
    const epi = join(claude, 'agents', 'mav', 'EPISODIC.jsonl');
    expect(existsSync(epi)).toBe(true);
    expect(readFileSync(epi, 'utf-8')).toBe('');
    expect(existsSync(join(claude, 'agents', 'mav', 'EPISODIC.md'))).toBe(
      false,
    );

    expect(r.report.seeded).toContain('mav/SELF.md');
    expect(r.report.seeded).toContain('mav/EPISODIC.jsonl');
  });

  it('overwrites the def freely but NEVER clobbers an existing sidecar', () => {
    const src = tmp('koine-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('koine-host-'), '.claude');

    // first deploy seeds everything
    placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    // the agent edits its own SELF.md (the self-authored individual)
    const selfPath = join(claude, 'agents', 'mav', 'SELF.md');
    writeFileSync(selfPath, 'MY LIVED HISTORY — do not clobber', 'utf-8');
    // the def is regenerated upstream (new substance)
    writeFileSync(join(agentsDir, 'mav.md'), '# mav def v2\n', 'utf-8');

    const r = placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    // def overwritten with v2
    expect(readFileSync(join(claude, 'agents', 'mav.md'), 'utf-8')).toBe(
      '# mav def v2\n',
    );
    // sidecar UNTOUCHED
    expect(readFileSync(selfPath, 'utf-8')).toBe(
      'MY LIVED HISTORY — do not clobber',
    );
    expect(r.report.present).toEqual([
      'mav/SELF.md',
      'mav/MEMORY.md',
      'mav/EPISODIC.jsonl',
    ]);
    expect(r.report.seeded).toEqual([]);
  });

  it('never prunes: a name removed from a later deploy leaves the others standing', () => {
    const src = tmp('koine-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('koine-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav', 'nico'], silent);
    // redeploy only mav — nico's landed files are not swept
    placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    expect(existsSync(join(claude, 'agents', 'nico.md'))).toBe(true);
    expect(existsSync(join(claude, 'agents', 'nico', 'SELF.md'))).toBe(true);
  });

  it('warns (not throws) on a missing def', () => {
    const src = tmp('koine-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('koine-host-'), '.claude');
    const warns: string[] = [];
    const r = placeAgentsLocal(claude, agentsDir, ['ghost'], {
      dry: false,
      log: () => {},
      warn: (l) => warns.push(l),
    });
    expect(r.report.copied).toBe(0);
    expect(warns.join('\n')).toMatch(/no def for ghost/);
  });

  it('dry-run changes nothing on disk', () => {
    const src = tmp('koine-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('koine-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav'], { ...silent, dry: true });
    expect(existsSync(join(claude, 'agents', 'mav.md'))).toBe(false);
  });
});

describe('placeSkillsLocal', () => {
  it('copies SKILL.md and stages a bundle companion (episodic.mjs)', () => {
    const src = tmp('koine-render-');
    const tree = buildRenderTree(src);
    const bundleRoot = buildBundleSrc(tmp('koine-bundle-'), true);
    const claude = join(tmp('koine-host-'), '.claude');

    const r = placeSkillsLocal(
      claude,
      {
        ...tree,
        companions: { memory: { bundle: ['episodic/dist/episodic.mjs'] } },
        bundleBaseRoot: bundleRoot,
      },
      ['wake', 'memory'],
      silent,
    );
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(2);
    expect(r.report.bundled).toContain('memory/episodic.mjs');
    // SKILL.md + the staged tool both land in the host skill dir
    expect(existsSync(join(claude, 'skills', 'memory', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(claude, 'skills', 'memory', 'episodic.mjs'))).toBe(
      true,
    );
    expect(existsSync(join(claude, 'skills', 'wake', 'SKILL.md'))).toBe(true);
  });
});

describe('scope resolution', () => {
  it('userScope: bare home self-corrects (.claude appended) with a loud NOTE', () => {
    const r = userScope('/Users/lex');
    expect(r.claudeDir.endsWith('/.claude')).toBe(true);
    expect(r.note?.message).toMatch(/is a home dir -> deploying to/);
  });

  it('userScope: a path already ending in .claude is used verbatim (no NOTE)', () => {
    const r = userScope('/Users/lex/.claude');
    expect(r.claudeDir).toBe('/Users/lex/.claude');
    expect(r.note).toBeNull();
  });

  it('projectScope: <project>/.claude', () => {
    const r = projectScope('/repo');
    expect(r.claudeDir).toBe('/repo/.claude');
  });
});
