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
  actions: {
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
  modalities: { kind: 'set', slugs: ['text', 'image'] },
  model: { kind: 'scalar', slugs: ['claude'] },
  trigger: { kind: 'scalar', slugs: ['user-message'] },
  'output-format': { kind: 'scalar', slugs: ['natural-language'] },
  autonomy: { kind: 'scalar', slugs: ['human-on-the-loop'] },
  guardrails: {
    kind: 'set',
    slugs: ['harm-avoidance', 'honesty', 'helpfulness', 'input-untrusted'],
  },
  'reasoning-strategy': { kind: 'scalar', slugs: ['react'] },
  satisficing: { kind: 'scalar', slugs: ['satisfice'] },
  formality: { kind: 'scalar', slugs: ['neutral'] },
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
      ['Role', [frag('role', 'curate')]],
      ['Formality', [frag('formality', 'formal')]],
      ['Audience-Adaptation', [frag('audience-adaptation', 'convergence')]],
      ['Transparency', [frag('transparency', 'reasoning-trace')]],
      ['Autonomy', [frag('autonomy', 'human-on-the-loop')]],
      ['Provenance', [frag('provenance', 'nico-archetype-cyan')]],
      ['Objective', [frag('objective', 'parsimony')]],
      [
        'Engineering-Principles',
        [
          frag('engineering-principles', 'first-principles'),
          frag('engineering-principles', 'zero-trust'),
        ],
      ],
      [
        'Guardrails',
        [
          frag('guardrails', 'harm-avoidance'),
          frag('guardrails', 'honesty'),
          frag('guardrails', 'helpfulness'),
          frag('guardrails', 'input-untrusted'),
        ],
      ],
      [
        'Capabilities',
        [
          frag('capabilities', 'research-investigation'),
          frag('capabilities', 'system-design'),
        ],
      ],
      ['Learning', [frag('learning', 'correction-consolidation')]],
      ['Situation-Awareness', [frag('situation-awareness', 'projection')]],
      ['Actions', [frag('actions', 'file-ops'), frag('actions', 'delegation')]],
      ['Modalities', [frag('modalities', 'text')]],
      ['Model', [frag('model', 'claude')]],
      ['Memory', [frag('memory', 'long-term-memory')]],
      ['Trigger', [frag('trigger', 'user-message')]],
      ['Framing', [frag('framing', 'analytical')]],
      ['Reasoning-Strategy', [frag('reasoning-strategy', 'react')]],
      ['Satisficing', [frag('satisficing', 'satisfice')]],
      ['Output-Format', [frag('output-format', 'natural-language')]],
      [
        'Self-Evaluation',
        [frag('self-evaluation', 'acceptance-criteria-check')],
      ],
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
        'autonomy',
        'guardrails',
        'formality',
        'reasoning-strategy',
        'actions',
        'output-format',
        'trigger',
        'satisficing',
        'modalities',
        'model',
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
      'Autonomy',
      'Model',
      'Trigger',
      'Output-Format',
      'Reasoning-Strategy',
      'Satisficing',
    ]) {
      expect(titles).not.toContain(omitted);
    }
    // Set organs whose every member is harness-provided → emptied → dropped.
    for (const omitted of ['Actions', 'Modalities', 'Guardrails']) {
      expect(titles).not.toContain(omitted);
    }
  });

  it('emits nico distinctive delta (the organs with no reset / non-matching)', () => {
    const delta = subtractReset(nicoLikeResolved(), reset);
    const titles = delta.organs.map(([t]) => t);
    for (const present of [
      'Persona',
      'Role',
      'Formality', // formal != reset's neutral → KEPT
      'Audience-Adaptation',
      'Transparency',
      'Objective',
      'Engineering-Principles',
      'Capabilities',
      'Situation-Awareness',
      'Memory',
      'Framing',
      'Provenance',
      'Learning',
      'Self-Evaluation',
    ]) {
      expect(titles).toContain(present);
    }
  });

  it('keeps a SCALAR organ when its value differs from the reset', () => {
    // nico's comportment is `formal`; the harness reset is `neutral` → kept.
    const delta = subtractReset(nicoLikeResolved(), reset);
    const comport = delta.organs.find(([t]) => t === 'Formality');
    expect(comport?.[1][0]?.slug).toBe('formal');
  });

  it('emits the set-difference for a partially-provided SET organ', () => {
    const a = nicoLikeResolved();
    // Add a non-harness effector alongside the harness-provided ones.
    const organs = a.organs.map(([t, f]) =>
      t === 'Actions'
        ? ([t, [...f, frag('actions', 'physical-actuation')]] as const)
        : ([t, f] as const),
    );
    const delta = subtractReset({ ...a, organs }, reset);
    const eff = delta.organs.find(([t]) => t === 'Actions');
    expect(eff?.[1].map((x) => x.slug)).toEqual(['physical-actuation']);
  });

  it('projectAgentDelta omits the dropped organs in the rendered SOUL', () => {
    const md = projectAgentDelta(nicoLikeResolved(), reset);
    // Distinctive organ headings present.
    expect(md).toContain('## Persona');
    expect(md).toContain('## Role');
    expect(md).toContain('## Formality');
    // Harness-provided organ headings absent.
    expect(md).not.toContain('## Autonomy');
    expect(md).not.toContain('## Actions');
    expect(md).not.toContain('## Guardrails');
    expect(md).not.toContain('## Model');
    // No empty organ heading artifacts.
    expect(md).not.toMatch(/## \w[\w-]*\n+## /);
    // The genus block still frames the SOUL.
    expect(md).toContain('## Memory');
  });
});
