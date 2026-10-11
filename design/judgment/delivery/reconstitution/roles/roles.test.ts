// Held out: offline controls by default; EXECUTION_LIVE=1 runs five subjects.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { Scenario } from '../../../../../packages/cli/test/reconstitution/roles/check.js';
import { project } from '../../../../../packages/cli/test/reconstitution/roles/runner.js';
import { roleSuite } from '../../../../../packages/cli/test/reconstitution/roles/suite.js';
roleSuite(fileURLToPath(new URL('.', import.meta.url)));

it('Given: finished footage unlocks grading, not captions', () => {
  const scenario: Scenario = JSON.parse(
    readFileSync(new URL('scenarios.json', import.meta.url), 'utf8'),
  )[0];
  const f = project(scenario);
  try {
    const result = spawnSync(
      'cratylus',
      ['workPackage', 'state', '--cut', 'film'],
      { cwd: f.cwd, env: f.env, encoding: 'utf8', timeout: 60_000 },
    );
    expect(result.status, result.stdout + result.stderr).toBe(0);
    const state = JSON.parse(result.stdout);
    expect(state.ready).toEqual(['grading']);
    expect(state.workPackages).toEqual([
      { name: 'footage', status: 'returned', dependsOn: [] },
      { name: 'grading', status: 'submitted', dependsOn: ['footage'] },
      { name: 'captions', status: 'submitted', dependsOn: ['grading'] },
    ]);
  } finally {
    f.dispose();
  }
});
