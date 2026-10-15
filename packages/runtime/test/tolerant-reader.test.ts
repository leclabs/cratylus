// The concept journal and the ledger as an older runtime reads
// them: entries of kinds it does not know, and journal entries of a known kind
// holding a value it does not know, are read past and reported with every
// reading, appending still works and leaves every entry as it was, and an entry
// of a known kind it cannot read is refused by name. The command-line examples
// (cli `test/delivery-journal`) bind the contract end to end; these hold it for
// the library and for the ledger capability.

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { dispatchLedger } from '../src/capabilities/ledger/dispatch.js';

let sandbox: string;
let repo: string;
let dir: string;
beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'tolerant-reader-'));
  repo = join(sandbox, 'repo');
  dir = join(repo, 'design/journal');
  mkdirSync(dir, { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: repo });
});
afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

const concepts = (...argv: string[]) =>
  dispatchConcepts(argv, { from: repo }) as Record<string, unknown>;
const id = (n: number) =>
  `01ARZ3NDEKTSV4RRFFQ69G5F${String(n).padStart(2, '0')}`;
/** Every file of the journal with its bytes. */
const files = () =>
  Object.fromEntries(
    readdirSync(dir)
      .sort()
      .map((name) => [name, readFileSync(join(dir, name), 'utf8')]),
  );
/** Entry `n`, written as a newer runtime would write it. */
const entry = (n: number, fields: Record<string, unknown>) =>
  writeFileSync(
    join(dir, `${id(n)}.json`),
    JSON.stringify({ id: id(n), at: '2016-07-30T23:54:10.259Z', ...fields }),
  );
const unknown = (n: number, kind: string) =>
  entry(n, { kind, context: 'booking', name: 'hold', wording: 'Invented.' });

/** A journal of known kinds: a context, a concept superseded once, a decision
 *  and its acceptance. */
function known() {
  entry(1, {
    kind: 'context',
    name: 'booking',
    subject: 'Booking.',
    relation: '',
  });
  const worded = { context: 'booking', name: 'hold', builtFrom: [] };
  entry(3, {
    kind: 'define',
    ...worded,
    wording: 'Ten minutes.',
    reason: 'First.',
    supersedes: [],
  });
  entry(5, {
    kind: 'supersede',
    ...worded,
    wording: 'Fifteen minutes.',
    reason: 'Later.',
    supersedes: [id(3)],
  });
  entry(7, {
    kind: 'decide',
    decisionId: 'hold-time',
    context: 'booking',
    title: 'T',
    situation: 'S',
    decision: 'D',
    consequences: 'C',
    status: 'open',
    supersedes: null,
  });
  entry(8, { kind: 'accept', decisionId: 'hold-time', entry: id(7) });
}

const readings = [
  ['overview', '--context', 'booking'],
  ['state'],
  ['design', '--context', 'booking'],
  ['history', 'hold', '--context', 'booking'],
  ['history', '--context', 'booking'],
  ['decisions'],
  ['leakage'],
];

it('reads past unknown kinds in every reading, reporting each kind and count', () => {
  known();
  const baseline = readings.map((argv) => concepts(...argv));
  for (const value of baseline)
    expect(value).not.toHaveProperty('uninterpreted');
  unknown(2, 'annotation');
  unknown(4, 'review');
  unknown(6, 'annotation');
  const before = files();
  for (const [i, argv] of readings.entries())
    for (const _ of [1, 2])
      expect(concepts(...argv)).toEqual({
        ...baseline[i],
        uninterpreted: {
          kinds: { annotation: 2, review: 1 },
          mayBeIncomplete: true,
          reading: expect.stringMatching(/read past.*may be incomplete/),
        },
      });
  expect(files()).toEqual(before);
  expect(concepts('design')).toMatchObject({
    contexts: [{ concepts: [{ name: 'hold', wording: 'Fifteen minutes.' }] }],
  });
});

it('reads past a known entry holding values it does not know, reporting each value', () => {
  known();
  const baseline = readings.map((argv) => concepts(...argv));
  entry(9, {
    kind: 'decide',
    decisionId: 'later',
    context: 'booking',
    title: 'T',
    situation: 'S',
    decision: 'Invented.',
    consequences: 'C',
    status: 'deferred',
    supersedes: null,
    decisionKind: 'policy',
  });
  entry(10, {
    kind: 'classify',
    decisionId: 'hold-time',
    entry: id(7),
    decisionKind: 'policy',
  });
  const before = files();
  for (const [i, argv] of readings.entries())
    expect(concepts(...argv)).toEqual({
      ...baseline[i],
      uninterpreted: {
        kinds: { decide: 1, classify: 1 },
        values: {
          'decide.status': { deferred: 1 },
          'decide.decisionKind': { policy: 1 },
          'classify.decisionKind': { policy: 1 },
        },
        mayBeIncomplete: true,
        reading: expect.any(String),
      },
    });
  expect(files()).toEqual(before);
});

