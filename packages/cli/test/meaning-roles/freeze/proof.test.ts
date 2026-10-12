// Structural controls: prove the assertion boundaries and the stand-ins independently
// of the freeze. These are not implementations of freeze, nor substitutes for its checks.
import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import type { LoadedExtension } from '../../reconstitution/binding/fixture.js';
import {
  type Refs,
  architect,
  assertAdmittedCommit,
  assertRefused,
  assertRefusedCommit,
  attempt,
  bent,
  change,
  examplePath,
  freezeChecks,
  notesPath,
  ok,
  phase,
  refs,
  session,
  setup,
  standIn,
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

it('workflow/31-33,35,36 — commit refusal oracle rejects an admitted, moved, silent or unnamed recording', () => {
  const before: Refs = {
    branch: 'aaa',
    head: 'refs/heads/feature/renewal',
    headCommit: 'aaa',
  };
  const refusal = {
    code: 1,
    stdout: '',
    stderr: `freeze: ${examplePath} is frozen by the cut renewal; only ${architect} may change it\nfatal: in 'prepared' phase, update aborted by the reference-transaction hook\n`,
  };
  const names = [examplePath];
  expect(() =>
    assertRefusedCommit(refusal, before, before, 'commit', names),
  ).not.toThrow();
  const moved = { ...before, branch: 'bbb', headCommit: 'bbb' };
  const detached = { ...before, head: '', headCommit: 'bbb' };
  for (const [result, after] of [
    [{ ...refusal, code: 0 }, before],
    [refusal, moved],
    [refusal, detached],
    [{ ...refusal, stderr: 'fatal: update aborted by the hook' }, before],
    [
      { ...refusal, stderr: `freeze: renewal is frozen; ${architect} only` },
      before,
    ],
    [{ ...refusal, stderr: `freeze: ${examplePath} is frozen` }, before],
  ] as const)
    expect(() =>
      assertRefusedCommit(result, before, after, 'commit', names),
    ).toThrow();
  // A rebase detaches HEAD before the branch update it is refused; the branch is the record.
  expect(() =>
    assertRefusedCommit(refusal, before, detached, 'rebase', names),
  ).not.toThrow();
  expect(() =>
    assertRefusedCommit(refusal, before, moved, 'rebase', names),
  ).toThrow();
  // Where the examples leave the working copy the unread freeze may refuse,
  // naming only the cut; it must still refuse, keep the branch and name the cut.
  const unread = {
    code: 1,
    stdout: '',
    stderr: "freeze-gate: the cut 'renewal' has no visible examples\n",
  };
  expect(() =>
    assertRefusedCommit(unread, before, before, 'delete folder', []),
  ).not.toThrow();
  for (const [result, after] of [
    [{ ...unread, code: 0 }, before],
    [unread, moved],
    [{ ...unread, stderr: 'fatal: update aborted by the hook' }, before],
  ] as const)
    expect(() =>
      assertRefusedCommit(result, before, after, 'delete folder', []),
    ).toThrow();
});

it('workflow/26-30,34,35,37 — admission oracles reject over-broad refusal', () => {
  expect(() => ok({ code: 0, stdout: '{}', stderr: '' })).not.toThrow();
  expect(() => ok({ code: 1, stdout: '', stderr: 'frozen' })).toThrow();
  const before: Refs = {
    branch: 'aaa',
    head: 'refs/heads/x',
    headCommit: 'aaa',
  };
  const after = { ...before, branch: 'bbb', headCommit: 'bbb' };
  const admitted = { code: 0, stdout: '', stderr: '' };
  expect(() =>
    assertAdmittedCommit(admitted, before, after, 'commit'),
  ).not.toThrow();
  expect(() =>
    assertAdmittedCommit({ ...admitted, code: 1 }, before, before, 'commit'),
  ).toThrow();
  expect(() =>
    assertAdmittedCommit(admitted, before, before, 'commit'),
  ).toThrow();
});

it('stand-in control — the admitting record admits a frozen change at the commit and the journal', () => {
  f = setup();
  freezeChecks(f);
  standIn(f, 'admit');
  const before = refs(f);
  const result = attempt(
    f,
    'lead',
    'commit',
    examplePath,
    bent(examplePath, 'x'),
  );
  assertAdmittedCommit(result, before, refs(f), 'commit');
  ok(change(f, 'lead', 'supersede'));
});

it('stand-in control — the refusing record refuses an unfrozen change at the commit and the architect at the journal', () => {
  f = setup();
  standIn(f, 'refuse');
  const before = refs(f);
  const result = attempt(f, architect, 'commit', notesPath, 'Notes.\n');
  expect(result.code).not.toBe(0);
  expect(refs(f).branch).toBe(before.branch);
  expect(change(f, architect, 'supersede').code).toBe(1);
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
