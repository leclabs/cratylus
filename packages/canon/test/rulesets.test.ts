// The canon offers its rulesets on the plugin, and every rule of them projects to its
// own file through omp; projecting with none chosen places none.

import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import canon, { RULESETS } from '../src/index.js';

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

  it('projects every rule to rules/<name>.md when all are chosen, and none by default', async () => {
    const names = RULESETS.flatMap((r) => r.rules.map((rule) => rule.name));
    const adapter = adapterByName('omp');
    const none = await projectPluginSet({
      plugins: [canon],
      adapter,
      warn: () => {},
    });
    expect(none.files.filter((f) => f.path.startsWith('rules/'))).toEqual([]);
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
