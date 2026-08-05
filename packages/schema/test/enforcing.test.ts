import { describe, expect, it } from 'vitest';
import {
  type Value,
  bodyOf,
  enforcing,
  isDimensionValue,
  withBody,
} from '../src/index.js';

type Guardrails = Value<'guardrails'>;

// `enforcing(f) ⇔ events(f) ≠ ∅` — MODEL's predicate, DERIVED and never stored.
// These are the runtime half of S1; the type-level half is canon's
// `anatomy.test-d.ts` NEGATIVE 7 (a value with `events` and no `substrate` must
// not compile).
//
// The SOUL-RENDERING half of this file went to the projector with `agentBody`
// (`forge/test/core/agent-body-enforcing.test.ts`). It asserted a projected
// body, which is projection; these assert the shape, which is schema.

const bare: Guardrails = 'honesty ≜ assert from evidence';
const bound: Guardrails = {
  body: 'stance ≜ hold the stance',
  substrate: 'harness',
  events: ['tool.use.pre'],
};

describe('enforcing — derived from the shape, never from a stored flag', () => {
  it('is false for a bare declaration and true for a bound one', () => {
    expect(enforcing(bare)).toBe(false);
    expect(enforcing(bound)).toBe(true);
  });

  it('reads the SAME body off either shape — the declaration face is uniform', () => {
    expect(bodyOf(bare)).toBe('honesty ≜ assert from evidence');
    expect(bodyOf(bound)).toBe('stance ≜ hold the stance');
  });

  it('has no boolean field to disagree with — the data IS the predicate', () => {
    // A stored `enforcing: false` alongside a non-empty `events` is the state
    // this shape makes unrepresentable. Assert the field simply does not exist.
    expect('enforcing' in (bound as object)).toBe(false);
  });
});

describe('withBody — folding a value must never silently UNBIND it', () => {
  it('substitutes the declaration and PRESERVES substrate + events', () => {
    const folded = withBody(bound, 'stance ≜ composed body');
    expect(bodyOf(folded)).toBe('stance ≜ composed body');
    expect(enforcing(folded)).toBe(true);
    // The binding is the half a string-only fold would have dropped.
    if (!enforcing(folded)) throw new Error('unreachable');
    expect(folded.substrate).toBe('harness');
    expect(folded.events).toEqual(['tool.use.pre']);
  });

  it('leaves a bare value bare — it does not manufacture a binding', () => {
    const folded = withBody(bare, 'honesty ≜ composed body');
    expect(folded).toBe('honesty ≜ composed body');
    expect(enforcing(folded)).toBe(false);
  });

  it('does not mutate the value it folds', () => {
    withBody(bound, 'mutated?');
    expect(bodyOf(bound)).toBe('stance ≜ hold the stance');
  });
});

describe('isDimensionValue — the guard against a SILENT catalog drop', () => {
  it('admits both shapes of value', () => {
    expect(isDimensionValue(bare)).toBe(true);
    expect(isDimensionValue(bound)).toBe(true);
  });

  it('rejects a non-value export, which is what the old string test was doing', () => {
    // The catalog scans whole modules, so "not a string" was double-duty for
    // "not a value". Replacing it with a truthy object check would admit these.
    expect(isDimensionValue({ id: 'a-hook-cell', workers: [] })).toBe(false);
    expect(isDimensionValue({})).toBe(false);
    expect(isDimensionValue(null)).toBe(false);
    expect(isDimensionValue(undefined)).toBe(false);
    expect(isDimensionValue(42)).toBe(false);
  });

  it('is SHAPE-checked: body and events must both be present and well-typed', () => {
    expect(isDimensionValue({ body: 'x', events: ['e'] })).toBe(true);
    expect(isDimensionValue({ body: 'x' })).toBe(false); // no events
    expect(isDimensionValue({ events: ['e'] })).toBe(false); // no body
    expect(isDimensionValue({ body: 1, events: ['e'] })).toBe(false); // body not prose
  });
});
