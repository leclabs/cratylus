// The canon offers its rulesets on the plugin, behaviour-driven development first,
// and every rule of them projects to its own file through omp; projecting with none
// chosen places no rule.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import canon, { RULESETS } from '../src/index.js';

describe('canon rulesets', () => {
  it('offers the eight rulesets on the plugin, behaviour-driven-development first', () => {
    expect(RULESETS.map((r) => r.name)).toEqual([
      'behaviour-driven-development',
      'context-engineering',
      'gitflow',
      'conventional-commits',
      'commit-discipline',
      'established-libraries',
      'green-field',
      'clean-cutover',
    ]);
    expect(canon.rulesets).toBe(RULESETS);
  });

  it('adopts behaviour-driven development by its name, in one rule', () => {
    const [bdd] = RULESETS;
    expect(bdd).toEqual({
      name: 'behaviour-driven-development',
      description: 'Adopts behaviour-driven development.',
      rules: [
        {
          name: 'behaviour-driven-development-adopted',
          description: 'This project practises behaviour-driven development.',
          statement: 'This project practises behaviour-driven development.',
        },
      ],
    });
  });

  it('describes each rule in no more characters than its statement, each ruleset in no more than its longest statement', () => {
    for (const ruleset of RULESETS) {
      const longest = Math.max(...ruleset.rules.map((r) => r.statement.length));
      expect(
        ruleset.description.length,
        `ruleset ${ruleset.name}`,
      ).toBeLessThanOrEqual(longest);
      for (const rule of ruleset.rules)
        expect(
          rule.description.length,
          `rule ${rule.name}`,
        ).toBeLessThanOrEqual(rule.statement.length);
    }
  });

  it('gives a why only to the rules whose names do not carry it', () => {
    const withWhy = RULESETS.flatMap((r) => r.rules)
      .filter((rule) => 'why' in rule)
      .map((rule) => rule.name);
    expect(withWhy).toEqual([
      'context-engineering-cratylic-context-design',
      'context-engineering-living-documentation',
      'context-engineering-affirmative-instruction',
      'commit-discipline-own-paths',
      'green-field',
    ]);
  });

  it('projects every offered rule to rules/<name>.md when all are chosen, and none by default', async () => {
    const names = RULESETS.flatMap((r) => r.rules.map((rule) => rule.name));
    const adapter = adapterByName('omp');
    const none = await projectPluginSet({
      plugins: [canon],
      adapter,
      warn: () => {},
    });
    expect(
      none.files.map((f) => f.path).filter((p) => p.startsWith('rules/')),
    ).toEqual([]);
    const all = await projectPluginSet({
      plugins: [canon],
      adapter,
      warn: () => {},
      rules: names,
    });
    expect(
      all.files.map((f) => f.path).filter((p) => p.startsWith('rules/')),
    ).toEqual(names.map((n) => `rules/${n}.md`));
  });
});
