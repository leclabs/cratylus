// `enumerateCatalog` — the fragment discovery library. Proves, over the FIXTURE
// corpus: (1) it enumerates exactly the GIVEN catalog's dimensions, in that
// catalog's order, with the correct axis/kind/arity; (2) the contract shape per
// dimension; (3) values sort shortlex; (4) a body arrives verbatim — residue
// intact, and an enforcing value by its declaration face; (5) the DRIFT-PROOF
// property — a value module dropped under a dimension dir appears in the output
// with no other change.
//
// THE CORPUS UNDER SCAN IS FORGE'S OWN (`test/fixture-dimensions/`, filed against
// `test/fixture-anatomy.ts`). It deliberately does NOT read a sibling package's
// dirs, which this file used to do: forge ships no catalog and no dimension dirs,
// so WHICH dimensions exist and WHICH values fill them are a corpus's facts, and a
// sibling corpus discovering a dimension must never turn THIS suite red — that
// inversion is what forge exists to refuse, and `fb944d2` removed it from the type
// system only for the test layer to keep it alive. What is proven here is the law
// ANY corpus's enumeration obeys, which a fixture corpus demonstrates and a single
// real corpus's own suite cannot.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  type CatalogEntry,
  enumerateCatalog,
  shortlex,
} from '../../src/catalog/index.js';
import {
  FIXTURE_ANATOMY,
  FIXTURE_DIMENSION_NAMES,
} from '../fixture-anatomy.js';

const here = dirname(fileURLToPath(import.meta.url));
// agent-forge/test/catalog → up to test/ → the fixture corpus's dimension dirs.
const fixtureDimensions = join(here, '..', 'fixture-dimensions');

/**
 * The two shape invariants the corpus-scanning legs assert, as ONE predicate over
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

/** Descriptor drift: a dimension the catalog names that the catalog does not describe
 *  the same way (axis/kind/arity), or a dimension list that is not the manifest's. */
function metaDrift(entries: readonly CatalogEntry[]): string[] {
  return entries
    .filter((e) => {
      const meta = FIXTURE_ANATOMY[e.dimension as keyof typeof FIXTURE_ANATOMY];
      return (
        meta === undefined ||
        meta.axis !== e.axis ||
        meta.kind !== e.kind ||
        meta.arity !== e.arity
      );
    })
    .map((e) => `${e.dimension}: ${e.axis}/${e.kind}/${e.arity}`);
}

