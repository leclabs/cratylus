import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseRecord, serializeRecord } from '../src/record.js';
import { createHostEnv } from '../src/resolve.js';
import {
  DEFAULT_EPISODIC_PATH,
  EpisodicStore,
  groupByStore,
  parseLines,
  storeKey,
} from '../src/store.js';
import { monotonicFactory } from '../src/ulid.js';

let home: string;
let store: EpisodicStore;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'episodic-'));
  // Frozen clock + monotonic factory: deterministic, strictly-increasing ids.
  const mint = monotonicFactory(
    () => 0,
    () => 1_700_000_000_000,
  );
  store = new EpisodicStore({
    env: createHostEnv(join(home, '.claude/agents/mav'), {
      polis: join(home, 'workspaces/polis'),
    }),
    ulid: mint,
  });
});

afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

describe('encode', () => {
  it('appends a valid ULID-keyed JSONL line to the default store', () => {
    const rec = store.encode({ scope: 'user', body: { note: 'first event' } });
    const file = store.fileFor('user');
    expect(file).toBe(join(home, '.claude/agents/mav', DEFAULT_EPISODIC_PATH));

    const raw = readFileSync(file, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    const parsed = parseRecord(raw.trim());
    expect(parsed).toEqual(rec);
    expect(parsed.id).toHaveLength(26);
    expect(parsed).not.toHaveProperty('home');
    expect(parsed).not.toHaveProperty('fid');
  });

  it('is append-only: multiple encodes accumulate, ids sort lexicographically by mint order', () => {
    const bodies = ['a', 'b', 'c', 'd'];
    const written = bodies.map((b) => store.encode({ scope: 'user', body: b }));
    const lines = parseLines(readFileSync(store.fileFor('user'), 'utf8'));
    expect(lines).toEqual(written);

    const ids = lines.map((r) => r.id);
    expect([...ids].sort()).toEqual(ids); // lexicographic == append order
  });

  it('omits path when defaulted and preserves an explicit path', () => {
    const a = store.encode({ scope: 'user', body: 1 });
    expect(a).not.toHaveProperty('path');

    const b = store.encode({
      scope: 'project:polis',
      path: 'sub/EPISODIC.jsonl',
      body: 2,
    });
    expect(b.path).toBe('sub/EPISODIC.jsonl');
    expect(store.read('project:polis', 'sub/EPISODIC.jsonl')).toEqual([b]);
  });

  it('keeps body open — accepts arbitrary JSON without forcing a kind', () => {
    const rec = store.encode({
      scope: 'user',
      body: {
        decision: 'x',
        rationale: ['y', 'z'],
        n: 42,
        ok: true,
        nested: { deep: null },
      },
    });
    expect(serializeRecord(rec)).toContain('"body"');
    expect(rec).not.toHaveProperty('kind');
    expect(rec).not.toHaveProperty('routes');
  });
});

describe('read', () => {
  it('returns [] for a non-existent store', () => {
    expect(store.read('user')).toEqual([]);
  });
});

describe('groupByStore', () => {
  it('groups by (scope, path) and orders each group by ULID', () => {
    const u1 = store.encode({ scope: 'user', body: 1 });
    const p1 = store.encode({
      scope: 'project:polis',
      path: 'a.jsonl',
      body: 2,
    });
    const u2 = store.encode({ scope: 'user', body: 3 });

    const all = [u2, p1, u1]; // deliberately out of order
    const groups = groupByStore(all);
    expect(groups.get(storeKey('user'))).toEqual([u1, u2]); // sorted by id
    expect(groups.get(storeKey('project:polis', 'a.jsonl'))).toEqual([p1]);
  });

  it('reconciles an absent path with the explicit default path into one group', () => {
    const a = store.encode({ scope: 'user', body: 1 });
    const b = store.encode({
      scope: 'user',
      path: DEFAULT_EPISODIC_PATH,
      body: 2,
    });
    const groups = groupByStore([a, b]);
    expect(groups.size).toBe(1);
    expect(groups.get(storeKey('user'))).toEqual([a, b]);
  });
});
