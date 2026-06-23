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
import { applyRoutes, compact } from '../src/dream.js';
import { parseRecord } from '../src/record.js';
import { createHostEnv } from '../src/resolve.js';
import type { Classifier, RouteDecision } from '../src/route.js';
import { DEFAULT_EPISODIC_PATH, EpisodicStore } from '../src/store.js';
import { monotonicFactory } from '../src/ulid.js';

let home: string;
let store: EpisodicStore;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'dream-'));
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

/** Read the surviving EPISODIC records from the home-anchored raw log. */
function survivors(): ReturnType<typeof parseRecord>[] {
  return store.read();
}

/**
 * Read a routed organ home's full text (empty string if absent). These are
 * routed dream TARGETS (SELF.md/MEMORY.md/…), still resolved scope-aware via
 * `fileFor` — distinct from the home-anchored raw log read by {@link survivors}.
 */
function homeText(scopePath: string): string {
  const file = store.fileFor('user', scopePath);
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

describe('applyRoutes — mixed batch with a deterministic stub classifier', () => {
  it('routes each voice to its organ; a split lands in ≥2 homes; scaffold drops; next-step stays', () => {
    // One record per body.kind; the stub keys off body.kind (no LLM).
    const kinds = [
      'identity', // → SELF
      'knowledge', // → MEMORY
      'directive', // → AGENTS.md
      'reference', // → vault
      'scaffold', // → drop
      'next-step', // → stays in EPISODIC
      'split', // → SELF + MEMORY (two homes)
    ];
    const written = kinds.map((kind) =>
      store.encode({ scope: 'user', body: { kind, text: `c-${kind}` } }),
    );
    const byKind = Object.fromEntries(
      written.map((r) => [(r.body as { kind: string }).kind, r]),
    );

    const stub: Classifier = (rec) => {
      const { kind, text } = rec.body as { kind: string; text: string };
      const decisions: Record<string, RouteDecision> = {
        identity: {
          targets: [{ organ: 'SELF', path: 'SELF.md', content: text }],
        },
        knowledge: {
          targets: [{ organ: 'MEMORY', path: 'MEMORY.md', content: text }],
        },
        directive: {
          targets: [{ organ: 'AGENTS', path: 'AGENTS.md', content: text }],
        },
        reference: {
          targets: [{ organ: 'vault', path: 'vault/ref.md', content: text }],
        },
        scaffold: { targets: [] }, // drop
        'next-step': { targets: [{ organ: 'EPISODIC' }] },
        split: {
          targets: [
            { organ: 'SELF', path: 'SELF.md', content: `${text}-self` },
            { organ: 'MEMORY', path: 'MEMORY.md', content: `${text}-mem` },
          ],
        },
      };
      return decisions[kind] ?? { targets: [] };
    };

    const result = applyRoutes(store, undefined, stub);

    // Each organ received its content.
    expect(homeText('SELF.md')).toContain('c-identity');
    expect(homeText('SELF.md')).toContain('c-split-self'); // split landed here too
    expect(homeText('MEMORY.md')).toContain('c-knowledge');
    expect(homeText('MEMORY.md')).toContain('c-split-mem'); // ...and here
    expect(homeText('AGENTS.md')).toContain('c-directive');
    expect(homeText('vault/ref.md')).toContain('c-reference');

    // Consumed: identity, knowledge, directive, reference, scaffold(drop), split.
    expect(new Set(result.consumed)).toEqual(
      new Set([
        byKind.identity.id,
        byKind.knowledge.id,
        byKind.directive.id,
        byKind.reference.id,
        byKind.scaffold.id,
        byKind.split.id,
      ]),
    );
    // Retained: only the next-step.
    expect(result.retained).toEqual([byKind['next-step'].id]);

    // EPISODIC now holds exactly the next-step, stamped with its routes.
    const left = survivors();
    expect(left).toHaveLength(1);
    expect(left[0].id).toBe(byKind['next-step'].id);
    expect(left[0].routes).toEqual(['EPISODIC']);
  });

  it('scaffold (drop) lands nowhere: no organ file is created for a dropped record', () => {
    store.encode({ scope: 'user', body: { kind: 'scaffold' } });
    const stub: Classifier = () => ({ targets: [] });
    applyRoutes(store, undefined, stub);

    expect(survivors()).toHaveLength(0); // consumed
    // No stray organ files written.
    const homeDir = join(home, '.claude/agents/mav');
    const files = readdirSync(homeDir);
    expect(files).toEqual([DEFAULT_EPISODIC_PATH]); // only the (now-empty) log
  });

  it('a retained record is stamped with all of its routes (incl. split + EPISODIC)', () => {
    const rec = store.encode({ scope: 'user', body: { kind: 'mixed' } });
    const stub: Classifier = () => ({
      targets: [
        {
          organ: 'MEMORY',
          scope: 'user',
          path: 'MEMORY.md',
          content: 'keep-and-note',
        },
        { organ: 'EPISODIC' },
      ],
    });
    applyRoutes(store, undefined, stub);

    const left = survivors();
    expect(left).toHaveLength(1);
    expect(left[0].id).toBe(rec.id);
    expect(left[0].routes).toEqual(['MEMORY@user', 'EPISODIC']);
    expect(homeText('MEMORY.md')).toContain('keep-and-note');
  });

  it('rejects a non-EPISODIC target with no content, and one with no path', () => {
    store.encode({ scope: 'user', body: 1 });
    const noContent: Classifier = () => ({
      targets: [{ organ: 'SELF', path: 'SELF.md' }],
    });
    expect(() => applyRoutes(store, undefined, noContent)).toThrow(
      /no content/,
    );

    const noPath: Classifier = () => ({
      // @ts-expect-error deliberately omitting required path for a SELF target
      targets: [{ organ: 'SELF', content: 'x' }],
    });
    expect(() => applyRoutes(store, undefined, noPath)).toThrow(
      /scope-relative path/,
    );
  });
});

describe('compact — atomic, idempotent, crash-safe', () => {
  it('removes exactly the consumed ids and preserves the rest, byte-verified', () => {
    const a = store.encode({ scope: 'user', body: 'a' });
    const b = store.encode({ scope: 'user', body: 'b' });
    const c = store.encode({ scope: 'user', body: 'c' });

    const { removed, kept } = compact(store, undefined, [b.id]);
    expect(removed).toEqual([b.id]);
    expect(kept.map((r) => r.id)).toEqual([a.id, c.id]);

    // Byte-verify the rewritten file is exactly a + c lines, in order.
    const raw = readFileSync(store.rawFile(), 'utf8');
    const lines = raw.split('\n').filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
    expect(parseRecord(lines[0]).id).toBe(a.id);
    expect(parseRecord(lines[1]).id).toBe(c.id);
  });

  it('is idempotent: a second compaction of the same ids is a no-op, byte-identical', () => {
    store.encode({ scope: 'user', body: 'a' });
    const b = store.encode({ scope: 'user', body: 'b' });
    store.encode({ scope: 'user', body: 'c' });

    compact(store, undefined, [b.id]);
    const after1 = readFileSync(store.rawFile(), 'utf8');
    const second = compact(store, undefined, [b.id]);
    const after2 = readFileSync(store.rawFile(), 'utf8');

    expect(second.removed).toEqual([]); // already gone
    expect(after2).toBe(after1); // byte-identical
  });

  it('consuming an absent id leaves the file byte-for-byte untouched', () => {
    store.encode({ scope: 'user', body: 'a' });
    store.encode({ scope: 'user', body: 'b' });
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
    const a = store.encode({ scope: 'user', body: 'a' });
    const b = store.encode({ scope: 'user', body: 'b' });
    const c = store.encode({ scope: 'user', body: 'c' });
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
    const homeDir = join(home, '.claude/agents/mav');
    const orphans = readdirSync(homeDir).filter((f) => f.includes('.tmp-'));
    expect(orphans).toEqual([]);

    // And a retry after the "crash" succeeds cleanly.
    const retry = compact(store, undefined, [b.id]);
    expect(retry.removed).toEqual([b.id]);
    expect(survivors().map((r) => r.id)).toEqual([a.id, c.id]);
  });

  it('stamps routes onto kept records in the same atomic rewrite', () => {
    const a = store.encode({ scope: 'user', body: 'a' });
    const b = store.encode({ scope: 'user', body: 'b' });
    const stamp = new Map([[a.id, ['MEMORY@user']]]);

    compact(store, undefined, [b.id], { stamp });
    const left = survivors();
    expect(left.map((r) => r.id)).toEqual([a.id]);
    expect(left[0].routes).toEqual(['MEMORY@user']);
  });
});

describe('applyRoutes — end-to-end idempotency over multiple cycles', () => {
  it('keeps SELF/MEMORY bounded: a re-run does not re-land consumed content', () => {
    store.encode({
      scope: 'user',
      body: { kind: 'knowledge', text: 'fact-1' },
    });
    const stub: Classifier = (rec) => {
      const { text } = rec.body as { text: string };
      return {
        targets: [{ organ: 'MEMORY', path: 'MEMORY.md', content: text }],
      };
    };

    applyRoutes(store, undefined, stub);
    const afterFirst = homeText('MEMORY.md');
    expect(afterFirst).toContain('fact-1');
    expect(survivors()).toHaveLength(0); // consumed, log drained

    // Second cycle: nothing left to route → MEMORY unchanged (no duplicate land).
    applyRoutes(store, undefined, stub);
    expect(homeText('MEMORY.md')).toBe(afterFirst);
  });
});
