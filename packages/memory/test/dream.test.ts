import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyRoutes, compact } from '../src/dream.js';
import { parseRecord } from '../src/record.js';
import type { Classifier, RouteDecision } from '../src/route.js';
import {
  DEFAULT_EPISODIC_PATH,
  type DeriveEnv,
  EpisodicStore,
} from '../src/store.js';
import { monotonicFactory } from '../src/ulid.js';

let root: string;
let home: string;
let store: EpisodicStore;

const derive: DeriveEnv = {
  cwd: () => '/work/project',
  host: () => 'testhost',
  session: () => undefined,
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'dream-'));
  home = join(root, '.claude/agents/mav');
  const mint = monotonicFactory(
    () => 0,
    () => 1_700_000_000_000,
  );
  store = new EpisodicStore({ home, ulid: mint, derive });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Read the surviving EPISODIC records from the home-anchored raw log. */
function survivors(): ReturnType<typeof parseRecord>[] {
  return store.read();
}

/** Read a landed file's full text (empty string if absent). */
function textOf(file: string): string {
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

describe('applyRoutes — v2 store targets with a deterministic stub classifier', () => {
  it('routes to SEMANTIC/PROCEDURAL (home); split lands in ≥2; scaffold drops; next-step stays', () => {
    const kinds = [
      'identity', // → SEMANTIC
      'wisdom', // → PROCEDURAL
      'scaffold', // → drop
      'next-step', // → stays in EPISODIC
      'split', // → SEMANTIC + PROCEDURAL (two homes)
    ];
    const written = kinds.map((kind) =>
      store.encode({ body: { kind, text: `c-${kind}` } }),
    );
    const byKind = new Map(
      written.map((r) => [(r.body as { kind: string }).kind, r] as const),
    );
    /** The id of the record encoded for `kind` — loud if the fixture drifts. */
    const idOf = (kind: string): string => {
      const rec = byKind.get(kind);
      if (!rec) throw new Error(`fixture encoded no record of kind '${kind}'`);
      return rec.id;
    };

    const stub: Classifier = (rec) => {
      const { kind, text } = rec.body as { kind: string; text: string };
      const decisions: Record<string, RouteDecision> = {
        identity: { targets: [{ store: 'SEMANTIC', content: text }] },
        wisdom: { targets: [{ store: 'PROCEDURAL', content: text }] },
        scaffold: { targets: [] }, // drop
        'next-step': { targets: [{ store: 'EPISODIC' }] },
        split: {
          targets: [
            { store: 'SEMANTIC', content: `${text}-sem` },
            { store: 'PROCEDURAL', content: `${text}-proc` },
          ],
        },
      };
      return decisions[kind] ?? { targets: [] };
    };

    const result = applyRoutes(store, undefined, stub);

    // Each home received its content (all stores live in the agent home).
    expect(textOf(join(home, 'SEMANTIC.md'))).toContain('c-identity');
    expect(textOf(join(home, 'SEMANTIC.md'))).toContain('c-split-sem');
    expect(textOf(join(home, 'PROCEDURAL.md'))).toContain('c-wisdom');
    expect(textOf(join(home, 'PROCEDURAL.md'))).toContain('c-split-proc');

    // Consumed: identity, wisdom, scaffold(drop), split.
    expect(new Set(result.consumed)).toEqual(
      new Set([
        idOf('identity'),
        idOf('wisdom'),
        idOf('scaffold'),
        idOf('split'),
      ]),
    );
    // Retained: only the next-step.
    expect(result.retained).toEqual([idOf('next-step')]);

    // EPISODIC now holds exactly the next-step, stamped with its routes.
    const left = survivors();
    expect(left).toHaveLength(1);
    expect(left[0]?.id).toBe(idOf('next-step'));
    expect(left[0]?.routes).toEqual(['EPISODIC']);
  });

  it('REJECTS a route addressed to a retired v1 dimension name (SELF, MEMORY)', () => {
    store.encode({ body: 'x' });
    const v1Self: Classifier = () => ({
      // biome-ignore lint/suspicious/noExplicitAny: deliberately smuggling a retired dimension past the types (the classifier is untyped at runtime)
      targets: [{ store: 'SELF', content: 'who I am' } as any],
    });
    expect(() => applyRoutes(store, undefined, v1Self)).toThrow(
      /"SELF" is not a store.*retired/,
    );

    const v1Memory: Classifier = () => ({
      // biome-ignore lint/suspicious/noExplicitAny: same — the engine is the enforcement site
      targets: [{ store: 'MEMORY', content: 'what I know' } as any],
    });
    expect(() => applyRoutes(store, undefined, v1Memory)).toThrow(
      /"MEMORY" is not a store/,
    );

    // Enforcement precedes landing: nothing was consumed or written.
    expect(survivors()).toHaveLength(1);
    expect(existsSync(join(home, 'SELF.md'))).toBe(false);
    expect(existsSync(join(home, 'MEMORY.md'))).toBe(false);
  });

  it('rejects a non-EPISODIC target with no content', () => {
    store.encode({ body: 1 });
    const noContent: Classifier = () => ({
      targets: [{ store: 'SEMANTIC' }],
    });
    expect(() => applyRoutes(store, undefined, noContent)).toThrow(
      /no content/,
    );
  });

  it('scaffold (drop) lands nowhere: no store file is created for a dropped record', () => {
    store.encode({ body: { kind: 'scaffold' } });
    const stub: Classifier = () => ({ targets: [] });
    applyRoutes(store, undefined, stub);

    expect(survivors()).toHaveLength(0); // consumed
    // No stray store files written.
    expect(readdirSync(home)).toEqual([DEFAULT_EPISODIC_PATH]); // only the (now-empty) log
  });

  it('a retained record is stamped with all of its routes (split + EPISODIC)', () => {
    const rec = store.encode({ body: { kind: 'mixed' } });
    const stub: Classifier = () => ({
      targets: [
        { store: 'SEMANTIC', content: 'keep-and-note' },
        { store: 'EPISODIC' },
      ],
    });
    applyRoutes(store, undefined, stub);

    const left = survivors();
    expect(left).toHaveLength(1);
    expect(left[0]?.id).toBe(rec.id);
    expect(left[0]?.routes).toEqual(['SEMANTIC', 'EPISODIC']);
    expect(textOf(join(home, 'SEMANTIC.md'))).toContain('keep-and-note');
  });
});

describe('compact — atomic, idempotent, crash-safe', () => {
  it('removes exactly the consumed ids and preserves the rest, byte-verified', () => {
    const a = store.encode({ body: 'a' });
    const b = store.encode({ body: 'b' });
    const c = store.encode({ body: 'c' });

    const { removed, kept } = compact(store, undefined, [b.id]);
    expect(removed).toEqual([b.id]);
    expect(kept.map((r) => r.id)).toEqual([a.id, c.id]);

    // Byte-verify the rewritten file is exactly a + c lines, in order.
    const raw = readFileSync(store.rawFile(), 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => parseRecord(l).id)).toEqual([a.id, c.id]);
  });

  it('is idempotent: a second compaction of the same ids is a no-op, byte-identical', () => {
    store.encode({ body: 'a' });
    const b = store.encode({ body: 'b' });
    store.encode({ body: 'c' });

    compact(store, undefined, [b.id]);
    const after1 = readFileSync(store.rawFile(), 'utf8');
    const second = compact(store, undefined, [b.id]);
    const after2 = readFileSync(store.rawFile(), 'utf8');

    expect(second.removed).toEqual([]); // already gone
    expect(after2).toBe(after1); // byte-identical
  });

  it('consuming an absent id leaves the file byte-for-byte untouched', () => {
    store.encode({ body: 'a' });
    store.encode({ body: 'b' });
    const before = readFileSync(store.rawFile(), 'utf8');

    const res = compact(store, undefined, ['01BX5ZZKBKACTAV9WEVGEMMVRZ']);
    expect(res.removed).toEqual([]);
    expect(readFileSync(store.rawFile(), 'utf8')).toBe(before);
  });

  it('a non-existent store compacts to empty without error', () => {
    const res = compact(store, 'never-written.jsonl', ['anything']);
    expect(res).toEqual({ removed: [], kept: [] });
  });

  it('a simulated mid-compact failure (rename throws) loses NOTHING and cleans the tmp', () => {
    const a = store.encode({ body: 'a' });
    const b = store.encode({ body: 'b' });
    const c = store.encode({ body: 'c' });
    const file = store.rawFile();
    const before = readFileSync(file, 'utf8');

    // Crash exactly at the atomic publish point, via the injectable rename seam.
    const crash = () => {
      throw new Error('simulated crash during rename');
    };
    expect(() => compact(store, undefined, [b.id], { rename: crash })).toThrow(
      /simulated crash/,
    );

    // The original log is byte-identical — no unconsumed record lost.
    expect(readFileSync(file, 'utf8')).toBe(before);
    // All three records are still present and parseable.
    expect(survivors().map((r) => r.id)).toEqual([a.id, b.id, c.id]);
    // No orphan tmp file left behind.
    const orphans = readdirSync(home).filter((f) => f.includes('.tmp-'));
    expect(orphans).toEqual([]);

    // And a retry after the "crash" succeeds cleanly.
    const retry = compact(store, undefined, [b.id]);
    expect(retry.removed).toEqual([b.id]);
    expect(survivors().map((r) => r.id)).toEqual([a.id, c.id]);
  });

  it('stamps routes onto kept records in the same atomic rewrite', () => {
    const a = store.encode({ body: 'a' });
    const b = store.encode({ body: 'b' });
    const stamp = new Map([[a.id, ['SEMANTIC']]]);

    compact(store, undefined, [b.id], { stamp });
    const left = survivors();
    expect(left.map((r) => r.id)).toEqual([a.id]);
    expect(left[0]?.routes).toEqual(['SEMANTIC']);
  });
});

describe('applyRoutes — end-to-end idempotency over multiple cycles', () => {
  it('keeps SEMANTIC bounded: a re-run does not re-land consumed content', () => {
    store.encode({ body: { kind: 'knowledge', text: 'fact-1' } });
    const stub: Classifier = (rec) => {
      const { text } = rec.body as { text: string };
      return { targets: [{ store: 'SEMANTIC', content: text }] };
    };

    applyRoutes(store, undefined, stub);
    const semantic = join(home, 'SEMANTIC.md');
    const afterFirst = readFileSync(semantic, 'utf8');
    expect(afterFirst).toContain('fact-1');
    expect(survivors()).toHaveLength(0); // consumed, log drained

    // Second cycle: nothing left to route → SEMANTIC unchanged (no duplicate land).
    applyRoutes(store, undefined, stub);
    expect(readFileSync(semantic, 'utf8')).toBe(afterFirst);
  });
});
