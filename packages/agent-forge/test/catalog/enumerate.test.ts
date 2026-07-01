// `enumerateCatalog` — the organ-value discovery library. Proves: (1) it
// enumerates every one of the 24 organs from agent-anatomy's modules with the correct
// axis/kind/arity; (2) the contract shape per organ; (3) values sort shortlex;
// (4) the DRIFT-PROOF property — a value module dropped under an organ dir
// appears in the output with no other change.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { ANATOMY, ORGAN_NAMES } from '../../src/anatomy/index.js';
import {
  type CatalogEntry,
  enumerateCatalog,
  shortlex,
} from '../../src/catalog/index.js';

const here = dirname(fileURLToPath(import.meta.url));
// agent-forge/test/catalog → up to packages → agent-anatomy/src/organs.
const anatomyOrgans = join(
  here,
  '..',
  '..',
  '..',
  'agent-anatomy',
  'src',
  'organs',
);

describe('enumerateCatalog over agent-anatomy', () => {
  let entries: CatalogEntry[];
  beforeAll(async () => {
    entries = await enumerateCatalog(anatomyOrgans);
  });

  it('enumerates exactly the 24 organs, in anatomy order', () => {
    expect(entries.map((e) => e.organ)).toEqual([...ORGAN_NAMES]);
    expect(entries).toHaveLength(24);
  });

  it("each organ's axis/kind/arity matches ANATOMY", () => {
    for (const e of entries) {
      const meta = ANATOMY[e.organ];
      expect({ axis: e.axis, kind: e.kind, arity: e.arity }).toEqual(meta);
    }
  });

  it('the acceptance spot-checks hold', () => {
    const byOrgan = new Map(entries.map((e) => [e.organ, e]));

    const address = byOrgan.get('autonomy');
    expect(address).toMatchObject({ kind: 'enum', arity: 'scalar' });
    expect(address?.values.map((v) => v.slug)).toEqual([
      'human-in-the-loop',
      'human-on-the-loop',
      'human-out-of-the-loop',
    ]);

    expect(byOrgan.get('guardrails')).toMatchObject({
      kind: 'coined',
      arity: 'set',
    });
    expect(byOrgan.get('capabilities')).toMatchObject({
      kind: 'open',
      arity: 'set',
    });
  });

  it('every value is a {slug, definiens} pair (the contract shape)', () => {
    for (const e of entries) {
      for (const v of e.values) {
        expect(Object.keys(v).sort()).toEqual(['definiens', 'slug']);
        expect(typeof v.slug).toBe('string');
        expect(typeof v.definiens).toBe('string');
        expect(v.slug.length).toBeGreaterThan(0);
        expect(v.definiens.length).toBeGreaterThan(0);
      }
    }
  });

  it('values are sorted shortlex by slug', () => {
    for (const e of entries) {
      const slugs = e.values.map((v) => v.slug);
      const resorted = [...slugs].sort(shortlex);
      expect(slugs).toEqual(resorted);
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

  it('a value module dropped under an organ dir appears, no other change', async () => {
    const addressDir = join(dir, 'autonomy');
    mkdirSync(addressDir, { recursive: true });

    // Before: empty organ → zero values, organ still listed with its metadata.
    let entries = await enumerateCatalog(dir);
    const before = entries.find((e) => e.organ === 'autonomy');
    expect(before).toMatchObject({
      organ: 'autonomy',
      axis: 'STANCE',
      kind: 'enum',
      arity: 'scalar',
    });
    expect(before?.values).toEqual([]);

    // Drop ONE new value module — the ONLY change.
    writeFileSync(
      join(addressDir, 'fixture-mode.ts'),
      [
        "import type { Autonomy } from '@leclabs/agent-forge/anatomy';",
        '',
        'export const fixtureMode: Autonomy = {',
        "  organ: 'autonomy',",
        "  slug: 'fixture-mode',",
        "  definiens: 'a discovered-only fixture value',",
        '};',
        '',
      ].join('\n'),
    );

    // After: it shows up — discovered, not listed.
    entries = await enumerateCatalog(dir);
    const after = entries.find((e) => e.organ === 'autonomy');
    expect(after?.values).toEqual([
      { slug: 'fixture-mode', definiens: 'a discovered-only fixture value' },
    ]);
  });

  it('cleanup', () => {
    rmSync(dir, { recursive: true, force: true });
  });
});
