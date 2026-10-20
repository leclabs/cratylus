// A factor CATALOG is SINGLE-SOURCED against the per-factor branded-string
// TYPE aliases it derives. This file is the RUNTIME guard over the FIXTURE
// canon's catalog (`test/fixture-manifest.ts`): the keyset is exactly its 22
// factor literals — no missing factor, no extra key, no drift
// between the descriptor and the value dirs it files against
// (`test/fixture-factors/`).
//
// BOTH halves under test belong to the FIXTURE canon. Forge ships no catalog and
// no factor dirs — WHICH factors exist is a canon's fact — so this suite
// declares a canon like any other and gates its OWN descriptor against its OWN value dirs.
// It deliberately does NOT read a sibling package's dirs: that would make the canon
// discovering a factor a red suite HERE, which is the inversion forge exists to
// refuse. What is proven is the SHAPE law ANY canon's catalog owes — a law a
// fixture canon demonstrates and the real canon's own suite cannot.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  FIXTURE_FACTOR_NAMES,
  FIXTURE_MANIFEST,
  type FixtureFactor,
} from '../fixture-manifest.js';

// The 22 factor literals, copied here as the INDEPENDENT oracle (this
// list is authored from the `Factor` union in the manifest doc; if the union
// grows/shrinks this test must be updated alongside `MANIFEST`, which is
// exactly the point — adding a factor forces touching its metadata AND this
// assertion together). Name, description, mark and key are identity details, not
// factors, so none of them is a key.
const THE_22: readonly FixtureFactor[] = [
  'autonomy',
  'role',
  'formality',
  'audience-adaptation',
  'transparency',
  'objective',
  'guardrails',
  'engineering-principles',
  'heuristics',
  'capabilities',
  'learning',
  'situation-awareness',
  'actions',
  'modalities',
  'model',
  'memory',
  'trigger',
  'framing',
  'reasoning-strategy',
  'satisficing',
  'output-format',
  'self-evaluation',
];

/** Descriptor metadata as it arrives from a dir listing / a descriptor entry —
 *  the shapes the two checks below are fed, widened so a BAD one can be built. */
interface Meta {
  readonly group: string;
  readonly repertoire: string;
  readonly arity: string;
  readonly level: string | null;
  readonly projection: string;
  readonly slots?: readonly { readonly name: string }[];
}

/** The descriptor↔canon comparison, as a function of the two sets, so a
 *  synthetic DRIFTED canon can be handed to the same code the live leg runs. */
function canonDrift(
  dirs: readonly string[],
  declared: readonly string[],
): { missing: string[]; extra: string[] } {
  const onDisk = new Set(dirs);
  const inDescriptor = new Set(declared);
  return {
    missing: declared.filter((d) => !onDisk.has(d)).sort(),
    extra: dirs.filter((d) => !inDescriptor.has(d)).sort(),
  };
}

/** The legality predicate over one descriptor entry: a named group, the closed
 *  repertoire/arity/level/projection vocabularies, and slots exactly on a `slots`
 *  factor. */
function illegalMeta(m: Meta): string[] {
  const bad: string[] = [];
  if (m.group.trim() === '') bad.push('group=(empty)');
  if (!['latent', 'open', 'curated', 'fixed'].includes(m.repertoire))
    bad.push(`repertoire=${m.repertoire}`);
  if (!['scalar', 'set', 'slots', 'attribute'].includes(m.arity))
    bad.push(`arity=${m.arity}`);
  if (m.level !== null && !['advisory', 'firm', 'fixed'].includes(m.level))
    bad.push(`level=${m.level}`);
  if (!['text', 'binding'].includes(m.projection))
    bad.push(`projection=${m.projection}`);
  if ((m.arity === 'slots') !== (m.slots !== undefined && m.slots.length > 0))
    bad.push(`slots on arity=${m.arity}`);
  return bad;
}

describe('a factor catalog', () => {
  it('has exactly the 22 factors as keys (no missing, no extra)', () => {
    expect([...FIXTURE_FACTOR_NAMES].sort()).toEqual([...THE_22].sort());
    expect(Object.keys(FIXTURE_MANIFEST)).toHaveLength(22);
  });

  it('every group/repertoire/arity/level/projection is a legal value', () => {
    for (const factor of FIXTURE_FACTOR_NAMES) {
      expect(illegalMeta(FIXTURE_MANIFEST[factor]), factor).toEqual([]);
    }
    expect(FIXTURE_FACTOR_NAMES.length).toBeGreaterThan(0); // never a vacuous loop
  });

  it('the six set factors are exactly the set-arity entries', () => {
    const setFactors = FIXTURE_FACTOR_NAMES.filter(
      (o: FixtureFactor) => FIXTURE_MANIFEST[o].arity === 'set',
    );
    expect([...setFactors].sort()).toEqual(
      [
        'autonomy',
        'guardrails',
        'capabilities',
        'actions',
        'heuristics',
        'engineering-principles',
      ].sort(),
    );
  });

  it("matches the fixture canon's own factor dirs (no descriptor↔canon drift)", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const fixtureFactors = join(here, '..', 'fixture-factors');
    const dirs = readdirSync(fixtureFactors, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    expect(dirs.length).toBeGreaterThan(0); // a listing that read nothing is DARK
    expect(canonDrift(dirs, FIXTURE_FACTOR_NAMES)).toEqual({
      missing: [],
      extra: [],
    });
  });

  // ── The gate BITES — otherwise it is green whether or not the two agree ──────
  it('is non-vacuous — a drifted canon and an illegal descriptor entry are both CONVICTED', () => {
    // A canon that lost a factor dir and gained an unrecognized one: the two
    // failure modes the live comparison exists to catch, neither of which the
    // clean canon can exhibit.
    // `telepathy` is deliberately not a FactorName — that is the whole point of
    // the fixture — so the array is widened to string rather than the literal union.
    const drifted: string[] = ([...FIXTURE_FACTOR_NAMES] as string[])
      .filter((d) => d !== 'memory')
      .concat('telepathy')
      .sort();
    expect(canonDrift(drifted, FIXTURE_FACTOR_NAMES)).toEqual({
      missing: ['memory'],
      extra: ['telepathy'],
    });
    // EXONERATES: the clean canon is genuinely clean, not merely unexamined.
    expect(
      canonDrift([...FIXTURE_FACTOR_NAMES], FIXTURE_FACTOR_NAMES),
    ).toEqual({
      missing: [],
      extra: [],
    });

    // A descriptor entry outside the closed vocabularies.
    const legal = {
      group: 'Persona',
      repertoire: 'curated',
      arity: 'scalar',
      level: null,
      projection: 'text',
    };
    expect(
      illegalMeta({ ...legal, repertoire: 'freeform', arity: 'tuple' }),
    ).toEqual(['repertoire=freeform', 'arity=tuple']);
    expect(illegalMeta({ ...legal, group: '' })).toEqual(['group=(empty)']);
    expect(
      illegalMeta({ ...legal, level: 'strict', projection: 'hook' }),
    ).toEqual(['level=strict', 'projection=hook']);
    expect(illegalMeta({ ...legal, arity: 'slots' })).toEqual([
      'slots on arity=slots',
    ]);
    expect(illegalMeta({ ...legal, slots: [{ name: 'tier' }] })).toEqual([
      'slots on arity=scalar',
    ]);
    expect(illegalMeta(legal)).toEqual([]);
    expect(
      illegalMeta({ ...legal, arity: 'slots', slots: [{ name: 'tier' }] }),
    ).toEqual([]);
  });
});
