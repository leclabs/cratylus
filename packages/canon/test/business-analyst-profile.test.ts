// The business analyst renders each value listed below in its delivered profile, and
// every persona over it renders the business analyst's line for each. The wording
// lives in the values alone; this test reads it from them.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import { report } from '../src/factors/deliverable/report.js';
import { sourceOfTruth } from '../src/factors/memory/source-of-truth.js';
import { cratylicContextDesign } from '../src/factors/procedure/cratylic-context-design.js';
import { reconstitution } from '../src/factors/procedure/reconstitution.js';
import { rectify } from '../src/factors/procedure/rectify.js';
import { cratylism } from '../src/factors/stance/cratylism.js';
import canon from '../src/index.js';
import { type Factor, MANIFEST, type Value } from '../src/manifest.js';
import { businessAnalystRole } from '../src/roles/business-analyst.js';

/** A value `name ≜ body`, or its bare term, which renders as `- **name** … — body`, or `- **name**`. */
function parts(value: Value<Factor>): { name: string; body: string } {
  const text: string = typeof value === 'string' ? value : value.body;
  const [name = '', body = ''] = text.split(' ≜ ');
  return { name, body };
}

const meaningCorrection = MANIFEST['decision-rights'].slots.find(
  (s) => s.name === 'meaning',
)?.correction;

const rectifyEntry = businessAnalystRole.values.procedure?.find(
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
    Object.entries({
      sourceOfTruth,
      reconstitution,
      cratylicContextDesign,
      cratylism,
      report,
    }).map(([key, value]) => {
      const { name, body } = parts(value);
      return [
        key,
        (l: string) =>
          body
            ? l.startsWith(`- **${name}**`) && l.endsWith(` — ${body}`)
            : l === `- **${name}**`,
      ];
    }),
  ),
};

describe('the business analyst conforms to the pattern', async () => {
  const tree = await projectPluginSet({
    plugins: [canon],
    adapter: adapterByName('omp'),
  });
  const lines = (agent: string): string[] =>
    (
      tree.files.find((f) => f.path === `agents/${agent}.md`)?.content ?? ''
    ).split('\n');
  const businessAnalyst = lines('business-analyst');

  it("the business analyst's definition carries each decided value", () => {
    expect(meaningCorrection).toBeDefined();
    expect(rectifyNote).toBeDefined();
    for (const [key, holds] of Object.entries(decided)) {
      expect(businessAnalyst.filter(holds), key).toHaveLength(1);
    }
  });

  for (const persona of ['mav', 'nico', 'kino']) {
    it(`${persona} renders the business analyst's line for each decided value`, () => {
      const own = lines(persona);
      for (const [key, holds] of Object.entries(decided)) {
        const line = businessAnalyst.find(holds);
        expect(line, key).toBeDefined();
        expect(own, `${persona}: ${key}`).toContain(line);
      }
    });
  }
});
