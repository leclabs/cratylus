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
//   (5) `retire` refuses when ¬terminal (precondition terminal = landed ∨
//       superseded), and stages (never commits).
//   (6) supersession is a STORED declaration (`.superseded-by`, non-derivable): it
//       makes phase=superseded and lets a never-landed plan retire canonically.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type PlanSetContext,
  landing,
  list,
  phase,
  retire,
  supersede,
  superseded,
  terminal,
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

  it('refuses when the plan is not terminal (precondition terminal(P))', () => {
    placeTask('demo', 'active', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'dispatch');
    expect(() => retire(ctx, 'demo')).toThrow(/terminal/);
  });
});

describe('supersede — the stored terminal declaration (non-derivable)', () => {
  /** Author a second plan so `supersede` accepts it as a known successor. */
  function authorSuccessor(name: string): void {
    const dir = join(repo, 'plans', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'PLAN.md'), `# ${name}\n`);
  }

  it('makes phase=superseded and lets a never-landed plan retire; marker travels to archive', () => {
    placeTask('demo', 'active', 't1.md'); // in-flight, never landed
    authorSuccessor('successor');
    g('add', '-A');
    g('commit', '-q', '-m', 'author demo + successor');
    expect(phase(ctx, 'demo')).toBe('in-flight');
    expect(terminal(ctx, 'demo')).toBe(false);
    expect(() => retire(ctx, 'demo')).toThrow(/terminal/);

    supersede(ctx, 'demo', 'successor');
    expect(superseded(ctx, 'demo')).toBe(true);
    expect(phase(ctx, 'demo')).toBe('superseded');
    expect(terminal(ctx, 'demo')).toBe(true);

    // retire now succeeds though demo never landed; the marker survives the move.
    retire(ctx, 'demo');
    expect(phase(ctx, 'demo')).toBe('retired');
    expect(list(ctx, { retired: true })).toContain('demo');
    expect(
      readFileSync(
        join(repo, 'plans', '.retired', 'demo', '.superseded-by'),
        'utf8',
      ).trim(),
    ).toBe('successor');
  });

  it('stages the marker (commit gated) and rejects unknown / self successor', () => {
    placeTask('demo', 'pending', 't1.md');
    authorSuccessor('successor');
    g('add', '-A');
    g('commit', '-q', '-m', 'author');

    expect(() => supersede(ctx, 'demo', 'nope')).toThrow(/successor/);
    expect(() => supersede(ctx, 'demo', 'demo')).toThrow(/itself/);

    supersede(ctx, 'demo', 'successor');
    // staged, NOT committed: the marker is in the index, HEAD unmoved.
    const staged = g('diff', '--cached', '--name-only');
    expect(staged).toMatch(/plans\/demo\/\.superseded-by/);
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

// ─── RETIREMENT INTEGRITY — the defect that bit twice in one session ────────────
//
// `terminal(P) ⇒ retire(P)` is an obligation; `retire(P) ⇒ terminal(P)` is its
// precondition. The second was unenforced, and the cost was not theoretical:
//
//   · FOUR retired plans were found carrying TEN unfinished shards. One of them,
//     event-tap/t4, had been marked ABSORBED by a supersession claim that the
//     absorbing shard's own falsifier disproves — so a fully built capability sat
//     unreachable by any agent, with nobody having decided to drop it.
//   · Then the SAME defect recurred in the very plan that fixed it: close-out was
//     landed and retired while eleven shard files still sat in pending/ready.
//
// A verdict recorded in a report is not a reconciled tree. This is the gate that
// makes the disk agree: a retired plan may hold `completed/` and nothing else.

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

describe('RETIREMENT INTEGRITY — a retired plan carries no unfinished shard', () => {
  const OPEN = ['pending', 'ready', 'active'] as const;

  /** The unfinished shards a retired-plan dir holds — the scan, named so a
   *  synthetic BAD tree can be fed to the very same code. */
  const unfinished = (root: string): string[] => {
    if (!existsSync(root)) return [];
    const out: string[] = [];
    for (const plan of readdirSync(root, { withFileTypes: true })) {
      if (!plan.isDirectory()) continue;
      for (const state of OPEN) {
        const dir = join(root, plan.name, state);
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir))
          if (f.endsWith('.md')) out.push(`${plan.name}/${state}/${f}`);
      }
    }
    return out.sort();
  };

  it('the live .retired/ tree holds only completed shards — or says it is not there', () => {
    const root = join(repoRoot, 'plans', '.retired');
    // `unfinished` returns [] for a missing root, which the FIXTURE needs and the live
    // leg must not silently inherit: with no `.retired/` tree this leg would be green
    // for having nothing to look at. "Found nothing" and "could not look" are different
    // answers, so the absence is reported rather than passed over. The tree was deleted
    // wholesale — see `plans/decomplect/completed/the-brand-sweep-rewrote-the-record-not-only-the-source.md`.
    if (!existsSync(root)) {
      console.warn(
        'plan-set (retirement integrity): NO LIVE SUBJECT — plans/.retired/ does not exist. ' +
          'The scan is exercised by its fixture only.',
      );
      return;
    }
    expect(
      unfinished(root),
      'retired plans still carrying unfinished shards — each is work nobody decided to drop:',
    ).toEqual([]);
  });

  it('is non-vacuous — the scan FLAGS a retired plan with an open shard', () => {
    const root = mkdtempSync(join(tmpdir(), 'retire-integrity-'));
    // BAD: a retired plan with a shard still in `ready`.
    mkdirSync(join(root, 'ghost', 'ready'), { recursive: true });
    writeFileSync(join(root, 'ghost', 'ready', 't1-orphan.md'), '# orphan\n');
    expect(unfinished(root)).toEqual(['ghost/ready/t1-orphan.md']);
    // EXONERATES: completed-only is clean, and so is an empty open dir.
    mkdirSync(join(root, 'clean', 'completed'), { recursive: true });
    writeFileSync(join(root, 'clean', 'completed', 't1-done.md'), '# done\n');
    mkdirSync(join(root, 'clean', 'pending'), { recursive: true });
    expect(unfinished(join(root, 'clean'))).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });
});
