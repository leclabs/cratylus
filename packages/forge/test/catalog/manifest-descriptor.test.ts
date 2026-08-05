// A dimension CATALOG is SINGLE-SOURCED against the per-dimension branded-string
// TYPE aliases it derives. This file is the RUNTIME guard over the FIXTURE
// corpus's catalog (`test/fixture-manifest.ts`): the keyset is exactly its 22
// fragment-dimension literals — no missing dimension, no extra key, no drift
// between the descriptor and the value dirs it files against
// (`test/fixture-dimensions/`).
//
// BOTH halves under test belong to the FIXTURE corpus. Forge ships no catalog and
// no dimension dirs — WHICH dimensions exist is a corpus's fact — so this suite is
// a corpus like any other and gates its OWN descriptor against its OWN value dirs.
// It deliberately does NOT read a sibling package's dirs: that would make a corpus
// discovering a dimension a red suite HERE, which is the inversion forge exists to
// refuse. What is proven is the SHAPE law ANY corpus's catalog owes — a law a
// fixture corpus demonstrates and a single real corpus's own suite cannot.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  FIXTURE_DIMENSION_NAMES,
  FIXTURE_MANIFEST,
  type FixtureDimension,
} from '../fixture-manifest.js';

// The 22 fragment-dimension literals, copied here as the INDEPENDENT oracle (this
// list is authored from the `Dimension` union in the manifest doc; if the union
// grows/shrinks this test must be updated alongside `MANIFEST`, which is
// exactly the point — adding a dimension forces touching its metadata AND this
// assertion together). `archetype` and `provenance` are excluded: neither is a
// σ*-fragment dimension (archetype = plain string, provenance = structured `{mark}`).
const THE_22: readonly FixtureDimension[] = [
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
  readonly axis: string;
  readonly kind: string;
  readonly arity: string;
}

/** The descriptor↔corpus comparison, as a function of the two sets, so a
 *  synthetic DRIFTED corpus can be handed to the same code the live leg runs. */
function corpusDrift(
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

/** The legality predicate over one descriptor entry. */
function illegalMeta(m: Meta): string[] {
  const bad: string[] = [];
  if (!['Persona', 'Constitution'].includes(m.axis)) bad.push(`axis=${m.axis}`);
  if (!['enum', 'open', 'coined'].includes(m.kind)) bad.push(`kind=${m.kind}`);
  if (!['scalar', 'set'].includes(m.arity)) bad.push(`arity=${m.arity}`);
  return bad;
}

describe('a dimension catalog', () => {
  it('has exactly the 22 dimensions as keys (no missing, no extra)', () => {
    expect([...FIXTURE_DIMENSION_NAMES].sort()).toEqual([...THE_22].sort());
    expect(Object.keys(FIXTURE_MANIFEST)).toHaveLength(22);
  });

  it('every axis/kind/arity is a legal value', () => {
    for (const dimension of FIXTURE_DIMENSION_NAMES) {
      expect(illegalMeta(FIXTURE_MANIFEST[dimension]), dimension).toEqual([]);
    }
    expect(FIXTURE_DIMENSION_NAMES.length).toBeGreaterThan(0); // never a vacuous loop
  });

  it('the six set dimensions are exactly the set-arity entries', () => {
    const setDimensions = FIXTURE_DIMENSION_NAMES.filter(
      (o: FixtureDimension) => FIXTURE_MANIFEST[o].arity === 'set',
    );
    expect([...setDimensions].sort()).toEqual(
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

  it("matches the fixture corpus's own dimension dirs (no descriptor↔corpus drift)", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const fixtureDimensions = join(here, '..', 'fixture-dimensions');
    const dirs = readdirSync(fixtureDimensions, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    expect(dirs.length).toBeGreaterThan(0); // a listing that read nothing is DARK
    expect(corpusDrift(dirs, FIXTURE_DIMENSION_NAMES)).toEqual({
      missing: [],
      extra: [],
    });
  });

  // ── The gate BITES — otherwise it is green whether or not the two agree ──────
  it('is non-vacuous — a drifted corpus and an illegal descriptor entry are both CONVICTED', () => {
    // A corpus that lost a dimension dir and gained an unrecognized one: the two
    // failure modes the live comparison exists to catch, neither of which the
    // clean corpus can exhibit.
    // `telepathy` is deliberately not a DimensionName — that is the whole point of
    // the fixture — so the array is widened to string rather than the literal union.
    const drifted: string[] = ([...FIXTURE_DIMENSION_NAMES] as string[])
      .filter((d) => d !== 'memory')
      .concat('telepathy')
      .sort();
    expect(corpusDrift(drifted, FIXTURE_DIMENSION_NAMES)).toEqual({
      missing: ['memory'],
      extra: ['telepathy'],
    });
    // EXONERATES: the clean corpus is genuinely clean, not merely unexamined.
    expect(
      corpusDrift([...FIXTURE_DIMENSION_NAMES], FIXTURE_DIMENSION_NAMES),
    ).toEqual({
      missing: [],
      extra: [],
    });

    // A descriptor entry outside the closed axis/kind/arity vocabularies.
    expect(
      illegalMeta({ axis: 'Persona', kind: 'freeform', arity: 'tuple' }),
    ).toEqual(['kind=freeform', 'arity=tuple']);
    expect(illegalMeta({ axis: 'Vibe', kind: 'enum', arity: 'set' })).toEqual([
      'axis=Vibe',
    ]);
    expect(
      illegalMeta({ axis: 'Constitution', kind: 'coined', arity: 'scalar' }),
    ).toEqual([]);
  });
});
