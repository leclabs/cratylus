// Local placer contract (scoped-memory-v2 D1/D5):
//   - defs overwritten freely (regenerated substance)
//   - SEMANTIC/PROCEDURAL/EPISODIC seeded only-if-absent; existing sidecars untouched
//   - EPISODIC seeds an EMPTY `.jsonl` (NOT `.md` — store migrated to JSONL)
//   - the v1 stores {SELF.md, MEMORY.md} are NEVER created (no resurrection:
//     a home carrying only v2 stores stays v1-free after deploy)
//   - bare-home guard (self-correct + loud NOTE) / `.claude`-suffix used verbatim
//   - the PLACER never prunes (a removed name leaves the live tree's other files
//     standing). Convergence is the ORCHESTRATOR's job, bounded by the deploy
//     manifest — see `prune.test.ts`.

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  placeAgentsLocal,
  placeSkillsLocal,
  projectScope,
  userScope,
} from '../../src/deploy/index.js';
import { buildRenderTree, tmp } from './helpers.js';

const silent = { dry: false, log: () => {}, warn: () => {} };

describe('placeAgentsLocal', () => {
  it('writes defs and seeds EXACTLY the three v2 sidecars (EPISODIC is .jsonl, empty)', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');

    const r = placeAgentsLocal(claude, agentsDir, ['mav', 'nico'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(2);

    // def landed
    expect(existsSync(join(claude, 'agents', 'mav.md'))).toBe(true);
    // the sidecar dir holds EXACTLY the three v2 stores — nothing else
    // (sidecars seed to the harness-neutral `.agents` sibling of `.claude`)
    expect(readdirSync(join(dirname(claude), '.agents', 'mav')).sort()).toEqual(
      ['EPISODIC.jsonl', 'PROCEDURAL.md', 'SEMANTIC.md'],
    );
    // v2 seed headers landed
    expect(
      readFileSync(
        join(dirname(claude), '.agents', 'mav', 'SEMANTIC.md'),
        'utf-8',
      ),
    ).toMatch(/^# mav — semantic/);
    expect(
      readFileSync(
        join(dirname(claude), '.agents', 'mav', 'PROCEDURAL.md'),
        'utf-8',
      ),
    ).toMatch(/^# mav — procedural/);
    // EPISODIC is JSONL — empty file, NOT a .md
    const epi = join(dirname(claude), '.agents', 'mav', 'EPISODIC.jsonl');
    expect(readFileSync(epi, 'utf-8')).toBe('');
    // the retired v1 stores are NOT created
    expect(existsSync(join(dirname(claude), '.agents', 'mav', 'SELF.md'))).toBe(
      false,
    );
    expect(
      existsSync(join(dirname(claude), '.agents', 'mav', 'MEMORY.md')),
    ).toBe(false);

    expect(r.report.seeded).toContain('mav/SEMANTIC.md');
    expect(r.report.seeded).toContain('mav/PROCEDURAL.md');
    expect(r.report.seeded).toContain('mav/EPISODIC.jsonl');
  });

  it('overwrites the def freely but NEVER clobbers an existing sidecar (sha+mtime proof)', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');

    // first deploy seeds everything
    placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    // the agent edits its own SEMANTIC.md (the self-authored individual)
    const semPath = join(dirname(claude), '.agents', 'mav', 'SEMANTIC.md');
    writeFileSync(semPath, 'MY LIVED HISTORY — do not clobber', 'utf-8');
    // the def is regenerated upstream (new substance)
    writeFileSync(join(agentsDir, 'mav.md'), '# mav def v2\n', 'utf-8');

    // snapshot every sidecar (content + mtime) before the second deploy
    const sidecarDir = join(dirname(claude), '.agents', 'mav');
    const before = new Map(
      readdirSync(sidecarDir).map((f) => {
        const p = join(sidecarDir, f);
        return [f, [readFileSync(p, 'utf-8'), statSync(p).mtimeMs]] as const;
      }),
    );

    const r = placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    // def overwritten with v2
    expect(readFileSync(join(claude, 'agents', 'mav.md'), 'utf-8')).toBe(
      '# mav def v2\n',
    );
    // every sidecar byte-identical AND untouched on disk (mtime)
    for (const [f, [content, mtime]] of before) {
      const p = join(sidecarDir, f);
      expect(readFileSync(p, 'utf-8')).toBe(content);
      expect(statSync(p).mtimeMs).toBe(mtime);
    }
    expect(r.report.present).toEqual([
      'mav/SEMANTIC.md',
      'mav/PROCEDURAL.md',
      'mav/EPISODIC.jsonl',
    ]);
    expect(r.report.seeded).toEqual([]);
  });

  it('RESURRECTION GUARD: a home carrying only v2 stores stays v1-free after deploy', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');

    // a lived-in v2-only home: all three stores present + populated, no v1 files
    const selfdir = join(dirname(claude), '.agents', 'mav');
    mkdirSync(selfdir, { recursive: true });
    writeFileSync(join(selfdir, 'SEMANTIC.md'), '# mav — semantic\nLIVED\n');
    writeFileSync(join(selfdir, 'PROCEDURAL.md'), '# mav — procedural\nWISE\n');
    writeFileSync(join(selfdir, 'EPISODIC.jsonl'), '{"id":"01X"}\n');

    const r = placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    expect(r.rc).toBe(0);
    // nothing seeded, all three reported present-untouched
    expect(r.report.seeded).toEqual([]);
    expect(r.report.present).toEqual([
      'mav/SEMANTIC.md',
      'mav/PROCEDURAL.md',
      'mav/EPISODIC.jsonl',
    ]);
    // v1 is NOT resurrected under any input
    expect(readdirSync(selfdir).sort()).toEqual([
      'EPISODIC.jsonl',
      'PROCEDURAL.md',
      'SEMANTIC.md',
    ]);
  });

  it('never prunes: a name removed from a later deploy leaves the others standing', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav', 'nico'], silent);
    // redeploy only mav — nico's landed files are not swept
    placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    expect(existsSync(join(claude, 'agents', 'nico.md'))).toBe(true);
    expect(
      existsSync(join(dirname(claude), '.agents', 'nico', 'SEMANTIC.md')),
    ).toBe(true);
  });

  it('warns (not throws) on a missing def', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
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
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav'], { ...silent, dry: true });
    expect(existsSync(join(claude, 'agents', 'mav.md'))).toBe(false);
  });
});

