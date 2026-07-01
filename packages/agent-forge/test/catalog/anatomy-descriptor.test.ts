// The runtime organ-metadata descriptor (`ANATOMY`) is SINGLE-SOURCED against
// the per-organ `Fragment` TYPE aliases. The type-level guard lives in
// `anatomy-descriptor.test-d.ts` (each entry typed `MetaOf<TheAlias>`, so a
// wrong axis/kind/arity is a COMPILE error). This file is the RUNTIME guard:
// the keyset is EXACTLY the 24 organ literals — no missing organ, no extra key,
// no drift between the descriptor and the corpus's actual organ dirs.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANATOMY, ORGAN_NAMES, type Organ } from '../../src/anatomy/index.js';

// The 24 organ literals, copied here as the INDEPENDENT oracle (this list is
// authored from the `Organ` union in the anatomy doc; if the union grows/shrinks
// this test must be updated alongside `ANATOMY`, which is exactly the point —
// adding an organ forces touching its metadata AND this assertion together).
const THE_24: readonly Organ[] = [
  'autonomy',
  'persona',
  'role',
  'formality',
  'audience-adaptation',
  'transparency',
  'provenance',
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
  it('has exactly the 24 organs as keys (no missing, no extra)', () => {
    expect([...ORGAN_NAMES].sort()).toEqual([...THE_24].sort());
    expect(Object.keys(ANATOMY)).toHaveLength(24);
  });

  it('every axis/kind/arity is a legal value', () => {
    for (const organ of ORGAN_NAMES) {
      const m = ANATOMY[organ];
      expect(['STANCE', 'CONATUS']).toContain(m.axis);
      expect(['enum', 'open', 'coined']).toContain(m.kind);
      expect(['scalar', 'set']).toContain(m.arity);
    }
  });

  it('the five set organs are exactly the set-arity entries', () => {
    const setOrgans = ORGAN_NAMES.filter((o) => ANATOMY[o].arity === 'set');
    expect([...setOrgans].sort()).toEqual(
      [
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
    const dirs = readdirSync(anatomyOrgans, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    expect(dirs).toEqual([...ORGAN_NAMES].sort());
  });
});
