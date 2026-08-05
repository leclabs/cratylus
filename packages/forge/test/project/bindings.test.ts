import { describe, expect, it } from 'vitest';
import { bindingsOf } from '../../src/project/index.js';
import {
  FIXTURE_MANIFEST,
  type FixtureAgent,
  type FixtureValue,
} from '../fixture-manifest.js';

type Agent = FixtureAgent;
type Guardrails = FixtureValue<'guardrails'>;

// S2 — SCOPE IS DERIVED FROM COMPOSITION.
//
// The defect being removed is the fragile pointcut: scope authored inside the
// enforcement code, invisible from the agent it governs, going stale silently
// because "the non-advising of a join point does not manifest a syntax or type
// error." These tests assert the derivation, and — more importantly — its
// NEGATIVE half: an agent that does not compose the fragment is not governed.
// The negative is what proves scoping is real rather than universal.

const stance: Guardrails = {
  body: 'stance ≜ hold the stance',
  substrate: 'harness',
  events: ['tool.use.pre'],
};
const nudge: Guardrails = {
  body: 'nudge ≜ nudge the agent',
  substrate: 'harness',
  events: ['session.start'],
};
const bare: Guardrails = 'honesty ≜ assert from evidence';

const mk = (name: string, guardrails: readonly Guardrails[]): Agent =>
  ({ name, guardrails }) as unknown as Agent;

describe('bindingsOf — the binding is computed, never authored', () => {
  it('binds a fragment to EXACTLY the agents that compose it', () => {
    const bindings = bindingsOf(
      [
        { name: 'nico', agent: mk('nico', [stance, bare]) },
        { name: 'mav', agent: mk('mav', [stance]) },
        { name: 'tester', agent: mk('tester', [bare]) },
      ],
      FIXTURE_MANIFEST,
    );
    expect(bindings).toHaveLength(1);
    expect(bindings[0]?.anchor).toBe('stance');
    // POSITIVE: the two composers are bound...
    expect(bindings[0]?.agents).toEqual(['mav', 'nico']);
    // NEGATIVE: ...and the non-composer is NOT. This half is the proof.
    expect(bindings[0]?.agents).not.toContain('tester');
  });

  it('emits NOTHING for an agent set that composes no enforcing value', () => {
    // Not "an empty binding" — no binding at all. An empty scope asserting
    // "governs nobody" is indistinguishable from a derivation that never ran.
    expect(
      bindingsOf(
        [{ name: 'tester', agent: mk('tester', [bare]) }],
        FIXTURE_MANIFEST,
      ),
    ).toEqual([]);
  });

  it('a bare value never produces a binding — `events` is PARTIAL', () => {
    const bindings = bindingsOf(
      [{ name: 'nico', agent: mk('nico', [bare, stance]) }],
      FIXTURE_MANIFEST,
    );
    expect(bindings.map((b) => b.anchor)).toEqual(['stance']);
  });

  it('carries substrate and events through, so the refusal law can read them', () => {
    const [b] = bindingsOf(
      [{ name: 'nico', agent: mk('nico', [stance]) }],
      FIXTURE_MANIFEST,
    );
    expect(b?.fragment.substrate).toBe('harness');
    expect(b?.fragment.events).toEqual(['tool.use.pre']);
  });

  it('is byte-stable: anchors and agents both sorted regardless of input order', () => {
    const a = bindingsOf(
      [
        { name: 'nico', agent: mk('nico', [nudge, stance]) },
        { name: 'mav', agent: mk('mav', [stance, nudge]) },
      ],
      FIXTURE_MANIFEST,
    );
    const b = bindingsOf(
      [
        { name: 'mav', agent: mk('mav', [nudge, stance]) },
        { name: 'nico', agent: mk('nico', [stance, nudge]) },
      ],
      FIXTURE_MANIFEST,
    );
    expect(a.map((x) => x.anchor)).toEqual(['nudge', 'stance']);
    expect(a).toEqual(b);
  });

  it('scope FOLLOWS composition — removing the value unbinds the agent', () => {
    // The property the hand-written allowlist could not have: edit the agent,
    // and the scope moves with it. No second place to update.
    const before = bindingsOf(
      [
        { name: 'nico', agent: mk('nico', [stance]) },
        { name: 'mav', agent: mk('mav', [stance]) },
      ],
      FIXTURE_MANIFEST,
    );
    const after = bindingsOf(
      [
        { name: 'nico', agent: mk('nico', [stance]) },
        { name: 'mav', agent: mk('mav', [bare]) },
      ],
      FIXTURE_MANIFEST,
    );
    expect(before[0]?.agents).toEqual(['mav', 'nico']);
    expect(after[0]?.agents).toEqual(['nico']);
  });
});
