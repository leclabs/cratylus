// The canon offers its rulesets on the plugin, behaviour-driven development first,
// and every rule of them projects to its own file through omp; projecting with none
// chosen places no rule.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import canon, { RULESETS } from '../src/index.js';

describe('canon rulesets', () => {
  it('offers the six rulesets on the plugin, behaviour-driven-development first', () => {
    expect(RULESETS.map((r) => r.name)).toEqual([
      'behaviour-driven-development',
      'gitflow',
      'conventional-commits',
      'commit-discipline',
      'established-libraries',
      'green-field',
    ]);
    expect(canon.rulesets).toBe(RULESETS);
  });

  it('adopts behaviour-driven development by its name, in one rule', () => {
    const [bdd] = RULESETS;
    expect(bdd).toEqual({
      name: 'behaviour-driven-development',
      description:
        "Adopts behaviour-driven development as the project's practice.",
      rules: [
        {
          name: 'behaviour-driven-development-adopted',
          description: 'The project practises behaviour-driven development.',
          statement: 'This project practises behaviour-driven development.',
          why: "Its name carries the practice whole, each role's participation included.",
        },
      ],
    });
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
