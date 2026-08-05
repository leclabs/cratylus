// plan-set — the PLAN-LEVEL lifecycle mechanism (`src/toolkit/plan-set.ts`).
// Falsifiers, held against a hermetic temp git repo:
//
//   (1) a plan transitions proposed → in-flight → landed → retired (the phase
//       machine is a pure readout of on-disk placement + git).
//   (2) `retire` DELETES: the plan leaves `list`, no `.retired/` container appears,
//       and the content is recoverable from git — never from the working tree.
//   (3) the retirement FACT is carried by the RETIRING COMMIT, not by residence:
//       `retirement(P)` is undefined while the deletion is only staged, and is the
//       deleting sha once it lands. The twin of `landing`, stored nowhere.
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
  readdirSync,
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
  retirement,
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

    // retired: the deletion must LAND. Staged is not retired — the fact's carrier
    // is the retiring commit, so until there is one the readout still says landed.
    retire(ctx, 'demo');
    expect(phase(ctx, 'demo')).toBe('landed');
    g('commit', '-q', '-m', 'retire demo');
    expect(phase(ctx, 'demo')).toBe('retired');
    expect(retirement(ctx, 'demo')).toBe(g('rev-parse', 'HEAD'));
  });

  it('done-on-disk but not committed to trunk stays in-flight (landing is a VCS event)', () => {
    placeTask('demo', 'completed', 't1.md');
    // uncommitted → git history has no done commit → not landed.
    expect(phase(ctx, 'demo')).toBe('in-flight');
  });
});

describe('list — the plan set IS what is on disk', () => {
  it('a retired plan leaves the set, and no archive container takes its place', () => {
    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete');
    expect(list(ctx)).toEqual(['demo']);

    retire(ctx, 'demo');
    expect(list(ctx)).toEqual([]);
    // The defect this ruling closes: the old `retire` `mkdir -p`ed `plans/.retired/`,
    // so the tree the operator cleared refilled on the very next retire.
    expect(existsSync(join(repo, 'plans', '.retired'))).toBe(false);
  });
});

describe('retire — DELETE; git holds the bytes', () => {
  it('deletes the plan dir, stages the deletion, and never commits', () => {
    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete');
    const head = g('rev-parse', 'HEAD');

    retire(ctx, 'demo');

    // gone from the working tree — no relocation, no archive.
    expect(existsSync(join(repo, 'plans', 'demo'))).toBe(false);
    // the deletion is STAGED (a delete, not a rename: there is no destination).
    const staged = g('diff', '--cached', '--name-status', '-M');
    expect(staged).toMatch(/^D\s+plans\/demo\/PLAN\.md$/m);
    expect(staged).not.toMatch(/^R/m);
    // staged, NOT committed — HEAD unchanged, working tree dirty.
    expect(g('rev-parse', 'HEAD')).toBe(head);
    expect(g('status', '--porcelain')).not.toBe('');
    // what `content(retire(P)) = content(P)` was really asserting: git still has it.
    expect(g('show', `${head}:plans/demo/PLAN.md`)).toBe('# demo plan');
  });

  it('refuses when the plan is not terminal (precondition terminal(P))', () => {
    placeTask('demo', 'active', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'dispatch');
    expect(() => retire(ctx, 'demo')).toThrow(/terminal/);
  });
});

describe('retirement — the retiring commit is the carrier (twin of landing)', () => {
  it('is undefined while staged, is the deleting sha once committed, stores nothing', () => {
    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete');
    expect(retirement(ctx, 'demo')).toBeUndefined();

    retire(ctx, 'demo');
    // deleted on disk, but the FACT is a commit and there is not one yet.
    expect(retirement(ctx, 'demo')).toBeUndefined();

    g('commit', '-q', '-m', 'retire demo');
    const deleting = g('rev-parse', 'HEAD');
    expect(retirement(ctx, 'demo')).toBe(deleting);

    // a later, unrelated commit does not move it, and reading it writes nothing.
    g('commit', '-q', '--allow-empty', '-m', 'unrelated');
    const before = g('status', '--porcelain');
    expect(retirement(ctx, 'demo')).toBe(deleting);
    expect(g('status', '--porcelain')).toBe(before);
    let hit = '';
    try {
      hit = g('grep', '-l', deleting, '--', 'plans');
    } catch {
      hit = '';
    }
    expect(hit).toBe('');
  });

  it('a re-authored plan is a live plan again, not a retired one', () => {
    placeTask('demo', 'completed', 't1.md');
    g('add', '-A');
    g('commit', '-q', '-m', 'complete');
    retire(ctx, 'demo');
    g('commit', '-q', '-m', 'retire demo');
    expect(phase(ctx, 'demo')).toBe('retired');

    placeTask('demo', 'pending', 't2.md');
    writeFileSync(join(repo, 'plans', 'demo', 'PLAN.md'), '# demo again\n');
    g('add', '-A');
    g('commit', '-q', '-m', 're-author demo');
    expect(retirement(ctx, 'demo')).toBeUndefined();
    expect(list(ctx)).toEqual(['demo']);
  });
});

