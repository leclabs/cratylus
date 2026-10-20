// The architect conforms to the pattern: its delivered profile, and every persona
// over it, states in its own values that meaning decides which concepts a project
// needs and each one's correction, never what an established name means, and that
// the record's own names are inputs it checks like any other. The wording lives in
// the values alone; this test reads it from them.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import { readBack } from '../src/factors/deliverable/read-back.js';
import { sourceOfTruth } from '../src/factors/memory/source-of-truth.js';
import { reconstitution } from '../src/factors/procedure/reconstitution.js';
import { rectify } from '../src/factors/procedure/rectify.js';
import { cratylism } from '../src/factors/stance/cratylism.js';
import canon from '../src/index.js';
import { type Factor, MANIFEST, type Value } from '../src/manifest.js';
import { architectRole } from '../src/roles/architect.js';

/** A value `name ≜ body`, which renders as `- **name** … — body`. */
function parts(value: Value<Factor>): { name: string; body: string } {
  const text: string = typeof value === 'string' ? value : value.body;
  const [name = '', body = ''] = text.split(' ≜ ');
  return { name, body };
}

const meaningCorrection = MANIFEST['decision-rights'].slots.find(
  (s) => s.name === 'meaning',
)?.correction;

const rectifyEntry = architectRole.values.procedure?.find(
  (p) => typeof p === 'object' && 'value' in p && p.value === rectify,
);
const rectifyNote =
  rectifyEntry && 'note' in rectifyEntry ? rectifyEntry.note : undefined;

/** Each decided value, as a predicate on a rendered line. */
const decided: Record<string, (line: string) => boolean> = {
  meaning: (l) => l.startsWith(`- meaning (${meaningCorrection}): **D**`),
  rectify: (l) =>
    l.startsWith(`- **${parts(rectify).name}** (${rectifyNote}) — `),
  ...Object.fromEntries(
    Object.entries({ sourceOfTruth, reconstitution, cratylism, readBack }).map(
      ([key, value]) => {
        const { name, body } = parts(value);
        return [
          key,
          (l: string) =>
            l.startsWith(`- **${name}**`) && l.endsWith(` — ${body}`),
        ];
      },
    ),
  ),
};

describe('the architect conforms to the pattern', async () => {
  const tree = await projectPluginSet({
    plugins: [canon],
    adapter: adapterByName('omp'),
  });
  const lines = (agent: string): string[] =>
    (
      tree.files.find((f) => f.path === `agents/${agent}.md`)?.content ?? ''
    ).split('\n');
  const architect = lines('architect');

  it("the architect's definition carries each decided value", () => {
    expect(meaningCorrection).toBeDefined();
    expect(rectifyNote).toBeDefined();
    for (const [key, holds] of Object.entries(decided)) {
      expect(architect.filter(holds), key).toHaveLength(1);
    }
  });

  for (const persona of ['mav', 'nico', 'kino']) {
    it(`${persona} renders the architect's line for each decided value`, () => {
      const own = lines(persona);
      for (const [key, holds] of Object.entries(decided)) {
        const line = architect.find(holds);
        expect(line, key).toBeDefined();
        expect(own, `${persona}: ${key}`).toContain(line);
      }
    });
  }
});
