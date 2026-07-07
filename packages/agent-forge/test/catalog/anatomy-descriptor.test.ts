// The runtime organ-metadata descriptor (`ANATOMY`) is SINGLE-SOURCED against
// the per-organ branded-string TYPE aliases. This file is the RUNTIME guard:
// the keyset is EXACTLY the 22 fragment-organ literals — no missing organ, no
// extra key, no drift between the descriptor and the corpus's actual organ
// dirs (persona/provenance keep their dirs for README-only docs, but carry no
// `.ts` value cells and are NOT `Organ` fragment members — D13/D3).

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANATOMY, ORGAN_NAMES, type Organ } from '../../src/anatomy/index.js';

// The 22 fragment-organ literals, copied here as the INDEPENDENT oracle (this
// list is authored from the `Organ` union in the anatomy doc; if the union
// grows/shrinks this test must be updated alongside `ANATOMY`, which is
// exactly the point — adding an organ forces touching its metadata AND this
// assertion together). `persona` and `provenance` are excluded: neither is a
// σ*-fragment organ (persona = plain string, provenance = structured `{mark}`).
const THE_22: readonly Organ[] = [
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
  it('has exactly the 22 organs as keys (no missing, no extra)', () => {
    expect([...ORGAN_NAMES].sort()).toEqual([...THE_22].sort());
    expect(Object.keys(ANATOMY)).toHaveLength(22);
  });

  it('every axis/kind/arity is a legal value', () => {
    for (const organ of ORGAN_NAMES) {
      const m = ANATOMY[organ];
      expect(['STANCE', 'CONATUS']).toContain(m.axis);
      expect(['enum', 'open', 'coined']).toContain(m.kind);
      expect(['scalar', 'set']).toContain(m.arity);
    }
  });

  it('the six set organs are exactly the set-arity entries', () => {
    const setOrgans = ORGAN_NAMES.filter((o) => ANATOMY[o].arity === 'set');
    expect([...setOrgans].sort()).toEqual(
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

  it('matches the actual organ dirs in agent-anatomy (no descriptor↔corpus drift)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const anatomyOrgans = join(
      here,
      '..',
      '..',
      '..',
      'agent-anatomy',
      'src',
      'organs',
    );
    // persona/ and provenance/ dirs still exist (README-only docs) but hold no
    // `.ts` value cells and are not `Organ` fragment members — exclude them
    // from the descriptor↔corpus comparison.
    const dirs = readdirSync(anatomyOrgans, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => name !== 'persona' && name !== 'provenance')
      .sort();
    expect(dirs).toEqual([...ORGAN_NAMES].sort());
  });
});
