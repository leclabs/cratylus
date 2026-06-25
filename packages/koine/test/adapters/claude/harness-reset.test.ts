import { describe, expect, it } from 'vitest';
import {
  type HarnessReset,
  type ResolvedAgent,
  claudeHarnessReset,
  projectAgentDelta,
  subtractReset,
} from '../../../src/adapters/claude/index.js';
import type { Fragment } from '../../../src/anatomy/index.js';

// ── The conformance fixture (DECISION 2, ratified) ──────────────────────────
// The recorded bare-`/introspect` measurement of the claude harness. The
// declared `claudeHarnessReset` MUST equal this fixture; drift is a bug in the
// reset (the conformance law, `docs/baseline-delta-model.md`). Identity is by
// fragment slug; SET organs list the full provided set, SCALAR organs one slug.
const MEASURED_BARE_INTROSPECT: HarnessReset = {
  effectors: {
    kind: 'set',
    slugs: [
      'file-ops',
      'delegation',
      'code-execution',
      'communication',
      'retrieval',
      'tool-call',
    ],
  },
  sensors: { kind: 'set', slugs: ['text', 'image'] },
  substrate: { kind: 'scalar', slugs: ['claude'] },
  percept: { kind: 'scalar', slugs: ['user-message'] },
  enaction: { kind: 'scalar', slugs: ['natural-language'] },
  address: { kind: 'scalar', slugs: ['human-on-the-loop'] },
  charter: {
    kind: 'set',
    slugs: ['harm-avoidance', 'honesty', 'helpfulness', 'input-untrusted'],
  },
  deliberation: { kind: 'scalar', slugs: ['react'] },
  resolve: { kind: 'scalar', slugs: ['satisfice'] },
  comportment: { kind: 'scalar', slugs: ['neutral'] },
};

/** A minimal Fragment stub — only `organ`/`slug`/`definiens` are load-bearing. */
function frag(organ: string, slug: string): Fragment {
  return { organ, slug, definiens: `${slug} definiens` } as Fragment;
}

/**
 * A resolved-agent fixture mirroring nico's organ vector (`nicoResolved`): every
 * harness-provided organ matches the reset (so the delta path drops them) and the
 * distinctive organs (persona, mandate=curate, comportment=formal, …) remain.
 * We build it here rather than import from mind to keep the koine test self-
 * contained (koine does not depend on mind).
 */
function nicoLikeResolved(): ResolvedAgent {
  return {
    name: 'nico',
    description: 'the Sage archetype',
    sourcePath: 'packages/mind/agent/nico.md',
    memoryProtocol: 'protocol for {name}',
    organs: [
      ['Persona', [frag('persona', 'sage')]],
      ['Mandate', [frag('mandate', 'curate')]],
      ['Comportment', [frag('comportment', 'formal')]],
      ['Register-Fit', [frag('register-fit', 'convergence')]],
      ['Disclosure', [frag('disclosure', 'reasoning-trace')]],
      ['Address', [frag('address', 'human-on-the-loop')]],
      ['Provenance', [frag('provenance', 'nico-archetype-cyan')]],
      ['Telos', [frag('telos', 'parsimony')]],
      [
        'Instructions',
        [
          frag('instructions', 'first-principles'),
          frag('instructions', 'zero-trust'),
        ],
      ],
      [
        'Charter',
        [
          frag('charter', 'harm-avoidance'),
          frag('charter', 'honesty'),
          frag('charter', 'helpfulness'),
          frag('charter', 'input-untrusted'),
        ],
      ],
      [
        'Competence',
        [
          frag('competence', 'research-investigation'),
          frag('competence', 'system-design'),
        ],
      ],
      [
        'Disposition-Memory',
        [frag('disposition-memory', 'correction-consolidation')],
      ],
      ['Gestalt', [frag('gestalt', 'projection')]],
      [
        'Effectors',
        [frag('effectors', 'file-ops'), frag('effectors', 'delegation')],
      ],
      ['Sensors', [frag('sensors', 'text')]],
      ['Substrate', [frag('substrate', 'claude')]],
      ['Ledger', [frag('ledger', 'long-term-memory')]],
      ['Percept', [frag('percept', 'user-message')]],
      ['Construal', [frag('construal', 'analytical')]],
      ['Deliberation', [frag('deliberation', 'react')]],
      ['Resolve', [frag('resolve', 'satisfice')]],
      ['Enaction', [frag('enaction', 'natural-language')]],
      ['Appraisal', [frag('appraisal', 'acceptance-criteria-check')]],
    ],
  };
}

