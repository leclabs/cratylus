// The canon offers its rulesets on the plugin, and every rule of them projects to its
// own file through omp; projecting with none chosen places only the rules of the
// practice rulesets, which the plugin carries apart from the ones it offers.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import canon, { PRACTICE_RULESETS, RULESETS } from '../src/index.js';

describe('canon rulesets', () => {
  it('offers the five rulesets on the plugin', () => {
    expect(RULESETS.map((r) => r.name)).toEqual([
      'gitflow',
      'conventional-commits',
      'commit-discipline',
      'established-libraries',
      'green-field',
    ]);
    expect(canon.rulesets).toBe(RULESETS);
  });

  it('carries the behaviour-driven-development ruleset apart, as a practice ruleset', () => {
    expect(
      PRACTICE_RULESETS.map((r) => [r.name, r.rules.map((rule) => rule.name)]),
    ).toEqual([
      [
        'behaviour-driven-development',
        ['behaviour-driven-development-examples'],
      ],
    ]);
    expect(canon.practiceRulesets).toBe(PRACTICE_RULESETS);
  });

  it('projects every offered rule to rules/<name>.md when all are chosen, and only the practice rules by default', async () => {
    const names = RULESETS.flatMap((r) => r.rules.map((rule) => rule.name));
    const practice = PRACTICE_RULESETS.flatMap((r) =>
      r.rules.map((rule) => `rules/${rule.name}.md`),
    );
    const adapter = adapterByName('omp');
    const none = await projectPluginSet({
      plugins: [canon],
      adapter,
      warn: () => {},
    });
    expect(
      none.files.map((f) => f.path).filter((p) => p.startsWith('rules/')),
    ).toEqual(practice);
    const all = await projectPluginSet({
      plugins: [canon],
      adapter,
      warn: () => {},
      rules: names,
    });
    expect(
      all.files.map((f) => f.path).filter((p) => p.startsWith('rules/')),
    ).toEqual([...practice, ...names.map((n) => `rules/${n}.md`)]);
  });
});
