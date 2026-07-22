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
    for (const e of entries) {
      const meta = ANATOMY[e.dimension];
      expect({ axis: e.axis, kind: e.kind, arity: e.arity }).toEqual(meta);
    }
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

  it('every value is a non-empty body string (the contract shape)', () => {
    for (const e of entries) {
      for (const v of e.values) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('values are sorted shortlex', () => {
    for (const e of entries) {
      const resorted = [...e.values].sort(shortlex);
      expect(e.values).toEqual(resorted);
    }
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
