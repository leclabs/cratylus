// plan-set — the PLAN-LEVEL lifecycle mechanism (`src/toolkit/plan-set.ts`).
// Falsifiers, held against a hermetic temp git repo:
//
//   (1) a plan transitions proposed → in-flight → landed → retired (the phase
//       machine is a pure readout of on-disk placement + git).
//   (2) `list` partitions in-scope vs retired (a retired plan leaves in-scope,
//       appears under `--retired`).
//   (3) `retire` PRESERVES the plan (archive, not delete) — content recoverable.
//   (4) `landing` is derived from VCS and STORED NOWHERE (no sidecar/field; the
//       sha appears on no path under `plans/`; `landing` writes nothing).
//   (5) `retire` refuses when ¬landed (precondition), and stages (never commits).

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type PlanSetContext,
  landing,
  list,
  phase,
  retire,
} from '../src/toolkit/plan-set.js';

let repo: string;
let ctx: PlanSetContext;

function g(...args: string[]): string {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
}

/** Place `task` under `plans/<plan>/<state>/` (removing it from every other state). */
function placeTask(plan: string, state: string, task: string): void {
  for (const s of ['pending', 'ready', 'active', 'completed']) {
    rmSync(join(repo, 'plans', plan, s, task), { force: true });
  }
  const dir = join(repo, 'plans', plan, state);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, task), `# ${task}\n`);
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'plan-set-'));
  ctx = { repoRoot: repo };
  g('init', '-q');
  g('config', 'user.email', 'test@example.com');
  g('config', 'user.name', 'test');
  g('commit', '-q', '--allow-empty', '-m', 'root');
  // Author a plan: PLAN.md + one task in pending → proposed.
  const plan = join(repo, 'plans', 'demo');
  for (const s of ['pending', 'ready', 'active', 'completed']) {
    mkdirSync(join(plan, s), { recursive: true });
  }
  writeFileSync(join(plan, 'PLAN.md'), '# demo plan\n');
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('phase — the plan-level lifecycle machine (readout, not stored)', () => {
  it('transitions proposed → in-flight → landed → retired', () => {
    // proposed: no dispatched task.
    placeTask('demo', 'pending', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'author demo');
    expect(phase(ctx, 'demo')).toBe('proposed');

    // in-flight: a task dispatched (active), result not yet landed.
    placeTask('demo', 'active', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'dispatch t1');
    expect(phase(ctx, 'demo')).toBe('in-flight');

    // landed: all tasks completed AND that state committed to trunk.
    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete t1');
    expect(phase(ctx, 'demo')).toBe('landed');

    // retired: after retire (archived on disk).
    retire(ctx, 'demo');
    expect(phase(ctx, 'demo')).toBe('retired');
  });

  it('done-on-disk but not committed to trunk stays in-flight (landing is a VCS event)', () => {
    placeTask('demo', 'completed', 't1.md');
    // uncommitted → git history has no done commit → not landed.
    expect(phase(ctx, 'demo')).toBe('in-flight');
  });
});

describe('list — membership partition (in-scope vs retired)', () => {
  it('a retired plan leaves in-scope and is enumerable under --retired', () => {
    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete');
    expect(list(ctx)).toEqual(['demo']);
    expect(list(ctx, { retired: true })).toEqual([]);

    retire(ctx, 'demo');
    expect(list(ctx)).toEqual([]);
    expect(list(ctx, { retired: true })).toEqual(['demo']);
  });
});

describe('retire — preserve, don’t delete', () => {
  it('preserves content + history (recoverable), staged not committed', () => {
    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete');
    const head = g('rev-parse', 'HEAD');

    retire(ctx, 'demo');

    // content recoverable at the new location.
    expect(
      readFileSync(join(repo, 'plans', '.retired', 'demo', 'PLAN.md'), 'utf8'),
    ).toBe('# demo plan\n');
    // history preserved: the move is a rename in the staged tree, not a delete+add.
    const staged = g('diff', '--cached', '--name-status', '-M');
    expect(staged).toMatch(/^R/m);
    // staged, NOT committed — HEAD unchanged, working tree dirty.
    expect(g('rev-parse', 'HEAD')).toBe(head);
    expect(g('status', '--porcelain')).not.toBe('');
  });

  it('refuses when the plan has not landed (precondition landed(P))', () => {
    placeTask('demo', 'active', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'dispatch');
    expect(() => retire(ctx, 'demo')).toThrow(/landed/);
  });
});

describe('landing — derived on demand, stored nowhere', () => {
  it('returns the first trunk commit where the plan is done, writing nothing', () => {
    placeTask('demo', 'active', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'dispatch');
    expect(landing(ctx, 'demo')).toBeUndefined();

    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete');
    const doneCommit = g('rev-parse', 'HEAD');

    // a further, unrelated commit must not move the landing sha (it's the FIRST).
    placeTask('demo', 'completed', 't2.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'add t2 (still done)');

    const before = g('status', '--porcelain');
    const sha = landing(ctx, 'demo');
    const after = g('status', '--porcelain');

    expect(sha).toBe(doneCommit);
    // NEVER STORED: the derivation wrote nothing (working tree unchanged) …
    expect(after).toBe(before);
    // … and the sha is persisted on no path under plans/ (no sidecar/field).
    // `git grep` exits 1 on no match — that (an empty hit set) is the pass.
    let hit = '';
    try {
      hit = g('grep', '-l', sha as string, '--', 'plans');
    } catch {
      hit = '';
    }
    expect(hit).toBe('');
  });
});
