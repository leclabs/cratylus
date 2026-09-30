// The record store, driven over temporary git repositories it builds itself: writes
// that must refuse, the fold's heads (settled, withdrawn, reinstated, diverged,
// reconciled), incoherence over a supplied reference relation, real branch merges,
// and a read that must leave the records root untouched; writes held back until
// flushed. Then the two pure rules every domain writes through: the repair rule
// and canonical set order.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalOrder } from '../src/record-store/canonical-order.js';
import { divergence, fold, incoherence } from '../src/record-store/fold.js';
import type { Record } from '../src/record-store/record.js';
import { introduced } from '../src/record-store/repair.js';
import {
  RECORDS_ROOT,
  RecordStore,
  StagedStore,
} from '../src/record-store/store.js';

const DOMAIN = 'concept';
const BY = { author: 'test', reason: 'a fixture', cause: 'record-store.test' };

function git(cwd: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function repository(): string {
  const dir = mkdtempSync(join(tmpdir(), 'record-store-'));
  git(dir, 'init', '-q', '-b', 'main');
  return dir;
}

/**
 * Commit what `main` holds, then run `left` and `right` each on its own branch
 * forked from `main`, and merge `right` into `left`. Returns each branch's
 * domain directory listing before the merge.
 */
function mergeBranches(
  repo: string,
  left: () => void,
  right: () => void,
): { left: string[]; right: string[] } {
  const dir = join(repo, RECORDS_ROOT, DOMAIN);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'base');
  const on = (name: string, write: () => void): string[] => {
    git(repo, 'checkout', '-q', '-b', name, 'main');
    write();
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', name);
    return readdirSync(dir).sort();
  };
  const listed = { left: on('left', left), right: on('right', right) };
  git(repo, 'checkout', '-q', 'left');
  git(repo, 'merge', '-q', '--no-edit', 'right');
  return listed;
}

/** Every file under `dir` with its bytes, keyed by relative path. */
function snapshot(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (at: string): void => {
    for (const name of readdirSync(at)) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else out.set(relative(dir, path), readFileSync(path, 'base64'));
    }
  };
  walk(dir);
  return out;
}

const ids = (records: readonly Record<unknown>[]): string[] =>
  records.map((r) => r.envelope.id).sort();

