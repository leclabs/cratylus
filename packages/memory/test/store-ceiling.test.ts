import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORE_WATERMARK,
  auditHome,
  ceilingRefusal,
  refusesAppend,
  refusesReplace,
} from '../src/audit.js';
import { main } from '../src/cli.js';
import { applyRoutes } from '../src/dream.js';
import { EpisodicStore } from '../src/store.js';
import { AgentMemory } from '../src/strategy.js';

/**
 * The store ceiling (close-out SPEC §Decision 3b): the byte watermark stops
 * being an advisory report and becomes a refusal at BOTH prose-store write
 * paths — with an asymmetric predicate, because a symmetric one bricks any
 * store already over the line.
 *
 *   append  (dream.appendToHome)  accepts ⇔ after ≤ ceiling
 *   replace (cli.replaceGuarded)  accepts ⇔ after ≤ ceiling ∨ after < before
 *
 * Every size here is hermetic: a fixture built to the byte, never the
 * operator's live `~/.agents`. The live numbers appear only as SIZES, because
 * the calibration is what these tests pin.
 */

/** The live corpus bracket the ceiling was derived from (SPEC §3b(i)). */
const LIVE_BLOAT = 15_969; // nico/PROCEDURAL.md — the complained-about store
const LARGEST_CLEAN = 4_379; // mav/SEMANTIC.md — the largest uncomplained store
const CEILING = 8_000;

