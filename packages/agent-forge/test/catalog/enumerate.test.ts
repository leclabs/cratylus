// `enumerateCatalog` — the fragment discovery library. Proves: (1) it
// enumerates every one of the 22 dimensions from agent-canon's modules with the correct
// axis/kind/arity; (2) the contract shape per dimension; (3) values sort shortlex;
// (4) the DRIFT-PROOF property — a value module dropped under a dimension dir
// appears in the output with no other change.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { ANATOMY, DIMENSION_NAMES } from '../../src/anatomy/index.js';
import {
  type CatalogEntry,
  enumerateCatalog,
  shortlex,
} from '../../src/catalog/index.js';

const here = dirname(fileURLToPath(import.meta.url));
// agent-forge/test/catalog → up to packages → agent-canon/src/dimensions.
const anatomyDimensions = join(
  here,
  '..',
  '..',
  '..',
  'agent-canon',
  'src',
  'dimensions',
);

/**
 * The two shape invariants the live-corpus legs assert, as ONE predicate over
 * catalog entries. Named rather than inlined so a synthetic BAD entry can be fed
 * to the same code: `enumerateCatalog` sorts its own output, so a check that only
 * ever sees that output is green whether the corpus is well-formed or the check
 * stopped looking.
 */
function shapeViolations(entries: readonly CatalogEntry[]): string[] {
  const bad: string[] = [];
  for (const e of entries) {
    for (const v of e.values)
      if (typeof v !== 'string' || v.length === 0)
        bad.push(`${e.dimension}: empty value body`);
    const resorted = [...e.values].sort(shortlex);
    if (e.values.some((v, i) => v !== resorted[i]))
      bad.push(`${e.dimension}: values not shortlex`);
  }
  return bad;
}

/** Descriptor drift: a dimension the catalog names that ANATOMY does not describe
 *  the same way (axis/kind/arity), or a dimension list that is not the anatomy's. */
function metaDrift(entries: readonly CatalogEntry[]): string[] {
  return entries
    .filter((e) => {
      const meta = ANATOMY[e.dimension];
      return (
        meta === undefined ||
        meta.axis !== e.axis ||
        meta.kind !== e.kind ||
        meta.arity !== e.arity
      );
    })
    .map((e) => `${e.dimension}: ${e.axis}/${e.kind}/${e.arity}`);
}

describe('enumerateCatalog over agent-canon', () => {
  let entries: CatalogEntry[];
  beforeAll(async () => {
    entries = await enumerateCatalog(anatomyDimensions);
  });

  it('enumerates exactly the 22 dimensions, in anatomy order', () => {
    expect(entries.map((e) => e.dimension)).toEqual([...DIMENSION_NAMES]);
    expect(entries).toHaveLength(22);
  });

  it("each dimension's axis/kind/arity matches ANATOMY", () => {
    expect(metaDrift(entries)).toEqual([]);
    expect(entries.length).toBeGreaterThan(0); // never a vacuous loop
  });

  it('the acceptance spot-checks hold', () => {
    const byDimension = new Map(entries.map((e) => [e.dimension, e]));

    // autonomy is now a SET dimension (per-agent composed standing, D5).
    const autonomy = byDimension.get('autonomy');
    expect(autonomy).toMatchObject({ kind: 'enum', arity: 'set' });
    // O-collapse reduced these to σ*: the loop-ladder anchors are bare (residue ∅),
    // human-out-of-the-loop carries a `⟨…⟩` residue. No `≜ hitl`-style prose remains.
    expect(autonomy?.values).toContain('human-in-the-loop');
    expect(
      autonomy?.values.some((v) => v.startsWith('human-on-the-loop')),
    ).toBe(true);
    expect(
      autonomy?.values.some((v) => v.startsWith('human-out-of-the-loop')),
    ).toBe(true);

    expect(byDimension.get('guardrails')).toMatchObject({
      kind: 'coined',
      arity: 'set',
    });
    expect(byDimension.get('capabilities')).toMatchObject({
      kind: 'open',
      arity: 'set',
    });
  });

  it('every value is a non-empty body string, shortlex-sorted (the contract shape)', () => {
    expect(shapeViolations(entries)).toEqual([]);
    // Non-vacuity of the SCAN: the corpus genuinely carries values to check.
    expect(entries.flatMap((e) => e.values).length).toBeGreaterThan(100);
  });

  // ── The gate BITES — otherwise it is green whether the corpus is well-formed
  //    or `enumerateCatalog` quietly stopped enumerating ───────────────────────
  it('is non-vacuous — an unsorted, empty-bodied or metadata-drifted entry is CONVICTED', () => {
    const clean: CatalogEntry = {
      dimension: 'objective',
      ...ANATOMY.objective,
      values: ['a', 'bb'],
    };
    expect(shapeViolations([clean])).toEqual([]);
    expect(metaDrift([clean])).toEqual([]);

    // BAD input 1: values out of shortlex order (the sort silently dropped).
    expect(shapeViolations([{ ...clean, values: ['bb', 'a'] }])).toEqual([
      'objective: values not shortlex',
    ]);
    // BAD input 2: an empty body — a value module that exported nothing usable.
    expect(shapeViolations([{ ...clean, values: [''] }])).toEqual([
      'objective: empty value body',
    ]);
    // BAD input 3: catalog metadata that drifted from ANATOMY.
    expect(metaDrift([{ ...clean, arity: 'set' }])).toEqual([
      'objective: Constitution/open/set',
    ]);
    expect(
      metaDrift([
        { ...clean, dimension: 'telepathy' as CatalogEntry['dimension'] },
      ]),
    ).toHaveLength(1);
  });
});

describe('shortlex order', () => {
  it('shorter strings precede longer ones; ties break lexicographically', () => {
    expect([...['bb', 'a', 'ab', 'aa']].sort(shortlex)).toEqual([
      'a',
      'aa',
      'ab',
      'bb',
    ]);
  });
});

describe('drift-proof discovery (the load-bearing property)', () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'agent-forge-catalog-'));
  });

  it('a value module dropped under a dimension dir appears, no other change', async () => {
    const addressDir = join(dir, 'autonomy');
    mkdirSync(addressDir, { recursive: true });

    // Before: empty dimension → zero values, dimension still listed with its metadata.
    let entries = await enumerateCatalog(dir);
    const before = entries.find((e) => e.dimension === 'autonomy');
    expect(before).toMatchObject({
      dimension: 'autonomy',
      axis: 'Persona',
      kind: 'enum',
      arity: 'set',
    });
    expect(before?.values).toEqual([]);

    // Drop ONE new value module — the ONLY change.
    writeFileSync(
      join(addressDir, 'fixture-mode.ts'),
      [
        "import type { Autonomy } from '@leclabs/agent-forge/anatomy';",
        '',
        "export const fixtureMode: Autonomy = 'fixture-mode ≜ a discovered-only fixture value';",
        '',
      ].join('\n'),
    );

    // After: it shows up — discovered, not listed.
    entries = await enumerateCatalog(dir);
    const after = entries.find((e) => e.dimension === 'autonomy');
    expect(after?.values).toEqual([
      'fixture-mode ≜ a discovered-only fixture value',
    ]);
  });

  it('cleanup', () => {
    rmSync(dir, { recursive: true, force: true });
  });
});