describe('placeSkillsLocal', () => {
  it('copies each skill dir SKILL.md to the host skills root', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');

    const r = placeSkillsLocal(claude, tree, ['wake', 'memory'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(2);
    expect(existsSync(join(claude, 'skills', 'memory', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(claude, 'skills', 'wake', 'SKILL.md'))).toBe(true);
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

    const claude = join(tmp('forge-host-'), '.claude');
    const r = placeSkillsLocal(claude, tree, ['recur'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(1);

    // (1) the subtree lands INTACT at the mirrored dest paths
    const destScript = join(claude, 'skills', 'recur', 'scripts', 'x.mjs');
    expect(readFileSync(destScript, 'utf-8')).toBe('#!/usr/bin/env node\n');
    expect(
      readFileSync(
        join(claude, 'skills', 'recur', 'references', 'y.md'),
        'utf-8',
      ),
    ).toBe('# y\n');
    // (2) exec bit preserved on scripts/*
    expect(statSync(destScript).mode & 0o111).not.toBe(0);
  });

  it('a flat SKILL.md-only skill deploys exactly one file (no regression)', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    placeSkillsLocal(claude, tree, ['wake'], silent);
    // wake is SKILL.md-only — dest holds exactly that, no phantom subdirs
    expect(readdirSync(join(claude, 'skills', 'wake'))).toEqual(['SKILL.md']);
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
    const claude = join(tmp('forge-host-'), '.claude');

    const r = placeSkillsLocal(
      claude,
      { ...tree, companions: { memory: { assets: ['logo.txt'] } } },
      ['memory'],
      silent,
    );
    expect(r.rc).toBe(0);
    expect(existsSync(join(claude, 'skills', 'memory', 'logo.txt'))).toBe(true);
  });
});

describe('scope resolution', () => {
  it('userScope: bare home self-corrects (.claude appended) with a loud NOTE', () => {
    const r = userScope('/Users/lex');
    expect(r.harnessDir.endsWith('/.claude')).toBe(true);
    expect(r.note?.message).toMatch(/is a home dir -> deploying to/);
  });

  it('userScope: a path already ending in .claude is used verbatim (no NOTE)', () => {
    const r = userScope('/Users/lex/.claude');
    expect(r.harnessDir).toBe('/Users/lex/.claude');
    expect(r.note).toBeNull();
  });

  it('projectScope: <project>/.claude', () => {
    const r = projectScope('/repo');
    expect(r.harnessDir).toBe('/repo/.claude');
  });
});
