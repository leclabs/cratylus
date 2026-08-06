// THE WRITER CONVERGES ITS OUT DIR — the control the defect report demanded.
//
// The bug: `writeRenderTree` only ever wrote, so a deleted or renamed cell's
// artifact outlived it, `deploy` shipped the ghost, and a retired agent kept
// reaching the host. Reproduced originally as `touch .cratylus/claude/agents/ZOMBIE.md
// && pnpm canon:project` → ZOMBIE.md survives.
//
// This control is LOAD-BEARING, not ceremonial. `.cratylus/claude*` are gitignored, so
// CI always projects onto a cold tree and the render oracle NEVER exercises the
// prune path — a regression here would be caught by nothing else in the suite.
// Hence the shape of every case below: write a tree, write a DIFFERENT tree over
// it, and assert on what is no longer there.
//
// The negative half matters as much as the positive: a prune that removed
// everything it found would pass a "the stale file is gone" assertion and be a
// data-loss hazard pointed at a consumer's `--out .`. So the refusals are pinned
// too — the bootstrap bound, the un-recorded bystander, and the escape guard.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProjectedFile } from '../../src/project/index.js';
import {
  RENDER_MANIFEST_REL,
  writeRenderTree,
} from '../../src/project/write.js';

let out: string;
beforeEach(() => {
  out = mkdtempSync(join(tmpdir(), 'render-prune-'));
});

const f = (path: string, content = `// ${path}\n`): ProjectedFile => ({
  path,
  content,
});

/** The corpus as it stands, and the corpus with one cell retired. */
const BEFORE: ProjectedFile[] = [
  f('agents/keeper.md'),
  f('agents/retiree.md'),
  f('skills/wake/SKILL.md'),
  f('skills/doomed/SKILL.md'),
  f('skills/doomed/scripts/worker.mjs'),
];
const AFTER: ProjectedFile[] = [
  f('agents/keeper.md'),
  f('skills/wake/SKILL.md'),
];

describe('writeRenderTree — the writer owns cleaning', () => {
  it('REMOVES the artifact of a cell that no longer projects', () => {
    const first = writeRenderTree(out, BEFORE);
    expect(first.bootstrap).toBe(true);
    expect(existsSync(join(out, 'agents/retiree.md'))).toBe(true);

    const second = writeRenderTree(out, AFTER);

    // The positive: the retired cell's artifacts are gone from disk.
    expect(existsSync(join(out, 'agents/retiree.md'))).toBe(false);
    expect(existsSync(join(out, 'skills/doomed/SKILL.md'))).toBe(false);
    expect(existsSync(join(out, 'skills/doomed/scripts/worker.mjs'))).toBe(
      false,
    );
    expect(second.removed).toEqual([
      'agents/retiree.md',
      'skills/doomed/SKILL.md',
      'skills/doomed/scripts/worker.mjs',
    ]);

    // And the surviving cells are untouched — a prune, not a wipe-and-rewrite.
    expect(existsSync(join(out, 'agents/keeper.md'))).toBe(true);
    expect(existsSync(join(out, 'skills/wake/SKILL.md'))).toBe(true);
  });

  it('takes back the directories the removal emptied', () => {
    writeRenderTree(out, BEFORE);
    writeRenderTree(out, AFTER);
    // `skills/doomed/scripts/` and `skills/doomed/` held nothing else.
    expect(existsSync(join(out, 'skills/doomed/scripts'))).toBe(false);
    expect(existsSync(join(out, 'skills/doomed'))).toBe(false);
    // ...but a dir that still holds a live artifact stays, and so does the root.
    expect(existsSync(join(out, 'skills/wake'))).toBe(true);
    expect(existsSync(out)).toBe(true);
  });

  it('CONVERGES — reprojecting the reduced corpus twice is a fixed point', () => {
    writeRenderTree(out, BEFORE);
    writeRenderTree(out, AFTER);
    const third = writeRenderTree(out, AFTER);
    expect(third.removed).toEqual([]);
    expect(third.bootstrap).toBe(false);
  });

  it('REFUSES to delete on a first run — nothing is attributable yet', () => {
    // The bound that makes a consumer's `--out .` safe: a populated dir with no
    // record of ours in it loses nothing, because we can account for nothing.
    mkdirSync(join(out, 'agents'), { recursive: true });
    writeFileSync(join(out, 'agents/ZOMBIE.md'), 'the operator wrote this\n');
    writeFileSync(join(out, 'NOTES.md'), 'and this\n');

    const r = writeRenderTree(out, AFTER);

    expect(r.bootstrap).toBe(true);
    expect(r.removed).toEqual([]);
    expect(existsSync(join(out, 'agents/ZOMBIE.md'))).toBe(true);
    expect(existsSync(join(out, 'NOTES.md'))).toBe(true);
  });

  it('REFUSES to delete a file it never wrote, even with a record present', () => {
    writeRenderTree(out, BEFORE); // establishes the record
    // A bystander that appears AFTER the record exists — an operator's own file,
    // or an orphan from a pre-manifest projection. Indistinguishable, so neither
    // is ever a candidate: candidacy comes from the record, never from the dir.
    writeFileSync(join(out, 'agents/HANDMADE.md'), 'not ours\n');

    const r = writeRenderTree(out, AFTER);

    expect(r.removed).not.toContain('agents/HANDMADE.md');
    expect(existsSync(join(out, 'agents/HANDMADE.md'))).toBe(true);
  });

  it('REFUSES a recorded path that escapes the render root', () => {
    // A hand-edited or tampered record must not steer a delete out of `--out`.
    const outside = join(out, '..', `escapee-${process.pid}.md`);
    writeFileSync(outside, 'must survive\n');
    writeRenderTree(out, AFTER);
    const rec = join(out, RENDER_MANIFEST_REL);
    writeFileSync(
      rec,
      JSON.stringify({
        version: 1,
        files: [`../escapee-${process.pid}.md`, 'agents/keeper.md'],
      }),
    );

    const r = writeRenderTree(out, [f('skills/wake/SKILL.md')]);

    expect(r.removed).not.toContain(`../escapee-${process.pid}.md`);
    expect(existsSync(outside)).toBe(true);
    // The in-root path in that same record was still swept — the guard rejects
    // the escape, it does not abandon the prune.
    expect(existsSync(join(out, 'agents/keeper.md'))).toBe(false);
  });

  it('keeps the record OUT of the projected bytes and out of its own candidacy', () => {
    writeRenderTree(out, BEFORE);
    const rec = JSON.parse(
      readFileSync(join(out, RENDER_MANIFEST_REL), 'utf-8'),
    ) as { version: number; files: string[] };
    expect(rec.files).not.toContain(RENDER_MANIFEST_REL);
    // Sorted, so the record is byte-stable across runs that emit the same tree
    // in a different order — an unstable record churns every diff.
    expect(rec.files).toEqual([...rec.files].sort());
    // It survives its own prune, or the next run would read as a bootstrap
    // forever and never converge again.
    writeRenderTree(out, AFTER);
    expect(existsSync(join(out, RENDER_MANIFEST_REL))).toBe(true);
  });

  it('an unreadable record reads as ABSENT and prunes nothing', () => {
    writeRenderTree(out, BEFORE);
    writeFileSync(join(out, RENDER_MANIFEST_REL), '{ not json');

    const r = writeRenderTree(out, AFTER);

    expect(r.bootstrap).toBe(true);
    expect(r.removed).toEqual([]);
    expect(existsSync(join(out, 'agents/retiree.md'))).toBe(true);
  });
});
