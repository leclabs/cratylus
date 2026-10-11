// Offline proof is the normal run. EXECUTION_RED=1 intentionally fails on each
// behavioral negative; EXECUTION_LIVE=1 enables batches governed by 0088 and 0092.
// Authored controls prove predicates, clause isolation and the 4/5 run rule;
// they are not model observations. Retain live evidence with EXECUTION_RECORDINGS.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import type { Scenario } from './check.js';
import { project } from './runner.js';
import { roleSuite } from './suite.js';
const here = fileURLToPath(new URL('.', import.meta.url));
roleSuite(here);
const execution = fileURLToPath(
  new URL('../../execution-roles/', import.meta.url),
);
const carried = JSON.parse(
  readFileSync(`${execution}scenarios.json`, 'utf8'),
).find((s: Scenario) => s.number === 19);
// workflow/1 carries execution/19's exact rubric and returned verdicts.
const scenario: Scenario = {
  ...carried,
  ref: 'workflow/1 (execution/19)',
  setup: [
    [
      'concepts',
      'context',
      'booking',
      '--subject',
      'Reservations and cancellation',
    ],
    ...['reservation', 'cancellation'].map((name) => [
      'concepts',
      'define',
      name,
      '--context',
      'booking',
      '--wording',
      name === 'reservation'
        ? 'A confirmed claim to a seat.'
        : 'Release a reservation on request.',
      '--reason',
      'Fixed scenario Given.',
    ]),
    [
      'workPackage',
      'open',
      '--cut',
      'seats',
      '--branch',
      'feature/seats',
      '--architect',
      'booking=operator',
    ],
    ...['reservation', 'cancellation'].map((name) => [
      'workPackage',
      'submit',
      name,
      '--cut',
      'seats',
      '--concept',
      name,
      '--output',
      name === 'reservation' ? 'src/reserve.mjs' : 'src/cancel.mjs',
    ]),
    ...['reservation', 'cancellation'].flatMap((workPackage) =>
      ['dispatched', 'returned'].map((kind) => [
        'lifecycle',
        JSON.stringify({
          kind,
          transition: `${workPackage}-${kind}`,
          cut: 'seats',
          workPackage,
          role: 'builder',
          run: workPackage,
        }),
      ]),
    ),
    ...['A', 'B'].map((assayer) => [
      'lifecycle',
      JSON.stringify({
        kind: 'verdict',
        transition: `verdict-${assayer}`,
        cut: 'seats',
        assayer,
        run: `assay-${assayer}`,
        hardeningNotes: [],
        verdicts: ['reservation', 'cancellation'].map((concept) => ({
          workPackage: concept,
          concept,
          passes: true,
          evidence:
            concept === 'reservation'
              ? 'A free seat gets a confirmed claim.'
              : 'Cancellation releases the claim.',
        })),
      }),
    ]),
  ],
};
roleSuite(here, [scenario], execution);
it('Given: finished footage unlocks grading, not captions', () => {
  const scenario: Scenario = JSON.parse(
    readFileSync(new URL('scenarios.json', import.meta.url), 'utf8'),
  ).find((item: Scenario) => item.number === 12);
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