it('appends past an unknown entry, leaving every entry as it was', () => {
  known();
  unknown(9, 'annotation');
  const before = files();
  const appended = concepts(
    'define',
    'receipt',
    '--context',
    'booking',
    '--wording',
    'A receipt records the hold.',
    '--reason',
    'Proof.',
  ) as { id: string };
  expect(appended).not.toHaveProperty('uninterpreted');
  const after = files();
  const added = Object.keys(after).filter((name) => !(name in before));
  expect(added).toEqual([`${appended.id}.json`]);
  // Minted past the journal's last entry, though that one is of an unknown kind.
  expect(appended.id > id(9)).toBe(true);
  for (const [name, bytes] of Object.entries(before))
    expect(after[name]).toBe(bytes);
  expect(concepts('design')).toMatchObject({
    contexts: [{ concepts: [{ name: 'hold' }, { name: 'receipt' }] }],
    uninterpreted: { kinds: { annotation: 1 }, mayBeIncomplete: true },
  });
});

it('refuses a known entry it cannot read by name, though an unknown kind is present', () => {
  known();
  unknown(2, 'annotation');
  entry(4, {
    kind: 'define',
    context: 'booking',
    name: 'malformed',
    builtFrom: [],
    reason: 'No wording.',
    supersedes: [],
  });
  const before = files();
  for (const verb of ['design', 'decisions'])
    expect(() => concepts(verb)).toThrow(
      new RegExp(
        `^concepts ${verb}: the journal entry design/journal/${id(4)}\\.json is a define entry this runtime cannot read: wording is missing or malformed$`,
      ),
    );
  expect(() => concepts('context', 'other', '--subject', 'Other.')).toThrow(
    id(4),
  );
  expect(files()).toEqual(before);
});

it('shows the effort recorded for past work only as history, in a journal holding an unknown kind', () => {
  known();
  entry(9, {
    kind: 'efficiency',
    context: 'booking',
    cut: 'delivery',
    agentRuns: { total: 2, byRole: { builder: 2 } },
    rounds: 1,
    wholeCheckRuns: 1,
    tokens: null,
  });
  unknown(10, 'annotation');
  const before = files();
  expect(concepts('state', '--history')).toMatchObject({
    contexts: [{ efficiency: [{ cut: 'delivery' }] }],
    uninterpreted: { kinds: { annotation: 1 }, mayBeIncomplete: true },
  });
  expect(
    (concepts('state') as { contexts: object[] }).contexts[0],
  ).not.toHaveProperty('efficiency');
  expect(files()).toEqual(before);
});

it('reads the ledger past a kind it does not know, and appends past it', () => {
  const ledger = join(repo, 'design/ledger');
  mkdirSync(ledger);
  const ledgerEntry = (n: number, fields: Record<string, unknown>) =>
    writeFileSync(
      join(ledger, `${id(n)}.json`),
      JSON.stringify({
        id: id(n),
        at: '2016-07-30T23:54:10.259Z',
        transition: `fixture:${n}`,
        ...fields,
      }),
    );
  ledgerEntry(1, { kind: 'story', story: 'reader' });
  ledgerEntry(3, { kind: 'end', story: 'reader', outcome: 'merged' });
  const state = () =>
    dispatchLedger(['state'], { from: repo }) as Record<string, unknown>;
  const baseline = state();
  expect(baseline).not.toHaveProperty('uninterpreted');
  ledgerEntry(5, { kind: 'annotation', story: 'reader' });
  const report = {
    kinds: { annotation: 1 },
    mayBeIncomplete: true,
    reading: expect.any(String),
  };
  expect(state()).toEqual({ ...baseline, uninterpreted: report });
  const bytes = readFileSync(join(ledger, `${id(5)}.json`), 'utf8');
  const recorded = dispatchLedger(['task', 'reader-view'], { from: repo });
  expect(recorded).not.toHaveProperty('uninterpreted');
  expect(state()).toMatchObject({
    inFlight: { tasks: [{ task: 'reader-view' }] },
    uninterpreted: report,
  });
  expect(readFileSync(join(ledger, `${id(5)}.json`), 'utf8')).toBe(bytes);
  known();
  expect(concepts('overview', '--context', 'booking')).toMatchObject({
    uninterpreted: report,
  });
});
