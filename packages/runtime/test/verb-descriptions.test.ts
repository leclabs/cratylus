// Every capability and verb carries the words its help prints, declared beside
// the verb: a capability a one-line summary, a verb a one-line purpose.

import { describe, expect, it } from 'vitest';
import { VERBS as MODEL } from '../src/capabilities/model/index.js';
import { VERBS as VERSION_SKEW } from '../src/capabilities/version-skew/index.js';
import { CAPABILITIES, CAPABILITY_SUMMARIES } from '../src/capability.js';
import type { Verbs } from '../src/verbs.js';

const SURFACES: Record<(typeof CAPABILITIES)[number], Verbs> = {
  model: MODEL,
  versionSkew: VERSION_SKEW,
};

/** A line of words: something is said, and all of it on one line. */
const LINE = /^\S[^\n\r]*\S$/;

/** What `verbs` of `capability` leave unsaid: each verb without a one-line
 *  purpose. */
function unsaid(capability: string, verbs: Verbs): string[] {
  return Object.entries(verbs)
    .filter(([, verb]) => !LINE.test(verb.purpose))
    .map(([name]) => `${capability} ${name}: purpose`);
}

describe('every capability and verb is described', () => {
  it('each capability has a one-line summary', () => {
    expect(Object.keys(CAPABILITY_SUMMARIES)).toEqual([...CAPABILITIES]);
    for (const capability of CAPABILITIES)
      expect(CAPABILITY_SUMMARIES[capability], capability).toMatch(LINE);
  });

  it.each(CAPABILITIES)(
    '%s: each verb has a one-line purpose',
    (capability) => {
      expect(
        Object.keys(SURFACES[capability]).length,
        `${capability} verbs`,
      ).toBeGreaterThan(0);
      expect(unsaid(capability, SURFACES[capability])).toEqual([]);
    },
  );

  it('FLAGS each verb left unsaid, and none that is said', () => {
    expect(
      unsaid('x', {
        ok: { purpose: 'Do a thing' },
        quiet: { purpose: '' },
        wrapped: { purpose: 'One\nand two' },
      }),
    ).toEqual(['x quiet: purpose', 'x wrapped: purpose']);
  });
});
