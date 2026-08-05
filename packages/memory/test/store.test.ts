import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseRecord, serializeRecord } from '../src/record.js';
import {
  DEFAULT_EPISODIC_PATH,
  type DeriveEnv,
  EpisodicStore,
  parseLines,
} from '../src/store.js';
import { monotonicFactory } from '../src/ulid.js';

let root: string;
let home: string;
let store: EpisodicStore;

/** Deterministic derive seam: fixed cwd/host/session. */
const derive: DeriveEnv = {
  cwd: () => '/work/project/sub',
  host: () => 'testhost',
  session: () => 'sess-1',
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'memory-store-'));
  home = join(root, '.claude/agents/mav');
  // Frozen clock + monotonic factory: deterministic, strictly-increasing ids.
  const mint = monotonicFactory(
    () => 0,
    () => 1_700_000_000_000,
  );
  store = new EpisodicStore({ home, ulid: mint, derive });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('encode — derived capture (SPEC D2)', () => {
  it('appends one open record {id, session, host, cwd, body} to the home log', () => {
    const rec = store.encode({ body: { note: 'first event' } });
    const file = store.rawFile();
    expect(file).toBe(join(home, DEFAULT_EPISODIC_PATH));

    const raw = readFileSync(file, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    const parsed = parseRecord(raw.trim());
    expect(parsed).toEqual(rec);
    expect(parsed.id).toHaveLength(26);
    // Derived by the TOOL, never caller-supplied:
    expect(parsed.cwd).toBe('/work/project/sub');
    expect(parsed.host).toBe('testhost');
    expect(parsed.session).toBe('sess-1');
    // Scope is NOT stored (it is node(cwd), computed at fold time); no
    // location-breaking fields either.
    expect(parsed).not.toHaveProperty('home');
    expect(parsed).not.toHaveProperty('fid');
  });

  it('omits session when the environment carries none', () => {
    const noSession = new EpisodicStore({
      home,
      derive: { ...derive, session: () => undefined },
    });
    const rec = noSession.encode({ body: 1 });
    expect(rec).not.toHaveProperty('session');
    expect(rec.host).toBe('testhost');
  });

  it('is append-only: multiple encodes accumulate, ids sort lexicographically by mint order', () => {
    const bodies = ['a', 'b', 'c', 'd'];
    const written = bodies.map((b) => store.encode({ body: b }));
    const lines = parseLines(readFileSync(store.rawFile(), 'utf8'));
    expect(lines).toEqual(written);

    const ids = lines.map((r) => r.id);
    expect([...ids].sort()).toEqual(ids); // lexicographic == append order
  });

  it('tags refine, never route: stored verbatim, omitted when empty', () => {
    const tagged = store.encode({ body: 1, tags: ['scoped-memory-v2', 'x'] });
    expect(tagged.tags).toEqual(['scoped-memory-v2', 'x']);
    const untagged = store.encode({ body: 2, tags: [] });
    expect(untagged).not.toHaveProperty('tags');
  });

  it('raw capture is single-store: encode lands in the agent HOME, never under the record cwd', () => {
    const rec = store.encode({ body: { note: 'project-true event' } });
    expect(rec.cwd).toBe('/work/project/sub');
    expect(store.rawFile()).toBe(join(home, DEFAULT_EPISODIC_PATH));
    expect(readFileSync(store.rawFile(), 'utf8').trim()).toBe(
      serializeRecord(rec),
    );
    // Structural guarantee: nothing exists at the recorded cwd's tree.
    expect(existsSync(join(root, 'work'))).toBe(false);
  });

  it('keeps body open — accepts arbitrary JSON without forcing a kind', () => {
    const rec = store.encode({
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

  it('rejects an absolute or escaping raw-log path (capture never leaves the home)', () => {
    expect(() => store.rawFile('/etc/evil.jsonl')).toThrow(/home-relative/);
    expect(() => store.rawFile('../outside.jsonl')).toThrow(/escape/);
  });
});

describe('read', () => {
  it('returns [] for a non-existent store', () => {
    expect(store.read()).toEqual([]);
  });

  it('reads v1-shaped records (scope/path present) as inert data', () => {
    const v1 = {
      id: '01BX5ZZKBKACTAV9WEVGEMMVRZ',
      scope: 'project:demo',
      body: 'legacy event',
    };
    const file = store.rawFile();
    rmSync(file, { force: true });
    store.encode({ body: 'v2 event' });
    const blob = `${JSON.stringify(v1)}\n${readFileSync(file, 'utf8')}`;
    const records = parseLines(blob);
    expect(records).toHaveLength(2);
    expect(records[0]?.scope).toBe('project:demo'); // readable...
    expect(records[0]?.cwd).toBeUndefined(); // ...and cwd-less (→ legacy bucket)
  });
});

describe('drain', () => {
  it('archives the raw log to .bak/ (verified), clears it, and rotates keep-N', () => {
    store.encode({ body: 'a' });
    store.encode({ body: 'b' });
    const bakDir = join(home, '.bak');

    const r1 = store.drain({ keep: 2 });
    expect(r1.records).toBe(2);
    expect(r1.archived).not.toBeNull();
    expect(existsSync(r1.archived as string)).toBe(true);
    // byte-faithful archive of the drained events
    expect(
      readFileSync(r1.archived as string, 'utf8')
        .trim()
        .split('\n'),
    ).toHaveLength(2);
    // raw log cleared, and the archive lives under .bak/, not as a sibling
    expect(store.read()).toHaveLength(0);
    expect((r1.archived as string).startsWith(bakDir)).toBe(true);

    // rotation: three more drains at keep=2 leave exactly 2 archives (the newest)
    for (const n of ['c', 'd', 'e']) {
      store.encode({ body: n });
      store.drain({ keep: 2 });
    }
    expect(readdirSync(bakDir)).toHaveLength(2);
  });

  it('is a no-op on an empty raw log', () => {
    const r = store.drain({ keep: 5 });
    expect(r.archived).toBeNull();
    expect(r.records).toBe(0);
  });
});