describe('record store', () => {
  it('lays each record out as <repository root>/records/<domain>/<record id>.json', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const record = store.create(DOMAIN, { name: 'a' }, BY);
    const file = join(repo, RECORDS_ROOT, DOMAIN, `${record.envelope.id}.json`);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(record);
    expect(record.envelope.operation).toBe('create');
    expect(record.envelope.entity).not.toBe(record.envelope.id);
  });

  it('a write REFUSES an existing record id and leaves its file unchanged', () => {
    const store = new RecordStore(repository());
    const record = store.create(DOMAIN, { name: 'a' }, BY);
    const file = join(store.root, DOMAIN, `${record.envelope.id}.json`);
    const before = readFileSync(file, 'utf8');
    expect(() => store.write(DOMAIN, record)).toThrow(/never rewritten/);
    expect(() =>
      store.write(DOMAIN, { ...record, payload: { name: 'edited' } }),
    ).toThrow(/never rewritten/);
    expect(readFileSync(file, 'utf8')).toBe(before);
  });

  it("a supersession naming another entity's version REFUSES, as does an unknown id", () => {
    const store = new RecordStore(repository());
    const a = store.create(DOMAIN, { name: 'a' }, BY);
    const b = store.create(DOMAIN, { name: 'b' }, BY);
    expect(() =>
      store.supersede(
        DOMAIN,
        a.envelope.entity,
        [b.envelope.id],
        { name: 'a2' },
        BY,
      ),
    ).toThrow(/of entity/);
    expect(() =>
      store.supersede(
        DOMAIN,
        a.envelope.entity,
        ['01ZZZZZZZZZZZZZZZZZZZZZZZZ'],
        { name: 'a2' },
        BY,
      ),
    ).toThrow(/no record/);
    expect(store.read(DOMAIN)).toHaveLength(2);
  });

  it('superseding a non-head REFUSES, so one branch stays linear', () => {
    const store = new RecordStore(repository());
    const v1 = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = v1.envelope;
    store.supersede(DOMAIN, entity, [v1.envelope.id], { name: 'b' }, BY);
    expect(() =>
      store.supersede(DOMAIN, entity, [v1.envelope.id], { name: 'c' }, BY),
    ).toThrow(/not a head/);
    expect(() =>
      store.write(DOMAIN, {
        envelope: {
          ...v1.envelope,
          id: '01ZZZZZZZZZZZZZZZZZZZZZZZZ',
          operation: 'retract',
          supersedes: [v1.envelope.id],
        },
        payload: null,
      }),
    ).toThrow(/not a head/);
    expect(store.read(DOMAIN)).toHaveLength(2);
    expect(divergence(fold(store.read(DOMAIN)))).toEqual([]);
  });

  it('one head reads settled, and a supersession moves the head', () => {
    const store = new RecordStore(repository());
    const v1 = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = v1.envelope;
    expect(fold(store.read(DOMAIN)).get(entity)?.payload).toEqual({
      name: 'a',
    });
    const v2 = store.supersede(
      DOMAIN,
      entity,
      [v1.envelope.id],
      { name: 'b' },
      BY,
    );
    const folded = fold(store.read(DOMAIN)).get(entity);
    expect(folded?.heads).toEqual([v2]);
    expect(folded?.payload).toEqual({ name: 'b' });
    expect(divergence(fold(store.read(DOMAIN)))).toEqual([]);
  });

  it("a retraction becomes the entity's one head and withdraws it", () => {
    const store = new RecordStore(repository());
    const v1 = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = v1.envelope;
    const retraction = store.retract(DOMAIN, entity, BY);
    expect(retraction.envelope.supersedes).toEqual([v1.envelope.id]);
    expect(retraction.payload).toBeNull();
    const folded = fold(store.read(DOMAIN)).get(entity);
    expect(folded?.heads).toEqual([retraction]);
    expect(folded?.payload).toBeUndefined();
    expect(divergence(fold(store.read(DOMAIN)))).toEqual([]);
    expect(() => store.retract(DOMAIN, entity, BY)).toThrow(
      /withdraws nothing/,
    );
  });

  it('a retraction naming only a retraction REFUSES; naming a version head beside it settles as withdrawn', () => {
    const store = new RecordStore(repository());
    const v1 = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = v1.envelope;
    const retraction = store.retract(DOMAIN, entity, BY);
    expect(() =>
      store.write(DOMAIN, {
        envelope: {
          ...retraction.envelope,
          id: '01ZZZZZZZZZZZZZZZZZZZZZZZZ',
          supersedes: [retraction.envelope.id],
        },
        payload: null,
      }),
    ).toThrow(/no version/);
    expect(store.read(DOMAIN)).toHaveLength(2);

    const repo = repository();
    const merged = new RecordStore(repo);
    const base = merged.create(DOMAIN, { name: 'a' }, BY);
    mergeBranches(
      repo,
      () => merged.retract(DOMAIN, base.envelope.entity, BY),
      () =>
        merged.supersede(
          DOMAIN,
          base.envelope.entity,
          [base.envelope.id],
          { name: 'r' },
          BY,
        ),
    );
    const heads = fold(merged.read(DOMAIN)).get(base.envelope.entity)?.heads;
    const withdrawal = merged.retract(DOMAIN, base.envelope.entity, BY);
    expect(ids(heads ?? [])).toEqual(
      [...withdrawal.envelope.supersedes].sort(),
    );
    const folded = fold(merged.read(DOMAIN)).get(base.envelope.entity);
    expect(folded?.heads).toEqual([withdrawal]);
    expect(folded?.withdrawn).toBe(true);
  });

  it('retract then supersede on one branch reinstates the entity, naming the retraction', () => {
    const store = new RecordStore(repository());
    const v1 = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = v1.envelope;
    const retraction = store.retract(DOMAIN, entity, BY);
    const reinstated = store.supersede(
      DOMAIN,
      entity,
      [retraction.envelope.id],
      { name: 'back' },
      BY,
    );
    expect(reinstated.envelope.supersedes).toEqual([retraction.envelope.id]);
    const folded = fold(store.read(DOMAIN)).get(entity);
    expect(folded?.heads).toEqual([reinstated]);
    expect(folded?.payload).toEqual({ name: 'back' });
  });

  it('two versions superseding the same head on two branches read as divergence and the fold picks neither', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const base = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = base.envelope;
    const written: Record<unknown>[] = [];
    mergeBranches(
      repo,
      () => {
        written.push(
          store.supersede(
            DOMAIN,
            entity,
            [base.envelope.id],
            { name: 'l' },
            BY,
          ),
        );
      },
      () => {
        written.push(
          store.supersede(
            DOMAIN,
            entity,
            [base.envelope.id],
            { name: 'r' },
            BY,
          ),
        );
      },
    );
    const folds = fold(store.read(DOMAIN));
    expect(ids(folds.get(entity)?.heads ?? [])).toEqual(ids(written));
    expect(folds.get(entity)?.payload).toBeUndefined();
    expect(folds.get(entity)?.diverged).toBe(true);
    expect(divergence(folds).map((f) => f.entity)).toEqual([entity]);
  });

  it('identical concurrent versions merge to settled, and the next write names every converged head', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const base = store.create(DOMAIN, { name: 'a', state: 'x' }, BY);
    const { entity } = base.envelope;
    const written: Record<unknown>[] = [];
    mergeBranches(
      repo,
      () => {
        written.push(
          store.supersede(
            DOMAIN,
            entity,
            [base.envelope.id],
            { name: 'a', state: 'y' },
            BY,
          ),
        );
      },
      () => {
        written.push(
          store.supersede(
            DOMAIN,
            entity,
            [base.envelope.id],
            { state: 'y', name: 'a' },
            BY,
          ),
        );
      },
    );
    const folds = fold(store.read(DOMAIN));
    const folded = folds.get(entity);
    expect(ids(folded?.heads ?? [])).toEqual(ids(written));
    expect(folded?.diverged).toBe(false);
    expect(folded?.withdrawn).toBe(false);
    expect(folded?.payload).toEqual({ name: 'a', state: 'y' });
    expect(divergence(folds)).toEqual([]);

    expect(() => store.reconcile(DOMAIN, entity, { name: 'z' }, BY)).toThrow(
      /only divergence/,
    );
    const [first, second] = ids(written);
    expect(() =>
      store.supersede(DOMAIN, entity, [first as string], { name: 'z' }, BY),
    ).toThrow(/converged/);
    const next = store.supersede(
      DOMAIN,
      entity,
      [first as string, second as string],
      { name: 'z' },
      BY,
    );
    expect(fold(store.read(DOMAIN)).get(entity)?.heads).toEqual([next]);
  });

  it('two concurrent retractions converge to withdrawn', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const base = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = base.envelope;
    mergeBranches(
      repo,
      () => store.retract(DOMAIN, entity, BY),
      () => store.retract(DOMAIN, entity, BY),
    );
    const folds = fold(store.read(DOMAIN));
    expect(folds.get(entity)?.heads).toHaveLength(2);
    expect(folds.get(entity)?.withdrawn).toBe(true);
    expect(divergence(folds)).toEqual([]);
    expect(() => store.retract(DOMAIN, entity, BY)).toThrow(
      /withdraws nothing/,
    );
  });

  it('a concurrent retraction and supersession merge into divergence with two heads', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const base = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = base.envelope;
    const written: Record<unknown>[] = [];
    mergeBranches(
      repo,
      () => {
        written.push(store.retract(DOMAIN, entity, BY));
      },
      () => {
        written.push(
          store.supersede(
            DOMAIN,
            entity,
            [base.envelope.id],
            { name: 'r' },
            BY,
          ),
        );
      },
    );
    const folds = fold(store.read(DOMAIN));
    expect(ids(folds.get(entity)?.heads ?? [])).toEqual(ids(written));
    expect(folds.get(entity)?.payload).toBeUndefined();
    expect(divergence(folds).map((f) => f.entity)).toEqual([entity]);
  });

  it('a reconciliation naming both heads settles it, and its envelope marks it an amendment', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const base = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = base.envelope;
    expect(() => store.reconcile(DOMAIN, entity, { name: 'x' }, BY)).toThrow(
      /only divergence/,
    );
    const written: Record<unknown>[] = [];
    mergeBranches(
      repo,
      () => {
        written.push(store.retract(DOMAIN, entity, BY));
      },
      () => {
        written.push(
          store.supersede(
            DOMAIN,
            entity,
            [base.envelope.id],
            { name: 'r' },
            BY,
          ),
        );
      },
    );
    const merged = store.reconcile(DOMAIN, entity, { name: 'lr' }, BY);
    expect(merged.envelope.operation).toBe('amend');
    expect([...merged.envelope.supersedes].sort()).toEqual(ids(written));
    const folds = fold(store.read(DOMAIN));
    expect(folds.get(entity)?.heads).toEqual([merged]);
    expect(folds.get(entity)?.payload).toEqual({ name: 'lr' });
    expect(divergence(folds)).toEqual([]);
  });

  it('incoherence reports a reference to a retracted entity and a cycle in a supplied relation', () => {
    const store = new RecordStore(repository());
    type Node = { refs: string[] };
    const refs = (payload: Node): string[] => payload.refs;
    const target = store.create<Node>(DOMAIN, { refs: [] }, BY).envelope.entity;
    const holder = store.create<Node>(DOMAIN, { refs: [target] }, BY).envelope
      .entity;
    const x = store.create<Node>(DOMAIN, { refs: [] }, BY);
    const y = store.create<Node>(DOMAIN, { refs: [x.envelope.entity] }, BY);
    expect(incoherence(fold(store.read<Node>(DOMAIN)), refs)).toEqual([]);

    store.retract(DOMAIN, target, BY);
    store.supersede<Node>(
      DOMAIN,
      x.envelope.entity,
      [x.envelope.id],
      { refs: [y.envelope.entity] },
      BY,
    );
    expect(incoherence(fold(store.read<Node>(DOMAIN)), refs)).toEqual([
      { kind: 'retracted', entity: holder, reference: target },
      {
        kind: 'cycle',
        entities: [x.envelope.entity, y.envelope.entity].sort(),
      },
    ]);
  });

  it('two domain directories written independently (simulated branches) union with no file-name collision and fold to divergence', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const base = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = base.envelope;
    const listed = mergeBranches(
      repo,
      () =>
        store.supersede(DOMAIN, entity, [base.envelope.id], { name: 'l' }, BY),
      () =>
        store.supersede(DOMAIN, entity, [base.envelope.id], { name: 'r' }, BY),
    );
    const added = (files: string[]) =>
      files.filter((f) => f !== `${base.envelope.id}.json`);
    expect(added(listed.left)).toHaveLength(1);
    expect(added(listed.right)).toHaveLength(1);
    expect(added(listed.left)).not.toEqual(added(listed.right));
    expect(readdirSync(join(store.root, DOMAIN)).sort()).toEqual(
      [...new Set([...listed.left, ...listed.right])].sort(),
    );
    const folds = fold(store.read(DOMAIN));
    expect(folds.get(entity)?.heads).toHaveLength(2);
    expect(divergence(folds).map((f) => f.entity)).toEqual([entity]);
  });

  it('a read leaves the records root byte-identical', () => {
    const repo = repository();
    const store = new RecordStore(repo);
    const base = store.create(DOMAIN, { refs: [] as string[] }, BY);
    store.supersede(
      DOMAIN,
      base.envelope.entity,
      [base.envelope.id],
      { refs: [] },
      BY,
    );
    store.create(DOMAIN, { refs: [base.envelope.entity] }, BY);
    store.retract(
      'note',
      store.create('note', { refs: [] }, BY).envelope.entity,
      BY,
    );
    const before = snapshot(store.root);

    const folds = fold(store.read<{ refs: string[] }>(DOMAIN));
    divergence(folds);
    incoherence(folds, (p) => p.refs);
    fold(store.read('note'));
    store.read('never-written');

    expect(snapshot(store.root)).toEqual(before);
    expect(existsSync(join(store.root, 'never-written'))).toBe(false);
  });
});

