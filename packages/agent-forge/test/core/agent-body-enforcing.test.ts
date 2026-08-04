// The PROJECTION half of what used to be `test/anatomy/enforcing.test.ts`. The
// predicate and the fold went to `@leclabs/agent-schema` with the shapes they are
// about; this half asserts a RENDERED BODY, which is the projector's concern and
// stays here.

import type { Value } from '@leclabs/agent-schema';
import { describe, expect, it } from 'vitest';
import { agentBody } from '../../src/core/anatomy-body.js';
import { FIXTURE_ANATOMY } from '../fixture-anatomy.js';

type Guardrails = Value<'guardrails'>;

const bare: Guardrails = 'honesty ≜ assert from evidence';
const bound: Guardrails = {
  body: 'stance ≜ hold the stance',
  substrate: 'harness',
  events: ['tool.use.pre'],
};

describe('SOUL rendering — an enforcing value renders its DECLARATION', () => {
  it('never leaks `[object Object]` into the projected body', () => {
    // The regression this guards: `agentBody` pushed `v as string`, and the cast
    // was the very thing hiding that a value may be an object. tsc could not see
    // it; only a rendered body can.
    const body = agentBody(
      {
        name: 'a',
        archetype: 'x',
        guardrails: [bound, bare],
      } as never,
      FIXTURE_ANATOMY,
    );
    expect(body).not.toContain('[object Object]');
    expect(body).toContain('stance ≜ hold the stance');
    expect(body).toContain('honesty ≜ assert from evidence');
    // The binding is NOT in the SOUL — it is where the rule binds, not what it says.
    expect(body).not.toContain('tool.use.pre');
    expect(body).not.toContain('harness');
  });
});
