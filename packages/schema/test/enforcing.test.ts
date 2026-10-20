import { describe, expect, it } from 'vitest';
import { type Value, bodyOf, enforcing, isFactorValue } from '../src/index.js';

type Guardrails = Value<'guardrails'>;

// `enforcing(f) ⇔ events(f) ≠ ∅` — DERIVED and never stored.
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

describe('isFactorValue — the guard against a SILENT catalog drop', () => {
  it('admits both shapes of value', () => {
    expect(isFactorValue(bare)).toBe(true);
    expect(isFactorValue(bound)).toBe(true);
  });

  it('rejects a non-value export, which is what the old string test was doing', () => {
    // The catalog scans whole modules, so "not a string" was double-duty for
    // "not a value". Replacing it with a truthy object check would admit these.
    expect(isFactorValue({ id: 'a-hook-declaration', workers: [] })).toBe(
      false,
    );
    expect(isFactorValue({})).toBe(false);
    expect(isFactorValue(null)).toBe(false);
    expect(isFactorValue(undefined)).toBe(false);
    expect(isFactorValue(42)).toBe(false);
  });

  it('is SHAPE-checked: body and events must both be present and well-typed', () => {
    expect(isFactorValue({ body: 'x', events: ['e'] })).toBe(true);
    expect(isFactorValue({ body: 'x' })).toBe(false); // no events
    expect(isFactorValue({ events: ['e'] })).toBe(false); // no body
    expect(isFactorValue({ body: 1, events: ['e'] })).toBe(false); // body not prose
  });
});
