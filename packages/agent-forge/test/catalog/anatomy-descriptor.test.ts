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

describe('ANATOMY descriptor', () => {
  it('has exactly the 22 dimensions as keys (no missing, no extra)', () => {
    expect([...DIMENSION_NAMES].sort()).toEqual([...THE_22].sort());
    expect(Object.keys(ANATOMY)).toHaveLength(22);
  });

  it('every axis/kind/arity is a legal value', () => {
    for (const dimension of DIMENSION_NAMES) {
      const m = ANATOMY[dimension];
      expect(['Persona', 'Constitution']).toContain(m.axis);
      expect(['enum', 'open', 'coined']).toContain(m.kind);
      expect(['scalar', 'set']).toContain(m.arity);
    }
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

  it('matches the actual dimension dirs in agent-anatomy (no descriptor↔corpus drift)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const anatomyDimensions = join(
      here,
      '..',
      '..',
      '..',
      'agent-anatomy',
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
    expect(dirs).toEqual([...DIMENSION_NAMES].sort());
  });
});
