// The business analyst renders each value listed below in its delivered profile, and
// every persona over it renders the business analyst's line for each. The wording
// lives in the values alone; this test reads it from them.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import { backbrief } from '../src/factors/deliverable/backbrief.js';
import { domainModel } from '../src/factors/memory/domain-model.js';
import { cratylicContextDesign } from '../src/factors/procedure/cratylic-context-design.js';
import { rectificationOfNames } from '../src/factors/procedure/rectification-of-names.js';
import { cratylism } from '../src/factors/stance/cratylism.js';
import canon from '../src/index.js';
import { type Factor, MANIFEST, type Value } from '../src/manifest.js';

/** A value `name ≜ body`, or its bare term, which renders as `- **name** … — body`, or `- **name**`. */
function parts(value: Value<Factor>): { name: string; body: string } {
  const text: string = typeof value === 'string' ? value : value.body;
  const [name = '', body = ''] = text.split(' ≜ ');
  return { name, body };
}

const meaningGloss = MANIFEST['decision-rights'].slots.find(
  (s) => s.name === 'meaning',
)?.precisingDefinition;

/** Each decided value, as its factor's section and a predicate on a line in it; the
 *  section scopes the line to that factor's values. */
const decided: Record<string, [string, (line: string) => boolean]> = {
  meaning: [
    'decision-rights',
    (l) => l.startsWith(`- meaning (${meaningGloss}): **D**`),
  ],
  ...Object.fromEntries(
    Object.entries({
      memory: { domainModel },
      procedure: { cratylicContextDesign, rectificationOfNames },
      stance: { cratylism },
      deliverable: { backbrief },
    }).flatMap(([section, values]) =>
      Object.entries(values).map(([key, value]) => {
        const { name, body } = parts(value);
        return [
          key,
          [
            section,
            (l: string) =>
              body
                ? l.startsWith(`- **${name}**`) && l.endsWith(` — ${body}`)
                : l === `- **${name}**`,
          ],
        ];
      }),
    ),
  ),
};

/** The lines of an agent definition's `### <factor>` section. */
function section(lines: readonly string[], factor: string): string[] {
  const start = lines.indexOf(`### ${factor}`) + 1;
  if (start === 0) return [];
  const end = lines.findIndex((l, i) => i >= start && /^#{1,3} /.test(l));
  return lines.slice(start, end === -1 ? undefined : end);
}

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
    expect(meaningGloss).toBeDefined();
    for (const [key, [factor, holds]] of Object.entries(decided)) {
      expect(section(businessAnalyst, factor).filter(holds), key).toHaveLength(
        1,
      );
    }
  });

  for (const persona of ['mav', 'nico', 'kino']) {
    it(`${persona} renders the business analyst's line for each decided value`, () => {
      const own = lines(persona);
      for (const [key, [factor, holds]] of Object.entries(decided)) {
        const line = section(businessAnalyst, factor).find(holds);
        expect(line, key).toBeDefined();
        expect(section(own, factor), `${persona}: ${key}`).toContain(line);
      }
    });
  }
});
