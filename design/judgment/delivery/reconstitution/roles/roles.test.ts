// Held out: offline controls by default; live batches follow 0088 and 0092.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { Scenario } from '../../../../../packages/cli/test/reconstitution/roles/check.js';
import { project } from '../../../../../packages/cli/test/reconstitution/roles/runner.js';
import { roleSuite } from '../../../../../packages/cli/test/reconstitution/roles/suite.js';
roleSuite(fileURLToPath(new URL('.', import.meta.url)));

it('Given: sound has no ready work while picture does, in a fresh session', () => {
  const scenario: Scenario = JSON.parse(
    readFileSync(new URL('scenarios.json', import.meta.url), 'utf8'),
  )[0];
  expect(scenario.history).toBeUndefined();
  const f = project(scenario);
  try {
    const state = (cut: string) => {
      const result = spawnSync(
        'cratylus',
        ['workPackage', 'state', '--cut', cut],
        { cwd: f.cwd, env: f.env, encoding: 'utf8', timeout: 60_000 },
      );
      expect(result.status, result.stdout + result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    };
    const sound = state('sound');
    expect(sound.ready).toEqual([]);
    expect(sound.workPackages).toEqual([
      { name: 'recording', status: 'dispatched', dependsOn: [] },
      { name: 'mix', status: 'submitted', dependsOn: ['recording'] },
    ]);
    const picture = state('picture');
    expect(picture.ready).toEqual(['editing']);
    expect(picture.workPackages).toEqual([
      { name: 'editing', status: 'submitted', dependsOn: [] },
    ]);
  } finally {
    f.dispose();
  }
});
