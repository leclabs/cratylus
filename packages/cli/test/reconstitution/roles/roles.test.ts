// Offline proof is the normal run. EXECUTION_RED=1 intentionally fails on each
// behavioral negative; EXECUTION_LIVE=1 enables five runs and separate rubric judges.
// Authored controls prove predicates, clause isolation and 4/5 versus never 5/5;
// they are not model observations. Retain live evidence with EXECUTION_RECORDINGS.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Scenario } from './check.js';
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
      '--meaning-holder',
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