let root: string;
let home: string;
const origCwd = process.cwd();

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'memory-ceiling-')));
  home = join(root, 'agent-home');
  mkdirSync(home, { recursive: true });
  vi.stubEnv('AGENT_FACTORY_CONFIG', '');
  vi.stubEnv('AGENT_SESSION_ID', 'ceiling-test-sess');
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(root, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

/** A prose body of EXACTLY `n` bytes (ASCII + one trailing newline). */
const bodyOf = (n: number): string => `${'x'.repeat(n - 1)}\n`;

/** Seed a prose store at exactly `n` bytes on disk. */
const seedStore = (name: 'SEMANTIC' | 'PROCEDURAL', n: number): string => {
  const file = join(home, `${name}.md`);
  writeFileSync(file, bodyOf(n), 'utf8');
  expect(statSync(file).size).toBe(n);
  return file;
};

const sizeOf = (name: 'SEMANTIC' | 'PROCEDURAL'): number =>
  statSync(join(home, `${name}.md`)).size;

/** Encode one record and route `content` at `store` through `apply`. */
const applyContent = (store: 'SEMANTIC' | 'PROCEDURAL', content: string) => {
  const id = main(['encode', '--home', home, '--body', 'seed']).out.trim();
  const routes = JSON.stringify([{ id, targets: [{ store, content }] }]);
  return main(['apply', '--home', home, '--routes', routes]);
};

// ─── (0) the asymmetric predicate itself, exhaustively ──────────────────────

describe('the two predicates — the asymmetry, stated as a truth table', () => {
  it('the ceiling is the corpus-derived 8 000, not the never-fired 16 000', () => {
    expect(STORE_WATERMARK).toBe(CEILING);
    // The calibration in one assertion: it fires on the bloat, not on the
    // largest store nobody complained about.
    expect(refusesAppend(LIVE_BLOAT)).toBe(true);
    expect(refusesAppend(LARGEST_CLEAN)).toBe(false);
  });

  it.each([
    // [before, after, appendRefuses, replaceRefuses, why]
    [0, 100, false, false, 'a small first write'],
    [7_000, CEILING, false, false, 'landing EXACTLY on the ceiling'],
    [7_000, CEILING + 1, true, true, 'one byte over'],
    [0, CEILING + 1, true, true, 'over, with no prior store to shrink from'],
    [
      LIVE_BLOAT,
      LIVE_BLOAT + 1,
      true,
      true,
      'growing an already-over store — refused both ways',
    ],
    [
      LIVE_BLOAT,
      LIVE_BLOAT,
      true,
      true,
      'an EQUAL-size rewrite is not a shrink — refused',
    ],
    [
      LIVE_BLOAT,
      LIVE_BLOAT - 1,
      true,
      false,
      'THE ESCAPE: a one-byte strict shrink, still over — replace ONLY',
    ],
    [
      LIVE_BLOAT,
      CEILING + 1,
      true,
      false,
      'a big shrink that is still over — replace ONLY',
    ],
    // Past this line the shrink has landed at-or-under the ceiling, so BOTH
    // accept — append's predicate reads `after` alone and never `before`.
    [LIVE_BLOAT, CEILING, false, false, 'a shrink that lands ON the ceiling'],
    [LIVE_BLOAT, 10, false, false, 'a shrink all the way under'],
  ])(
    'before=%d after=%d ⇒ append refuses %s / replace refuses %s (%s)',
    (before, after, appendRefuses, replaceRefuses) => {
      expect(refusesAppend(after)).toBe(appendRefuses);
      expect(refusesReplace(before, after)).toBe(replaceRefuses);
    },
  );

  it('the two predicates agree EXCEPT on a strict shrink that is still over', () => {
    // Exhaustive over a small ceiling: the ONLY cells where they differ are
    // exactly {after > ceiling ∧ after < before} — the escape, and nothing else.
    const c = 20;
    const differ: Array<[number, number]> = [];
    for (let before = 0; before <= 40; before++)
      for (let after = 0; after <= 40; after++)
        if (refusesAppend(after, c) !== refusesReplace(before, after, c))
          differ.push([before, after]);
    expect(differ.length).toBeGreaterThan(0);
    for (const [before, after] of differ) {
      expect(after).toBeGreaterThan(c);
      expect(after).toBeLessThan(before);
    }
  });

  it('takes an injected ceiling, so no test mutates a global', () => {
    expect(refusesAppend(50, 100)).toBe(false);
    expect(refusesAppend(150, 100)).toBe(true);
    expect(refusesReplace(200, 150, 100)).toBe(false);
  });

  it('the refusal names the store, the ceiling, and the overage in bytes', () => {
    const msg = ceilingRefusal('/a/home/PROCEDURAL.md', 8_123, CEILING);
    expect(msg).toContain('PROCEDURAL.md');
    expect(msg).toContain('8123B');
    expect(msg).toContain('123B over');
    expect(msg).toContain('8000B');
    // …and the escape, so a reader of the refusal knows the store is not stuck.
    expect(msg).toMatch(/shrink/i);
  });
});

// ─── (1) the ceiling fires on the live bloat ────────────────────────────────

describe('the ceiling is calibrated to the live corpus, not above it', () => {
  it('reports pressure on a store the size of the live bloat (15 969 B)', () => {
    const file = seedStore('PROCEDURAL', LIVE_BLOAT);
    // The DEFAULT watermark — no injected override. The pre-state's 16 000 sat
    // 31 bytes above this store and reported it clean.
    const report = auditHome(home);
    expect(report.pressure).toEqual([
      { file, bytes: LIVE_BLOAT, watermark: CEILING },
    ]);
  });

  it('fires at ceiling+1 and stays silent at exactly the ceiling', () => {
    seedStore('PROCEDURAL', CEILING + 1);
    expect(auditHome(home).pressure).toHaveLength(1);

    rmSync(join(home, 'PROCEDURAL.md'));
    seedStore('PROCEDURAL', CEILING);
    expect(auditHome(home).pressure).toEqual([]);
  });

  it('leaves the largest uncomplained live store (4 379 B) clean', () => {
    seedStore('SEMANTIC', LARGEST_CLEAN);
    expect(auditHome(home).pressure).toEqual([]);
  });
});

// ─── (2) an append across the ceiling is refused, loudly ────────────────────

describe('append refuses at the ceiling — refuse, never truncate', () => {
  it('apply exits non-zero naming the store, the ceiling, and the overage', () => {
    seedStore('PROCEDURAL', 7_900);
    // 200 bytes of content + the separator newline ⇒ 8 101 B, 101 B over.
    const r = applyContent('PROCEDURAL', 'y'.repeat(200));
    expect(r.code).not.toBe(0);
    expect(r.err).toContain('PROCEDURAL.md');
    expect(r.err).toContain('8000');
    expect(r.err).toContain('101');
    // Refused, not truncated: the store is byte-for-byte what it was.
    expect(sizeOf('PROCEDURAL')).toBe(7_900);
  });

  it('accepts an append that lands EXACTLY on the ceiling (≤, not <)', () => {
    seedStore('SEMANTIC', 7_000);
    const r = applyContent('SEMANTIC', 'y'.repeat(999)); // +999 +\n ⇒ 8 000
    expect(r.code).toBe(0);
    expect(sizeOf('SEMANTIC')).toBe(CEILING);
  });

  it('refuses the append into an over-ceiling store (the frozen-to-shrink state)', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    const r = applyContent('PROCEDURAL', 'one more lesson');
    expect(r.code).not.toBe(0);
    expect(sizeOf('PROCEDURAL')).toBe(LIVE_BLOAT);
  });

  it('honours an injected watermark at the engine, no global mutation', () => {
    seedStore('SEMANTIC', 400);
    main(['encode', '--home', home, '--body', 'seed']);
    const store = new EpisodicStore({ home });
    const land = (watermark?: number) => () =>
      applyRoutes(
        store,
        undefined,
        () => ({ targets: [{ store: 'SEMANTIC', content: 'y'.repeat(200) }] }),
        watermark === undefined ? {} : { watermark },
      );
    expect(land(500)).toThrow(/601B/);
    expect(sizeOf('SEMANTIC')).toBe(400);
    // …and the same content lands fine under the default ceiling.
    expect(land()).not.toThrow();
  });

  it('rollover takes the same guard — one home, one guard', () => {
    seedStore('PROCEDURAL', 7_900);
    const id = main(['encode', '--home', home, '--body', 'seed']).out.trim();
    const routes = JSON.stringify([
      { id, targets: [{ store: 'PROCEDURAL', content: 'y'.repeat(200) }] },
    ]);
    const r = main(['rollover', '--home', home, '--routes', routes]);
    expect(r.code).not.toBe(0);
    expect(r.err).toContain('8000');
    expect(sizeOf('PROCEDURAL')).toBe(7_900);
  });
});

