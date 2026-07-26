// The runtime dimension-metadata descriptor (`ANATOMY`) is SINGLE-SOURCED against
// the per-dimension branded-string TYPE aliases. This file is the RUNTIME guard:
// the keyset is EXACTLY the 22 fragment-dimension literals — no missing dimension, no
// extra key, no drift between the descriptor and the corpus's actual dimension
// dirs (archetype/provenance keep their dirs for README-only docs, but carry no
// `.ts` value cells and are NOT `Dimension` fragment members — D13/D3).

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ANATOMY,
  DIMENSION_NAMES,
  type Dimension,
} from '../../src/anatomy/index.js';

// The 22 fragment-dimension literals, copied here as the INDEPENDENT oracle (this
// list is authored from the `Dimension` union in the anatomy doc; if the union
// grows/shrinks this test must be updated alongside `ANATOMY`, which is
// exactly the point — adding a dimension forces touching its metadata AND this
// assertion together). `archetype` and `provenance` are excluded: neither is a
// σ*-fragment dimension (archetype = plain string, provenance = structured `{mark}`).
const THE_22: readonly Dimension[] = [
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

describe('ANATOMY descriptor', () => {
  it('has exactly the 22 dimensions as keys (no missing, no extra)', () => {
    expect([...DIMENSION_NAMES].sort()).toEqual([...THE_22].sort());
    expect(Object.keys(ANATOMY)).toHaveLength(22);
  });

  it('every axis/kind/arity is a legal value', () => {
    for (const dimension of DIMENSION_NAMES) {
      expect(illegalMeta(ANATOMY[dimension]), dimension).toEqual([]);
    }
    expect(DIMENSION_NAMES.length).toBeGreaterThan(0); // never a vacuous loop
  });

  it('the six set dimensions are exactly the set-arity entries', () => {
    const setDimensions = DIMENSION_NAMES.filter(
      (o) => ANATOMY[o].arity === 'set',
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

  it('matches the actual dimension dirs in agent-canon (no descriptor↔corpus drift)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const anatomyDimensions = join(
      here,
      '..',
      '..',
      '..',
      'agent-canon',
      'src',
      'dimensions',
    );
    // archetype/ and provenance/ dirs still exist (README-only docs) but hold no
    // `.ts` value cells and are not `Dimension` fragment members — exclude them
    // from the descriptor↔corpus comparison.
    const dirs = readdirSync(anatomyDimensions, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => name !== 'archetype' && name !== 'provenance')
      .sort();
    expect(dirs.length).toBeGreaterThan(0); // a listing that read nothing is DARK
    expect(corpusDrift(dirs, DIMENSION_NAMES)).toEqual({
      missing: [],
      extra: [],
    });
  });

  // ── The gate BITES — otherwise it is green whether or not the two agree ──────
  it('is non-vacuous — a drifted corpus and an illegal descriptor entry are both CONVICTED', () => {
    // A corpus that lost a dimension dir and gained an unrecognized one: the two
    // failure modes the live comparison exists to catch, neither of which the
    // clean corpus can exhibit.
    const drifted = [...DIMENSION_NAMES]
      .filter((d) => d !== 'memory')
      .concat('telepathy')
      .sort();
    expect(corpusDrift(drifted, DIMENSION_NAMES)).toEqual({
      missing: ['memory'],
      extra: ['telepathy'],
    });
    // EXONERATES: the clean corpus is genuinely clean, not merely unexamined.
    expect(corpusDrift([...DIMENSION_NAMES], DIMENSION_NAMES)).toEqual({
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