describe('supersede — the stored terminal declaration (non-derivable)', () => {
  /** Author a second plan so `supersede` accepts it as a known successor. */
  function authorSuccessor(name: string): void {
    const dir = join(repo, 'plans', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'PLAN.md'), `# ${name}\n`);
  }

  it('makes phase=superseded and lets a never-landed plan retire; the marker dies with it', () => {
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
    g('commit', '-q', '-m', 'supersede demo');

    // retire succeeds though demo never landed. The stored marker is deleted with
    // the plan — it was the carrier for a plan that still existed; once P leaves
    // `Plans` the retiring commit is what carries the fact.
    retire(ctx, 'demo');
    g('commit', '-q', '-m', 'retire demo');
    expect(phase(ctx, 'demo')).toBe('retired');
    expect(list(ctx)).toEqual(['successor']);
    expect(existsSync(join(repo, 'plans', 'demo'))).toBe(false);
    expect(superseded(ctx, 'demo')).toBe(false);
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
// A verdict recorded in a report is not a reconciled tree: a retired plan may hold
// `completed/` and nothing else.
//
// THE LIVE LEG IS GONE, PERMANENTLY, AND IT WAS RIGHT TO DELETE IT. `retire` now
// DELETES, so there is no retired-plan tree to scan and never will be again. The
// old leg warned "NO LIVE SUBJECT — plans/.retired/ does not exist", which was an
// honest report of a TEMPORARY state (the tree had just been cleared) and is a lie
// as a permanent one: it would warn forever about a subject that cannot exist, and
// a warning nobody can ever act on is noise that trains readers to skip warnings.
//
// THE PROPERTY NOW HAS AN OWNER, AND IT IS `retire` ITSELF. The detector used to run
// POST-HOC over the archive. With deletion there is nothing to scan — the property did
// not become false, it became UNOBSERVABLE, which is how an invariant rots without
// anyone noticing. `retire` still sees the plan's pre-image, so the guard moved into
// its PRECONDITION, where it is strictly stronger: the old scan convicted an archive
// after the mistake had been preserved; the precondition prevents it.

describe('RETIREMENT INTEGRITY — a retired plan carries no unfinished shard', () => {
  it('REFUSES a terminal plan that still holds an open shard, naming them', () => {
    // Land it FIRST (all-completed at some commit is what `landing` reads), then
    // re-open a shard — the exact shape of the historical defect: a verdict recorded
    // in a report while the tree still carried unfinished work.
    placeTask('demo', 'completed', 't1-done.md');
    g('add', '-A');
    g('commit', '-qm', 'feat: demo lands');
    placeTask('demo', 'ready', 't2-orphan.md');
    g('add', '-A');
    g('commit', '-qm', 'chore: a shard re-opens after landing');
    expect(terminal(ctx, 'demo')).toBe(true);
    expect(() => retire(ctx, 'demo')).toThrow(/unfinished shard/);
    // The refusal NAMES them — a count alone leaves the operator hunting.
    expect(() => retire(ctx, 'demo')).toThrow(/ready\/t2-orphan\.md/);
    // And it did NOT delete: a refused precondition must leave the tree untouched.
    expect(existsSync(join(repo, 'plans', 'demo', 'PLAN.md'))).toBe(true);
  });

  it('EXONERATES a plan whose shards are all completed', () => {
    placeTask('demo', 'completed', 't1-done.md');
    g('add', '-A');
    g('commit', '-qm', 'feat: demo lands clean');
    expect(() => retire(ctx, 'demo')).not.toThrow();
    expect(existsSync(join(repo, 'plans', 'demo'))).toBe(false);
  });
});
