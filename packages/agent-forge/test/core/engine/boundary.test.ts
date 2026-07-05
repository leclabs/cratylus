// boundary-projection gate (E2). `realize : ActivationMode × harness-adapter →
// harness-mechanism` must COVER all five activation modes; `activation(class c)`
// must be total over the source cell classes. The claude adapter's mechanism map
// is the exhaustive-by-`Record`-type witness — this suite pins its five entries so
// a silent re-mapping is a test failure, not just a type change.

import { describe, expect, it } from 'vitest';
import { claudeMechanisms } from '../../../src/adapters/claude/index.js';
import {
  ACTIVATION_MODES,
  type ActivationMode,
  type CellClass,
  activationOf,
  realize,
} from '../../../src/core/engine/boundary.js';

describe('activation(class c) — the class→mode map', () => {
  const cases: ReadonlyArray<[CellClass, ActivationMode]> = [
    ['fragment', 'compose-only'],
    ['agent', 'identity'],
    ['rule', 'scope'],
    ['skill', 'trigger'],
    ['hook', 'event'],
  ];
  it.each(cases)('activation(%s) = %s', (cls, mode) => {
    expect(activationOf(cls)).toBe(mode);
  });

  it('the five classes cover the five modes bijectively', () => {
    const modes = cases.map(([, m]) => m);
    expect(new Set(modes)).toEqual(new Set(ACTIVATION_MODES));
    expect(modes.length).toBe(ACTIVATION_MODES.length);
  });
});

describe('realize(mode, claudeMechanisms) — all five modes witnessed', () => {
  it('every ActivationMode realizes to a mechanism (no unrealized mode)', () => {
    for (const mode of ACTIVATION_MODES) {
      const m = realize(mode, claudeMechanisms);
      expect(m.mode, mode).toBe(mode);
      expect(m.artifact.length, mode).toBeGreaterThan(0);
      expect(m.note.length, mode).toBeGreaterThan(0);
    }
  });

  it('compose-only → inlined into the SOUL (no standalone file)', () => {
    const m = realize('compose-only', claudeMechanisms);
    expect(m.injection).toBe('compose');
    expect(m.artifact).toBe('agents/<name>.md');
  });

  it('identity → the agent SOUL file', () => {
    const m = realize('identity', claudeMechanisms);
    expect(m.injection).toBe('file');
    expect(m.artifact).toBe('agents/<name>.md');
  });

  it('scope → a directory-scoped rule file', () => {
    const m = realize('scope', claudeMechanisms);
    expect(m.injection).toBe('file');
    expect(m.artifact).toBe('<dir>/AGENTS.md');
  });

  it('trigger → a skill directory led by SKILL.md', () => {
    const m = realize('trigger', claudeMechanisms);
    expect(m.injection).toBe('dir');
    expect(m.artifact).toBe('skills/<name>/SKILL.md');
  });

  it('event → merged into settings.json, workers under hooks/<id>/', () => {
    const m = realize('event', claudeMechanisms);
    expect(m.injection).toBe('merge');
    expect(m.artifact).toContain('settings.json');
    expect(m.artifact).toContain('hooks/<id>/');
  });

  it('the mechanism map keyset is EXACTLY the five modes', () => {
    expect(new Set(Object.keys(claudeMechanisms))).toEqual(
      new Set(ACTIVATION_MODES),
    );
  });
});
