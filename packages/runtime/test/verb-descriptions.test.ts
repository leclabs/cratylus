// Every capability, verb and flag carries the words its help prints, declared
// beside the verb: a capability a one-line summary, a verb a one-line purpose
// and the positional it acts on (or none), named and described in a line, a
// flag a one-line description. A flag cannot be taken undescribed; the type
// rejects it, and the case at the end of this file fails `typecheck:test` if it
// ever compiles.

import { describe, expect, it } from 'vitest';
import { VERBS as CONCEPTS } from '../src/capabilities/concepts/dispatch.js';
import { VERBS as EVENT_TAP } from '../src/capabilities/event-tap/dispatch.js';
import { VERBS as WORK_PACKAGE } from '../src/capabilities/work-package/dispatch.js';
import { CAPABILITIES, CAPABILITY_SUMMARIES } from '../src/capability.js';
import type { Verb, VerbFlags } from '../src/verb-flags.js';

const SURFACES: Record<(typeof CAPABILITIES)[number], VerbFlags> = {
  eventTap: EVENT_TAP,
  concepts: CONCEPTS,
  workPackage: WORK_PACKAGE,
};

/** A line of words: something is said, and all of it on one line. */
const LINE = /^\S[^\n\r]*\S$/;

/** A positional's name: a word, or words joined by dashes. */
const POSITIONAL = /^[a-z]+(?:-[a-z]+)*$/;

/** What `verbs` of `capability` leave unsaid: each verb without a one-line
 *  purpose, each positional without a name or a one-line description, each
 *  flag without a one-line description or a known way of taking its value. */
function unsaid(capability: string, verbs: VerbFlags): string[] {
  const missing: string[] = [];
  for (const [name, verb] of Object.entries(verbs)) {
    const at = `${capability} ${name}`;
    if (!LINE.test(verb.purpose)) missing.push(`${at}: purpose`);
    if (verb.positional !== null && !POSITIONAL.test(verb.positional.name))
      missing.push(`${at}: positional ${verb.positional.name}`);
    if (verb.positional !== null && !LINE.test(verb.positional.description))
      missing.push(`${at}: positional ${verb.positional.name} description`);
    for (const [flag, spec] of Object.entries(verb.flags)) {
      if (!LINE.test(spec.description)) missing.push(`${at} --${flag}`);
      if (spec.takes !== 'value' && spec.takes !== 'switch')
        missing.push(`${at} --${flag}: takes`);
    }
  }
  return missing;
}

describe('every capability, verb and flag is described', () => {
  it('each capability has a one-line summary', () => {
    expect(Object.keys(CAPABILITY_SUMMARIES)).toEqual([...CAPABILITIES]);
    for (const capability of CAPABILITIES)
      expect(CAPABILITY_SUMMARIES[capability], capability).toMatch(LINE);
  });

  it.each(CAPABILITIES)(
    '%s: each verb has a one-line purpose and a described positional, each flag a one-line description',
    (capability) => {
      expect(
        Object.keys(SURFACES[capability]).length,
        `${capability} verbs`,
      ).toBeGreaterThan(0);
      expect(unsaid(capability, SURFACES[capability])).toEqual([]);
    },
  );

  it('FLAGS each verb and flag left unsaid, and none that is said', () => {
    const verb = (over: Partial<Verb>, flags: Verb['flags']): Verb => ({
      purpose: 'Do a thing',
      positional: { name: 'unit', description: 'The unit it acts on' },
      ...over,
      flags,
    });
    const said = { takes: 'value', description: 'A flag' } as const;
    expect(
      unsaid('x', {
        ok: verb({}, { a: said }),
        quiet: verb({ purpose: '' }, { a: said }),
        wrapped: verb({ purpose: 'One\nand two' }, { a: said }),
        bare: verb(
          { positional: { name: '<unit>', description: 'The unit' } },
          { a: said },
        ),
        mute: verb(
          { positional: { name: 'unit', description: '' } },
          { a: said },
        ),
        none: verb({ positional: null }, {}),
        flag: verb({}, { a: said, b: { takes: 'value', description: '' } }),
      }),
    ).toEqual([
      'x quiet: purpose',
      'x wrapped: purpose',
      'x bare: positional <unit>',
      'x mute: positional unit description',
      'x flag --b',
    ]);
  });

  it('REFUSES to compile a flag left undescribed', () => {
    const described: Verb = {
      purpose: 'Do a thing',
      positional: null,
      flags: { a: { takes: 'value', description: 'A flag' } },
    };
    expect(described.flags).toHaveProperty('a');

    const undescribed = {
      purpose: 'Do a thing',
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