describe('enumerateCatalog over the fixture corpus', () => {
  let entries: CatalogEntry[];
  beforeAll(async () => {
    entries = await enumerateCatalog(fixtureDimensions, FIXTURE_ANATOMY);
  });

  it("enumerates exactly the catalog's dimensions, in the catalog's order", () => {
    expect(entries.map((e) => e.dimension)).toEqual([
      ...FIXTURE_DIMENSION_NAMES,
    ]);
    expect(entries).toHaveLength(22);
  });

  it("each dimension's axis/kind/arity matches the catalog", () => {
    expect(metaDrift(entries)).toEqual([]);
    expect(entries.length).toBeGreaterThan(0); // never a vacuous loop
  });

  it('the given catalog metadata reaches the entry, across all three kinds', () => {
    const byDimension = new Map(entries.map((e) => [e.dimension, e]));
    expect(byDimension.get('autonomy')).toMatchObject({
      kind: 'enum',
      arity: 'set',
    });
    expect(byDimension.get('guardrails')).toMatchObject({
      kind: 'coined',
      arity: 'set',
    });
    expect(byDimension.get('capabilities')).toMatchObject({
      kind: 'open',
      arity: 'set',
    });
    expect(byDimension.get('role')).toMatchObject({
      kind: 'open',
      arity: 'scalar',
    });
  });

  it('every value is a non-empty body string, shortlex-sorted (the contract shape)', () => {
    expect(shapeViolations(entries)).toEqual([]);
    // Non-vacuity of the SCAN: EVERY dimension genuinely carries values to check.
    // A count threshold would stay green while one dir went dark; this names the
    // dimensions that came back empty, so a scan that half-stopped is visible.
    expect(
      entries.filter((e) => e.values.length === 0).map((e) => e.dimension),
    ).toEqual([]);
    // …and the shortlex leg above has something to sort: `autonomy` holds two
    // values whose FILENAME order is the reverse of their shortlex order, so a
    // dropped sort changes the output rather than passing unobserved.
    expect(entries.find((e) => e.dimension === 'autonomy')?.values).toEqual([
      'mission-command',
      'fixture-standing ⟨a residue-bearing fixture value⟩',
    ]);
  });

  it('a body arrives VERBATIM — residue intact, never reduced to its anchor', () => {
    const autonomy = entries.find((e) => e.dimension === 'autonomy');
    // The whole σ* cell `⟨α, residue⟩`, not the anchor `fixture-standing`. Every
    // other fixture value has residue ∅, where α === body and the reduction hides.
    expect(autonomy?.values).toContain(
      'fixture-standing ⟨a residue-bearing fixture value⟩',
    );
    expect(autonomy?.values).not.toContain('fixture-standing');
  });

  it('an ENFORCING value enumerates by its declaration face (the silent-drop hazard)', () => {
    // The object-shaped member of `Value<O>`. A `typeof === 'string'` filter drops
    // it silently and the catalog merely reports one fewer value — an omission
    // that reads exactly like a smaller corpus. Its BODY must appear, and the
    // object itself must not.
    const guardrails = entries.find((e) => e.dimension === 'guardrails');
    expect(guardrails?.values).toContain(
      'fixture-enforcing ≜ a rule that carries its own enforcement',
    );
    expect(guardrails?.values.every((v) => typeof v === 'string')).toBe(true);
  });

  // ── The gate BITES — otherwise it is green whether the corpus is well-formed
  //    or `enumerateCatalog` quietly stopped enumerating ───────────────────────
  it('is non-vacuous — an unsorted, empty-bodied or metadata-drifted entry is CONVICTED', () => {
    const clean: CatalogEntry = {
      dimension: 'objective',
      ...FIXTURE_ANATOMY.objective,
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
    // BAD input 3: catalog metadata that drifted from the catalog.
    expect(metaDrift([{ ...clean, arity: 'set' }])).toEqual([
      'objective: Constitution/open/set',
    ]);
    expect(metaDrift([{ ...clean, dimension: 'telepathy' }])).toHaveLength(1);
  });

  it("the ORDER is the GIVEN catalog's — not a resident list, not the dir listing", async () => {
    // The order leg above compares against the same catalog the call was handed,
    // so it cannot distinguish "follows the argument" from "follows a list baked
    // into forge". A DIFFERENT catalog must produce a DIFFERENT order: these two
    // keys are declared `autonomy`-then-`memory` in the fixture catalog and sort
    // `autonomy`-then-`memory` alphabetically on disk, so only reading THIS
    // object's key order yields the reversal.
    const permuted = await enumerateCatalog(fixtureDimensions, {
      memory: FIXTURE_ANATOMY.memory,
      autonomy: FIXTURE_ANATOMY.autonomy,
    });
    expect(permuted.map((e) => e.dimension)).toEqual(['memory', 'autonomy']);
    // …and it enumerated ONLY what it was given: forge holds no dimension list.
    expect(permuted).toHaveLength(2);
    expect(permuted[0]?.values.length).toBeGreaterThan(0); // not an empty scan
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
    let entries = await enumerateCatalog(dir, FIXTURE_ANATOMY);
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
        "import type { Autonomy } from '@leclabs/agent-schema';",
        '',
        "export const fixtureMode: Autonomy = 'fixture-mode ≜ a discovered-only fixture value';",
        '',
      ].join('\n'),
    );

    // After: it shows up — discovered, not listed.
    entries = await enumerateCatalog(dir, FIXTURE_ANATOMY);
    const after = entries.find((e) => e.dimension === 'autonomy');
    expect(after?.values).toEqual([
      'fixture-mode ≜ a discovered-only fixture value',
    ]);
  });

  it('cleanup', () => {
    rmSync(dir, { recursive: true, force: true });
  });
});