// ─── (3) THE ESCAPE: an over-ceiling store can still shrink ─────────────────

describe('strict-shrink escape — an over-ceiling store is never bricked', () => {
  it('replace SUCCEEDS on an over-ceiling store when the body is strictly smaller, even though the result is STILL over', () => {
    const file = seedStore('PROCEDURAL', LIVE_BLOAT);
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'PROCEDURAL',
      '--body',
      bodyOf(15_000),
    ]);
    expect(r.code).toBe(0);
    expect(statSync(file).size).toBe(15_000);
    // Still over the ceiling — the escape is about the DIRECTION, not the result.
    expect(auditHome(home).pressure).toHaveLength(1);
  });

  it('accepts a shrink of exactly one byte (the tightest strict shrink)', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'PROCEDURAL',
      '--body',
      bodyOf(LIVE_BLOAT - 1),
    ]);
    expect(r.code).toBe(0);
    expect(sizeOf('PROCEDURAL')).toBe(LIVE_BLOAT - 1);
  });

  it('converges across successive dreams — a gradient, not a cliff', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    for (const n of [12_000, 9_000, 7_500]) {
      const r = main([
        'replace',
        '--home',
        home,
        '--store',
        'PROCEDURAL',
        '--body',
        bodyOf(n),
      ]);
      expect(r.code).toBe(0);
      expect(sizeOf('PROCEDURAL')).toBe(n);
    }
    // Under the ceiling at last: appends work again, no migration ever ran.
    expect(auditHome(home).pressure).toEqual([]);
    expect(applyContent('PROCEDURAL', 'a fresh lesson').code).toBe(0);
  });
});

// ─── (4) a replace that GROWS an at/over-ceiling store is refused ────────────

