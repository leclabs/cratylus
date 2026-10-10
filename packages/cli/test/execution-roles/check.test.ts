import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import {
  type Recording,
  type Scenario,
  assess,
  parseAnswers,
} from './check.js';

const scenarios: Scenario[] = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./scenarios.json', import.meta.url)),
    'utf8',
  ),
);
const record = (number: number): Recording =>
  JSON.parse(
    readFileSync(
      fileURLToPath(
        new URL(`./recordings/${number}/golden-1.json`, import.meta.url),
      ),
      'utf8',
    ),
  );
it('does not mistake formatting concept names for implementation detail', () => {
  const r = record(19);
  r.report =
    '`Reservation` grants a claim to a free seat. **Cancellation** releases it on request.';
  expect(
    assess(scenarios.find((s) => s.number === 19)!, r)['no-implementation'],
  ).toBe(true);
});
it('retains intermediate mutations even when the final project is restored', () => {
  const r = record(17);
  r.snapshots.splice(1, 0, {
    ...r.snapshots[0],
    'new-output': 'unrequested work',
  });
  expect(assess(scenarios.find((s) => s.number === 17)!, r)['no-change']).toBe(
    false,
  );
});
it('observes journal appends as concept changes, not only edits to the scenario summary', () => {
  const r = record(15);
  r.snapshots[1]['design/journal/new-entry.json'] = 'a changed meaning';
  expect(
    assess(scenarios.find((s) => s.number === 15)!, r)['concept-unchanged'],
  ).toBe(false);
});
it('requires explicit boolean answers and evidence for precisely the fixed rubric', () => {
  const scenario = scenarios.find((s) => s.number === 19)!;
  const answers = record(19).answers;
  expect(parseAnswers(JSON.stringify(answers), scenario)).toEqual(answers);
  expect(() => parseAnswers('{}', scenario)).toThrow();
  expect(() =>
    parseAnswers(
      JSON.stringify({ ...answers, extra: { pass: true, evidence: 'extra' } }),
      scenario,
    ),
  ).toThrow();
  expect(() =>
    parseAnswers(
      JSON.stringify({
        ...answers,
        'concept-outcomes': { pass: 'yes', evidence: 'wrong type' },
      }),
      scenario,
    ),
  ).toThrow();
  expect(() =>
    parseAnswers(
      JSON.stringify({
        ...answers,
        'concept-outcomes': { pass: true, evidence: '' },
      }),
      scenario,
    ),
  ).toThrow();
});