describe('a staged store', () => {
  it('checks and reads its held writes, puts nothing on disk until flushed, then all of them', () => {
    const repo = repository();
    const staged = new StagedStore(repo);
    const first = staged.create(DOMAIN, { v: 1 }, BY);
    const next = staged.supersede(
      DOMAIN,
      first.envelope.entity,
      [first.envelope.id],
      { v: 2 },
      BY,
    );
    expect(staged.holding).toBe(true);
    expect(
      fold(staged.read(DOMAIN)).get(first.envelope.entity)?.payload,
    ).toEqual({ v: 2 });
    expect(() =>
      staged.supersede(
        DOMAIN,
        first.envelope.entity,
        [first.envelope.id],
        { v: 3 },
        BY,
      ),
    ).toThrow(/is not a head/);
    const disk = new RecordStore(repo);
    expect(disk.read(DOMAIN)).toEqual([]);
    staged.flush();
    expect(staged.holding).toBe(false);
    expect(disk.read(DOMAIN).map((r) => r.envelope.id)).toEqual([
      first.envelope.id,
      next.envelope.id,
    ]);
  });
});

describe('the repair rule', () => {
  const cycle = { kind: 'cycle', entities: ['a', 'b', 'c'] };

  it('a violation whose entities a standing one of the same kind already binds is not introduced', () => {
    expect(
      introduced([cycle], [{ kind: 'cycle', entities: ['a', 'b'] }]),
    ).toEqual([]);
    expect(introduced([cycle], [cycle])).toEqual([]);
  });

  it('the same entities under another kind are introduced', () => {
    const name = { kind: 'name', entities: ['a', 'b'] };
    expect(introduced([cycle], [name])).toEqual([name]);
  });

  it('a violation grown beyond its standing one is introduced', () => {
    const grown = { kind: 'cycle', entities: ['a', 'b', 'c', 'd'] };
    expect(introduced([cycle], [grown])).toEqual([grown]);
  });

  it('with no standing violations, every one is introduced, in the order given', () => {
    const after = [{ kind: 'name', entities: ['x', 'y'] }, cycle];
    expect(introduced([], after)).toEqual(after);
  });
});

