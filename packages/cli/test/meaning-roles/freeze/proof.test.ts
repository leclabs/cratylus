// Structural controls: prove the assertion boundaries independently of the new verbs.
// These are not implementations of freeze, nor substitutes for structural.test.ts.
import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import type { LoadedExtension } from '../../reconstitution/binding/fixture.js';
import {
  assertGate,
  assertRefused,
  ok,
  phase,
  session,
  setup,
} from './fixture.js';

let f: Fixture | undefined;
let extension: LoadedExtension | undefined;
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
  f = undefined;
});

it('workflow/24,25,29,31-34,36,38 — journal refusal oracle rejects success and warning-only recordings', () => {
  for (const verb of ['supersede', 'retire'] as const) {
    const refusal = {
      code: 1,
      stdout: '',
      stderr: `concepts ${verb}: renewal frozen by renewal; only architect may change it\n`,
    };
    expect(() =>
      assertRefused(refusal, verb, 'renewal', ['renewal']),
    ).not.toThrow();
    expect(() =>
      assertRefused({ ...refusal, code: 0 }, verb, 'renewal', ['renewal']),
    ).toThrow();
    expect(() =>
      assertRefused(
        { ...refusal, stderr: 'warning: entry recorded' },
        verb,
        'renewal',
        ['renewal'],
      ),
    ).toThrow();
  }
});
it('workflow/31-33,35-37 — gate oracle distinguishes pre-act refusal from warning or post-act correction', () => {
  expect(() =>
    assertGate(
      { block: true, reason: 'renewal is frozen; architect may change it' },
      true,
    ),
  ).not.toThrow();
  for (const result of [
    undefined,
    { reason: 'renewal architect warning' },
    { block: false, reason: 'renewal architect warning' },
  ]) {
    expect(() => assertGate(result, true)).toThrow();
  }
  expect(() => assertGate(undefined, false)).not.toThrow();
  expect(() =>
    assertGate({ block: true, reason: 'renewal: only architect' }, false),
  ).toThrow();
});
it('workflow/26-30,34,37 — admissible-change oracle rejects over-broad refusal', () => {
  expect(() => ok({ code: 0, stdout: '{}', stderr: '' })).not.toThrow();
  expect(() => ok({ code: 1, stdout: '', stderr: 'frozen' })).toThrow();
});
for (const stage of [
  'returned',
  'judging',
  'finding',
  'rebuild',
  'complete',
] as const) {
  it(`lifecycle Given control — delivered harness reaches ${stage}`, async () => {
    f = setup();
    extension = await session(f, 'lead');
    await phase(f, extension, stage);
  });
}