describe('claudeHarnessReset conformance', () => {
  it('declared reset == recorded bare-/introspect measurement', () => {
    expect(claudeHarnessReset).toEqual(MEASURED_BARE_INTROSPECT);
  });

  it('only the ratified organs carry a reset entry', () => {
    expect(Object.keys(claudeHarnessReset).sort()).toEqual(
      [
        'address',
        'charter',
        'comportment',
        'deliberation',
        'effectors',
        'enaction',
        'percept',
        'resolve',
        'sensors',
        'substrate',
      ].sort(),
    );
  });
});

describe('subtractReset / projectAgentDelta over a nico-like agent', () => {
  const reset = claudeHarnessReset;

  it('does not mutate the input agent', () => {
    const a = nicoLikeResolved();
    const before = a.organs.length;
    subtractReset(a, reset);
    expect(a.organs.length).toBe(before);
  });

  it('omits the harness-provided organs (all of nico match the reset)', () => {
    const delta = subtractReset(nicoLikeResolved(), reset);
    const titles = delta.organs.map(([t]) => t);
    // Scalar matches → organ omitted entirely.
    for (const omitted of [
      'Address',
      'Substrate',
      'Percept',
      'Enaction',
      'Deliberation',
      'Resolve',
    ]) {
      expect(titles).not.toContain(omitted);
    }
    // Set organs whose every member is harness-provided → emptied → dropped.
    for (const omitted of ['Effectors', 'Sensors', 'Charter']) {
      expect(titles).not.toContain(omitted);
    }
  });

  it('emits nico distinctive delta (the organs with no reset / non-matching)', () => {
    const delta = subtractReset(nicoLikeResolved(), reset);
    const titles = delta.organs.map(([t]) => t);
    for (const present of [
      'Persona',
      'Mandate',
      'Comportment', // formal != reset's neutral → KEPT
      'Register-Fit',
      'Disclosure',
      'Telos',
      'Instructions',
      'Competence',
      'Gestalt',
      'Ledger',
      'Construal',
      'Provenance',
      'Disposition-Memory',
      'Appraisal',
    ]) {
      expect(titles).toContain(present);
    }
  });

  it('keeps a SCALAR organ when its value differs from the reset', () => {
    // nico's comportment is `formal`; the harness reset is `neutral` → kept.
    const delta = subtractReset(nicoLikeResolved(), reset);
    const comport = delta.organs.find(([t]) => t === 'Comportment');
    expect(comport?.[1][0]?.slug).toBe('formal');
  });

  it('emits the set-difference for a partially-provided SET organ', () => {
    const a = nicoLikeResolved();
    // Add a non-harness effector alongside the harness-provided ones.
    const organs = a.organs.map(([t, f]) =>
      t === 'Effectors'
        ? ([t, [...f, frag('effectors', 'physical-actuation')]] as const)
        : ([t, f] as const),
    );
    const delta = subtractReset({ ...a, organs }, reset);
    const eff = delta.organs.find(([t]) => t === 'Effectors');
    expect(eff?.[1].map((x) => x.slug)).toEqual(['physical-actuation']);
  });

  it('projectAgentDelta omits the dropped organs in the rendered SOUL', () => {
    const md = projectAgentDelta(nicoLikeResolved(), reset);
    // Distinctive organ headings present.
    expect(md).toContain('## Persona');
    expect(md).toContain('## Mandate');
    expect(md).toContain('## Comportment');
    // Harness-provided organ headings absent.
    expect(md).not.toContain('## Address');
    expect(md).not.toContain('## Effectors');
    expect(md).not.toContain('## Charter');
    expect(md).not.toContain('## Substrate');
    // No empty organ heading artifacts.
    expect(md).not.toMatch(/## \w[\w-]*\n+## /);
    // The genus block still frames the SOUL.
    expect(md).toContain('## Memory');
  });
});
