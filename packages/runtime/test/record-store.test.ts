// The record store, driven over temporary git repositories it builds itself: writes
// that must refuse, the fold's heads (settled, retracted, diverged, reconciled),
// incoherence over a supplied reference relation, a real branch merge, and a read
// that must leave the records root untouched.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { divergence, fold, incoherence } from '../src/record-store/fold.js';
import { RECORDS_ROOT, RecordStore } from '../src/record-store/store.js';

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
    ).toThrow(/version of entity/);
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

  it('a retraction leaves the entity with no head', () => {
    const store = new RecordStore(repository());
    const v1 = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = v1.envelope;
    const retraction = store.retract(DOMAIN, entity, BY);
    expect(retraction.envelope.supersedes).toEqual([v1.envelope.id]);
    expect(retraction.payload).toBeNull();
    const folded = fold(store.read(DOMAIN)).get(entity);
    expect(folded?.heads).toEqual([]);
    expect(folded?.payload).toBeUndefined();
    expect(() => store.retract(DOMAIN, entity, BY)).toThrow(/no head/);
  });

  it('two records superseding the same version read as divergence and the fold picks neither', () => {
    const store = new RecordStore(repository());
    const base = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = base.envelope;
    const left = store.supersede(
      DOMAIN,
      entity,
      [base.envelope.id],
      { name: 'l' },
      BY,
    );
    const right = store.supersede(
      DOMAIN,
      entity,
      [base.envelope.id],
      { name: 'r' },
      BY,
    );
    const folds = fold(store.read(DOMAIN));
    expect(folds.get(entity)?.heads).toEqual([left, right]);
    expect(folds.get(entity)?.payload).toBeUndefined();
    expect(divergence(folds).map((f) => f.entity)).toEqual([entity]);
  });

  it('a reconciliation leaves exactly one head, and its envelope marks it an amendment', () => {
    const store = new RecordStore(repository());
    const base = store.create(DOMAIN, { name: 'a' }, BY);
    const { entity } = base.envelope;
    expect(() => store.reconcile(DOMAIN, entity, { name: 'x' }, BY)).toThrow(
      /only divergence/,
    );
    const left = store.supersede(
      DOMAIN,
      entity,
      [base.envelope.id],
      { name: 'l' },
      BY,
    );
    const right = store.supersede(
      DOMAIN,
      entity,
      [base.envelope.id],
      { name: 'r' },
      BY,
    );
    const merged = store.reconcile(DOMAIN, entity, { name: 'lr' }, BY);
    expect(merged.envelope.operation).toBe('amend');
    expect([...merged.envelope.supersedes].sort()).toEqual(
      [left.envelope.id, right.envelope.id].sort(),
    );
    const folded = fold(store.read(DOMAIN)).get(entity);
    expect(folded?.heads).toEqual([merged]);
    expect(folded?.payload).toEqual({ name: 'lr' });
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
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'base');
    const dir = join(repo, RECORDS_ROOT, DOMAIN);
    const branch = (name: string, payload: { name: string }): string[] => {
      git(repo, 'checkout', '-q', '-b', name, 'main');
      store.supersede(DOMAIN, entity, [base.envelope.id], payload, BY);
      git(repo, 'add', '-A');
      git(repo, 'commit', '-q', '-m', name);
      return readdirSync(dir).sort();
    };
    const left = branch('left', { name: 'l' });
    const right = branch('right', { name: 'r' });
    const added = (files: string[]) =>
      files.filter((f) => f !== `${base.envelope.id}.json`);
    expect(added(left)).toHaveLength(1);
    expect(added(right)).toHaveLength(1);
    expect(added(left)).not.toEqual(added(right));

    git(repo, 'checkout', '-q', 'left');
    git(repo, 'merge', '-q', '--no-edit', 'right');
    expect(readdirSync(dir).sort()).toEqual(
      [...new Set([...left, ...right])].sort(),
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
    store.supersede(
      DOMAIN,
      base.envelope.entity,
      [base.envelope.id],
      { refs: [] },
      BY,
    );
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
