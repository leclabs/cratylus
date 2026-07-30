import { describe, expect, it } from 'vitest';
import {
  type EmittedMechanism,
  type EnforcedObligation,
  UNIVERSAL_LEGS,
  enforced,
} from '../../src/validate/accept.js';

// ENFORCED — the seventh Universal leg. MODEL declares it; accept() did not
// implement it, so until now a cell could pass the gate while declaring a bound
// that projects to nothing. MODEL states the consequence itself: "a declared
// bound that projects to nothing is INDISTINGUISHABLE from an undeclared one."

const declared = (
  ...pairs: [string, string][]
): readonly EnforcedObligation[] =>
  pairs.map(([fragment, agent]) => ({ fragment, agent }));

const emitted = (
  ...triples: [string, string, boolean][]
): readonly EmittedMechanism[] =>
  triples.map(([fragment, agent, scoped]) => ({ fragment, agent, scoped }));

describe('ENFORCED is a registered Universal leg', () => {
  it('appears in UNIVERSAL_LEGS, which now carries all seven', () => {
    expect(UNIVERSAL_LEGS).toContain('ENFORCED');
    expect(UNIVERSAL_LEGS).toHaveLength(7);
  });

  it('sits between PARSIMONIOUS and REGENERABLE, as MODEL writes it', () => {
    expect([...UNIVERSAL_LEGS]).toEqual([
      'CANONICAL',
      'SIGNIFIED',
      'COLD-BLIND',
      'PARTITIONED',
      'PARSIMONIOUS',
      'ENFORCED',
      'REGENERABLE',
    ]);
  });
});

describe('ENFORCED convicts an UNPROJECTED bound', () => {
  it('fails when a declared obligation emitted no mechanism', () => {
    // The whole point: the source register says this agent is bound, and the
    // projection produced nothing. Indistinguishable from never declaring it.
    const v = enforced(declared(['stance', 'nico']), emitted());
    expect(v.pass).toBe(false);
    expect(v.leg).toBe('ENFORCED');
    expect(v.reason).toContain('unprojected(stance→nico)');
  });

  it('names the fragment AND the agent, so the reader need not search', () => {
    const v = enforced(
      declared(['stance', 'nico'], ['stance', 'mav']),
      emitted(['stance', 'nico', true]),
    );
    expect(v.pass).toBe(false);
    expect(v.reason).toContain('mav');
    expect(v.reason).not.toContain('unprojected(stance→nico)');
  });
});

describe('ENFORCED convicts an AMBIENT mechanism', () => {
  it('fails when the mechanism was emitted but is not scoped to the agent', () => {
    // MODEL writes `¬ ambient` into the clause precisely for this: a mechanism
    // that governs everyone, or narrows itself at runtime, has put the scope in
    // the enforcement code where the governed agent cannot see it.
    const v = enforced(
      declared(['stance', 'nico']),
      emitted(['stance', 'nico', false]),
    );
    expect(v.pass).toBe(false);
    expect(v.reason).toContain('ambient(stance→nico)');
  });

  it('distinguishes ambient from unprojected — they are different defects', () => {
    const v = enforced(
      declared(['stance', 'nico'], ['nudge', 'mav']),
      emitted(['stance', 'nico', false]),
    );
    expect(v.reason).toContain('ambient(stance→nico)');
    expect(v.reason).toContain('unprojected(nudge→mav)');
  });
});

describe('ENFORCED passes only when every declared bound actually projects', () => {
  it('passes when each obligation has a scoped mechanism', () => {
    const v = enforced(
      declared(['stance', 'nico'], ['stance', 'mav']),
      emitted(['stance', 'nico', true], ['stance', 'mav', true]),
    );
    expect(v.pass).toBe(true);
    expect(v.reason).toBe('');
  });

  it('is vacuously true when nothing is declared — and that is NOT a pass to lean on', () => {
    // An agent that declares no bound trivially satisfies ENFORCED. That is
    // correct, and it is exactly why the catch-all (arity(guardrails) ≠ null)
    // exists upstream: this leg cannot see a bound nobody wrote.
    expect(enforced([], []).pass).toBe(true);
  });

  it('ignores a mechanism emitted for an agent that declared nothing', () => {
    // Extra emission is not this leg's business — ENFORCED quantifies over
    // DECLARED obligations. Over-emission is a different defect with its own home.
    const v = enforced(
      declared(['stance', 'nico']),
      emitted(['stance', 'nico', true], ['stance', 'tester', true]),
    );
    expect(v.pass).toBe(true);
  });
});
