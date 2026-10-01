// Every capability, verb and flag carries the words its help prints, declared
// beside the verb: a capability a one-line summary, a verb a one-line summary
// and the positional it acts on (or none), a flag a one-line description. A
// flag cannot be taken undescribed; the type rejects it, and the case at the
// end of this file fails `typecheck:test` if it ever compiles.

import { describe, expect, it } from 'vitest';
import { VERBS as DESIGN } from '../src/capabilities/design/dispatch.js';
import { VERBS as EVENT_TAP } from '../src/capabilities/event-tap/dispatch.js';
import { VERBS as NOTE } from '../src/capabilities/note/dispatch.js';
import { VERBS as PLAN } from '../src/capabilities/plan/dispatch.js';
import { CAPABILITIES, CAPABILITY_SUMMARIES } from '../src/capability.js';
import type { Verb, VerbFlags } from '../src/verb-flags.js';

const SURFACES: Record<(typeof CAPABILITIES)[number], VerbFlags> = {
  eventTap: EVENT_TAP,
  design: DESIGN,
  plan: PLAN,
  note: NOTE,
};

/** A line of words: something is said, and all of it on one line. */
const LINE = /^\S[^\n\r]*\S$/;

describe('every capability, verb and flag is described', () => {
  it('each capability has a one-line summary', () => {
    expect(Object.keys(CAPABILITY_SUMMARIES)).toEqual([...CAPABILITIES]);
    for (const capability of CAPABILITIES)
      expect(CAPABILITY_SUMMARIES[capability], capability).toMatch(LINE);
  });

  it.each(CAPABILITIES)(
    '%s: each verb has a one-line summary and a positional, each flag a one-line description',
    (capability) => {
      const verbs = Object.entries(SURFACES[capability]);
      expect(verbs.length, `${capability} verbs`).toBeGreaterThan(0);
      for (const [name, verb] of verbs) {
        const at = `${capability} ${name}`;
        expect(verb.summary, `${at} summary`).toMatch(LINE);
        expect(
          verb.positional === null ||
            /^(?:<[a-z]+(?:-[a-z]+)*>|\[[a-z]+(?:-[a-z]+)*\])$/.test(
              verb.positional,
            ),
          `${at} positional ${verb.positional}`,
        ).toBe(true);
        for (const [flag, spec] of Object.entries(verb.flags)) {
          expect(spec.description, `${at} --${flag}`).toMatch(LINE);
          expect(['value', 'switch'], `${at} --${flag}`).toContain(spec.takes);
        }
      }
    },
  );

  it('a verb that takes no flags and no positional says so', () => {
    expect(EVENT_TAP.status.positional).toBeNull();
    expect(DESIGN.show.flags).toEqual({});
  });

  it('a flag left undescribed does not compile', () => {
    const described: Verb = {
      summary: 'Do a thing',
      positional: null,
      flags: { a: { takes: 'value', description: 'A flag' } },
    };
    expect(described.flags).toHaveProperty('a');

    const undescribed = {
      summary: 'Do a thing',
      positional: null,
      flags: {
        a: { takes: 'value', description: 'A flag' },
        // @ts-expect-error — `b` is taken but has no description
        b: { takes: 'value' },
      },
    } satisfies Verb;
    expect(Object.keys(undescribed.flags)).toEqual(['a', 'b']);
  });
});
