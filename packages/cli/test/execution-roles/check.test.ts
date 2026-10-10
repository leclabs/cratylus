import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import {
  type Recording,
  type Scenario,
  assess,
  parseAnswers,
} from './check.js';
import { snapshot } from './snapshot.js';

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
it.each(['define', 'supersede', 'retire'])(
  'rejects a new %s version of the named concept',
  (kind) => {
    const r = record(15);
    r.snapshots[1]!['design/journal/new-entry.json'] =
      `journal:${JSON.stringify({
        kind,
        context: 'booking',
        name: 'reservation',
      })}`;
    expect(
      assess(scenarios.find((s) => s.number === 15)!, r)['concept-unchanged'],
    ).toBe(false);
  },
);
it.each([
  { kind: 'decide', context: 'booking', status: 'open' },
  { kind: 'supersede', context: 'booking', name: 'cancellation' },
  { kind: 'supersede', context: 'another-context', name: 'reservation' },
])('permits unrelated journal entry %j', (entry) => {
  const r = record(15);
  r.snapshots[1]!['design/journal/new-entry.json'] =
    `journal:${JSON.stringify(entry)}`;
  expect(
    assess(scenarios.find((s) => s.number === 15)!, r)['concept-unchanged'],
  ).toBe(true);
});
it('requires explicit boolean answers and evidence for precisely the fixed rubric', () => {
  const scenario = scenarios.find((s) => s.number === 18)!;
  const answers = record(18).answers;
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
        declines: { pass: 'yes', evidence: 'wrong type' },
      }),
      scenario,
    ),
  ).toThrow();
  expect(() =>
    parseAnswers(
      JSON.stringify({
        ...answers,
        declines: { pass: true, evidence: '' },
      }),
      scenario,
    ),
  ).toThrow();
});
it('captures journal entry bytes for concept-scoped assessment', () => {
  const root = mkdtempSync(join(tmpdir(), 'execution-concept-snapshot-'));
  try {
    mkdirSync(join(root, 'design/journal'), { recursive: true });
    const bytes = '{"kind":"decide","context":"booking","status":"open"}\n';
    writeFileSync(join(root, 'design/journal/decision.json'), bytes);
    expect(snapshot(root)['design/journal/decision.json']).toBe(
      `journal:${bytes}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
