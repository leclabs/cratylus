// Local placer contract (scoped-memory-v2 D1/D5):
//   - defs overwritten freely (regenerated substance)
//   - SEMANTIC/PROCEDURAL/EPISODIC seeded only-if-absent; existing sidecars untouched
//   - EPISODIC seeds an EMPTY `.jsonl` (NOT `.md` — store migrated to JSONL)
//   - the v1 stores {SELF.md, MEMORY.md} are NEVER created (no resurrection:
//     a home carrying only v2 stores stays v1-free after deploy)
//   - bare-home guard (self-correct + loud NOTE) / `.claude`-suffix used verbatim
//   - never-prunes (a removed name leaves the live tree's other files standing)

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
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
  it('writes defs and seeds EXACTLY the three v2 sidecars (EPISODIC is .jsonl, empty)', () => {
    const src = tmp('agent-forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('agent-forge-host-'), '.claude');

    const r = placeAgentsLocal(claude, agentsDir, ['mav', 'nico'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(2);

    // def landed
    expect(existsSync(join(claude, 'agents', 'mav.md'))).toBe(true);
    // the sidecar dir holds EXACTLY the three v2 stores — nothing else
    expect(readdirSync(join(claude, 'agents', 'mav')).sort()).toEqual([
      'EPISODIC.jsonl',
      'PROCEDURAL.md',
      'SEMANTIC.md',
    ]);
    // v2 seed headers landed
    expect(
      readFileSync(join(claude, 'agents', 'mav', 'SEMANTIC.md'), 'utf-8'),
    ).toMatch(/^# mav — semantic/);
    expect(
      readFileSync(join(claude, 'agents', 'mav', 'PROCEDURAL.md'), 'utf-8'),
    ).toMatch(/^# mav — procedural/);
    // EPISODIC is JSONL — empty file, NOT a .md
    const epi = join(claude, 'agents', 'mav', 'EPISODIC.jsonl');
    expect(readFileSync(epi, 'utf-8')).toBe('');
    // the retired v1 stores are NOT created
    expect(existsSync(join(claude, 'agents', 'mav', 'SELF.md'))).toBe(false);
    expect(existsSync(join(claude, 'agents', 'mav', 'MEMORY.md'))).toBe(false);

    expect(r.report.seeded).toContain('mav/SEMANTIC.md');
    expect(r.report.seeded).toContain('mav/PROCEDURAL.md');
    expect(r.report.seeded).toContain('mav/EPISODIC.jsonl');
  });

  it('overwrites the def freely but NEVER clobbers an existing sidecar (sha+mtime proof)', () => {
    const src = tmp('agent-forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('agent-forge-host-'), '.claude');

    // first deploy seeds everything
    placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    // the agent edits its own SEMANTIC.md (the self-authored individual)
    const semPath = join(claude, 'agents', 'mav', 'SEMANTIC.md');
    writeFileSync(semPath, 'MY LIVED HISTORY — do not clobber', 'utf-8');
    // the def is regenerated upstream (new substance)
    writeFileSync(join(agentsDir, 'mav.md'), '# mav def v2\n', 'utf-8');

    // snapshot every sidecar (content + mtime) before the second deploy
    const sidecarDir = join(claude, 'agents', 'mav');
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
    const src = tmp('agent-forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('agent-forge-host-'), '.claude');

    // a lived-in v2-only home: all three stores present + populated, no v1 files
    const selfdir = join(claude, 'agents', 'mav');
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
    const src = tmp('agent-forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('agent-forge-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav', 'nico'], silent);
    // redeploy only mav — nico's landed files are not swept
    placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    expect(existsSync(join(claude, 'agents', 'nico.md'))).toBe(true);
    expect(existsSync(join(claude, 'agents', 'nico', 'SEMANTIC.md'))).toBe(
      true,
    );
  });

  it('warns (not throws) on a missing def', () => {
    const src = tmp('agent-forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('agent-forge-host-'), '.claude');
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
    const src = tmp('agent-forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('agent-forge-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav'], { ...silent, dry: true });
    expect(existsSync(join(claude, 'agents', 'mav.md'))).toBe(false);
  });
});

describe('placeSkillsLocal', () => {
  it('copies SKILL.md and stages a bundle companion (episodic.mjs)', () => {
    const src = tmp('agent-forge-render-');
    const tree = buildRenderTree(src);
    const bundleRoot = buildBundleSrc(tmp('agent-forge-bundle-'), true);
    const claude = join(tmp('agent-forge-host-'), '.claude');

    const r = placeSkillsLocal(
      claude,
      {
        ...tree,
        companions: { memory: { bundle: ['agent-memory/dist/episodic.mjs'] } },
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