describe('replace refuses growth at the ceiling', () => {
  it('refuses growing an at-ceiling store, same message shape as append', () => {
    seedStore('SEMANTIC', CEILING);
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'SEMANTIC',
      '--body',
      bodyOf(8_050),
    ]);
    expect(r.code).not.toBe(0);
    expect(r.err).toContain('SEMANTIC.md');
    expect(r.err).toContain('8000');
    expect(r.err).toContain('50');
    expect(sizeOf('SEMANTIC')).toBe(CEILING);
  });

  it('refuses an EQUAL-size replace of an over-ceiling store (shrink must be STRICT)', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'PROCEDURAL',
      '--body',
      `${'z'.repeat(LIVE_BLOAT - 1)}\n`,
    ]);
    expect(r.code).not.toBe(0);
    expect(sizeOf('PROCEDURAL')).toBe(LIVE_BLOAT);
  });

  it('refuses growing an already-over-ceiling store', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'PROCEDURAL',
      '--body',
      bodyOf(LIVE_BLOAT + 1),
    ]);
    expect(r.code).not.toBe(0);
    expect(sizeOf('PROCEDURAL')).toBe(LIVE_BLOAT);
  });

  it('refuses a first write over the ceiling — an absent store has no shrink escape', () => {
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'SEMANTIC',
      '--body',
      bodyOf(CEILING + 500),
    ]);
    expect(r.code).not.toBe(0);
    expect(r.err).toContain('500');
  });

  it('still accepts ordinary growth below the ceiling', () => {
    seedStore('SEMANTIC', 1_000);
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'SEMANTIC',
      '--body',
      bodyOf(7_999),
    ]);
    expect(r.code).toBe(0);
    expect(sizeOf('SEMANTIC')).toBe(7_999);
  });
});

// ─── (5) the existing consumer fires, unedited ──────────────────────────────

describe('consolidationOwed reads the pressure it already read', () => {
  it('is owed for an over-ceiling store with an empty backlog and a clean scan', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    expect(new AgentMemory({ home }).consolidationOwed()).toBe(true);
  });

  it('is NOT owed for a store under the ceiling', () => {
    seedStore('PROCEDURAL', LARGEST_CLEAN);
    expect(new AgentMemory({ home }).consolidationOwed()).toBe(false);
  });
});

// ─── (6) the PORT path takes the same ceiling as the CLI path ───────────────
//
// `AgentMemory.replace` is the `MemoryStrategy.replace` implementation — a SECOND
// write path into the same prose file, and it took no ceiling at all. M1 guarded
// `cli.replaceGuarded` and `dream.appendToHome`; a bound that binds only the entry
// point someone happened to exercise is not a bound. Latent, not live (nothing
// in-tree calls the port method today), which is exactly when it is cheapest to
// close and hardest to notice.

describe('AgentMemory.replace — the port path honours the ceiling', () => {
  it('CONVICTS: refuses an over-ceiling write that is not a strict shrink', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    const mem = new AgentMemory({ home });
    // Same size as what is already there: over the ceiling and not a shrink.
    expect(() => mem.replace('PROCEDURAL', 'x'.repeat(LIVE_BLOAT))).toThrow(
      /store ceiling/,
    );
    expect(sizeOf('PROCEDURAL')).toBe(LIVE_BLOAT);
  });

  it('EXONERATES: a strict shrink is allowed even while still over the ceiling', () => {
    seedStore('PROCEDURAL', LIVE_BLOAT);
    const mem = new AgentMemory({ home });
    // Still above 8 000 — the escape must not require reaching the ceiling in
    // one step, or an over-ceiling store can never be repaired incrementally.
    mem.replace('PROCEDURAL', 'x'.repeat(10_000));
    expect(sizeOf('PROCEDURAL')).toBe(10_001);
  });

  it('EXONERATES: an ordinary under-ceiling write is untouched', () => {
    const mem = new AgentMemory({ home });
    mem.replace('SEMANTIC', 'x'.repeat(100));
    expect(sizeOf('SEMANTIC')).toBe(101);
  });
});