describe('canonical order', () => {
  it("a set's canonical form is independent of its input order", () => {
    const members = ['01K2B', '01K2A', '01K2C'];
    expect(canonicalOrder(members)).toEqual(['01K2A', '01K2B', '01K2C']);
    expect(canonicalOrder([...members].reverse())).toEqual(
      canonicalOrder(members),
    );
    expect(members).toEqual(['01K2B', '01K2A', '01K2C']);
  });

  it("a duplicate is kept for the domain's set law to refuse, never absorbed", () => {
    expect(canonicalOrder(['01K2B', '01K2A', '01K2B'])).toEqual([
      '01K2A',
      '01K2B',
      '01K2B',
    ]);
  });
});

describe('record store — a plan’s line', () => {
  /** A repository with one commit. */
  function committed(): string {
    const repo = repository();
    git(repo, 'commit', '-q', '--allow-empty', '-m', 'root');
    return repo;
  }

  it('cut makes the branch plan/<plan> from this checkout’s HEAD in a worktree named after the main one, and a second cut finds it', () => {
    const repo = committed();
    const line = new RecordStore(repo).cut('p');
    expect(line.path).toBe(`${realpathSync(repo)}.plan-p`);
    expect(git(repo, 'rev-parse', 'plan/p')).toBe(
      git(repo, 'rev-parse', 'HEAD'),
    );
    expect(new RecordStore(repo).cut('p')).toEqual(line);
    expect(new RecordStore(line.path).lines).toEqual([line]);
  });

  it('reads are the union of this checkout and every line, a record held by two once; a write lands where flush is told, else here', () => {
    const repo = committed();
    const here = new RecordStore(repo).create(DOMAIN, { name: 'a' }, BY);
    const line = new RecordStore(repo).cut('p');
    const staged = new StagedStore(repo);
    const there = staged.create(DOMAIN, { name: 'b' }, BY);
    const beside = staged.create(DOMAIN, { name: 'c' }, BY);
    staged.flush((_, record) =>
      record.envelope.id === there.envelope.id ? line.path : undefined,
    );
    const dir = (top: string) => join(top, RECORDS_ROOT, DOMAIN);
    expect(readdirSync(dir(line.path))).toEqual([`${there.envelope.id}.json`]);
    expect(readdirSync(dir(repo)).sort()).toEqual(
      [here, beside].map((r) => `${r.envelope.id}.json`).sort(),
    );
    const fromLine = new RecordStore(line.path);
    const fromMain = new RecordStore(repo);
    expect(ids(fromMain.read(DOMAIN))).toEqual(ids([here, there, beside]));
    // The line reads what it holds and other lines hold, never a checkout's
    // own uncommitted records.
    expect(ids(fromLine.read(DOMAIN))).toEqual(ids([there]));
    // A record both hold reads once.
    new RecordStore(repo).copy(line, [
      { domain: DOMAIN, id: here.envelope.id },
    ]);
    expect(ids(new RecordStore(repo).read(DOMAIN))).toEqual(
      ids([here, there, beside]),
    );
  });

  it('a write checks against the union: it may supersede a head that lives on the line', () => {
    const repo = committed();
    const line = new RecordStore(repo).cut('p');
    const staged = new StagedStore(repo);
    const first = staged.create(DOMAIN, { name: 'a' }, BY);
    staged.flush(() => line.path);
    const store = new RecordStore(repo);
    const next = store.supersede(
      DOMAIN,
      first.envelope.entity,
      [first.envelope.id],
      { name: 'b' },
      BY,
    );
    expect(
      fold(store.read(DOMAIN)).get(first.envelope.entity)?.payload,
    ).toEqual({ name: 'b' });
    expect(
      existsSync(join(repo, RECORDS_ROOT, DOMAIN, `${next.envelope.id}.json`)),
    ).toBe(true);
  });

  it('a branch no worktree holds is read from what it commits, and cut refuses it, saying the line has no worktree', () => {
    const repo = committed();
    const line = new RecordStore(repo).cut('p');
    const written = new StagedStore(repo);
    const record = written.create(DOMAIN, { name: 'a' }, BY);
    written.flush(() => line.path);
    git(line.path, 'add', '-A');
    git(line.path, 'commit', '-q', '-m', 'the line');
    git(repo, 'worktree', 'remove', line.path);
    const store = new RecordStore(repo);
    expect(store.lines).toEqual([]);
    expect(ids(store.read(DOMAIN))).toEqual(ids([record]));
    expect(() => store.cut('p')).toThrow(
      'the line of plan p has no worktree, so nothing was written',
    );
    expect(store.line('p')).toEqual({
      branch: 'plan/p',
      exists: true,
      path: undefined,
    });
    expect(store.line('q')).toEqual({
      branch: 'plan/q',
      exists: false,
      path: undefined,
    });
  });
});
