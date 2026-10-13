import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { type Host, success } from '../capability-port/fixture.js';
import { snapshot } from '../concept-journal/fixture.js';

export { host, type Host } from '../capability-port/fixture.js';
export {
  temporaryRepository,
  snapshot,
  unchangedFiles,
  type TemporaryRepository,
} from '../concept-journal/fixture.js';

export const ten = 'A reservation expires after ten minutes.';
export const fifteen = 'A reservation expires after fifteen minutes.';
export const firstReason = 'Allow time to finish.';
export const laterReason = 'Customers need five more minutes.';
export const initialSubject = 'Reserving time.';
export const currentSubject = 'Reserving time for customers.';
export const contextReason = 'Make the subject explicit.';
export const invented = 'INVENTED MEANING FROM AN UNINTERPRETED ENTRY';
export const id = (n: number) =>
  `01ARZ3NDEKTSV4RRFFQ69G5F${String(n).padStart(2, '0')}`;

// Files, rather than this reader's append verbs, stand for a newer writer.
// Gaps in the ordered ids let unknown entries sit between readable entries.
export function entry(
  root: string,
  n: number,
  fields: Record<string, unknown>,
) {
  const directory = join(root, 'design/journal');
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, `${id(n)}.json`),
    `${JSON.stringify({ id: id(n), at: '2016-07-30T23:54:10.259Z', ...fields }, null, 2)}\n`,
    { flag: 'wx' },
  );
}

export function knownJournal(root: string) {
  entry(root, 1, {
    kind: 'context',
    name: 'workflow',
    subject: initialSubject,
    relation: '',
    supersedes: [],
  });
  entry(root, 3, {
    kind: 'define',
    context: 'workflow',
    name: 'reservation',
    wording: ten,
    builtFrom: [],
    reason: firstReason,
    supersedes: [],
  });
  entry(root, 5, {
    kind: 'supersede',
    context: 'workflow',
    name: 'reservation',
    wording: fifteen,
    builtFrom: [],
    reason: laterReason,
    supersedes: [id(3)],
  });
  entry(root, 7, {
    kind: 'context',
    name: 'workflow',
    subject: currentSubject,
    relation: '',
    reason: contextReason,
    supersedes: [id(1)],
  });
  entry(root, 8, {
    kind: 'decide',
    decisionId: 'reservation-time',
    context: 'workflow',
    title: 'Reservation time',
    situation: 'Customers need time.',
    decision: 'Allow fifteen minutes.',
    consequences: 'Customers can finish.',
    status: 'open',
    supersedes: null,
  });
  entry(root, 9, {
    kind: 'accept',
    decisionId: 'reservation-time',
    entry: id(8),
  });
}

export function unknownEntry(root: string, n: number, kind = 'annotation') {
  entry(root, n, {
    kind,
    context: 'not-a-recorded-context',
    name: 'not-a-concept',
    wording: invented,
    payload: { preserved: ['opaque', 42] },
  });
}

export function query(
  host: Host,
  root: string,
  ...args: string[]
): Record<string, unknown> {
  const before = snapshot(root);
  const result = host.command(['concepts', ...args], root);
  const value = JSON.parse(success(result)) as Record<string, unknown>;
  expect(snapshot(root), 'reading appends and rewrites nothing').toEqual(
    before,
  );
  return value;
}

export const views = [
  ['overview', '--context', 'workflow'],
  ['state'],
  ['design', '--context', 'workflow'],
  ['history', 'reservation', '--context', 'workflow'],
  ['history', '--context', 'workflow'],
  ['decisions'],
  ['leakage'],
];

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object')
    return Object.values(value).flatMap(strings);
  return [];
}

// No report field names are part of the contract. Recognize a kind/count pair
// in a keyed map, a record, or a prose report, without accepting unassociated
// numbers from elsewhere in the view.
function hasCount(value: unknown, kind: string, count: number): boolean {
  if (typeof value === 'string') {
    const number = `(?:${count}|${['zero', 'one', 'two', 'three'][count]})`;
    return new RegExp(
      `\\b${kind}\\b[^.;,\\n]{0,100}\\b${number}\\b|\\b${number}\\b[^.;,\\n]{0,100}\\b${kind}\\b`,
      'i',
    ).test(value);
  }
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const values = Object.values(record);
  const keyed = record[kind];
  if (keyed === count || keyed === String(count)) return true;
  if (
    keyed &&
    typeof keyed === 'object' &&
    Object.values(keyed).includes(count)
  )
    return true;
  if (
    values.includes(kind) &&
    (values.includes(count) || values.includes(String(count)))
  )
    return true;
  return values.some((child) => hasCount(child, kind, count));
}

function marksIncomplete(value: unknown): boolean {
  if (typeof value === 'string') {
    return /incomplete|(?:may|might|could) (?:be partial|not (?:be |show |contain )?(?:complete|everything))/i.test(
      value,
    );
  }
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, child]) =>
      (/incomplete/i.test(key) && child === true) || marksIncomplete(child),
  );
}

export function reportsUnknown(value: unknown, counts: Record<string, number>) {
  for (const [kind, count] of Object.entries(counts)) {
    expect(
      hasCount(value, kind, count),
      `report associates ${kind} with ${count} uninterpreted entries`,
    ).toBe(true);
  }
  expect(
    marksIncomplete(value),
    'report states the view may be incomplete',
  ).toBe(true);
}

export function noUnknownReport(value: unknown) {
  expect(
    strings(value).join('\n'),
    'known entries are never called unknown or incomplete',
  ).not.toMatch(/incomplete|uninterpreted|unknown (?:entry )?kind/i);
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (
        /incomplete|uninterpreted|unknown/i.test(key) &&
        typeof child === 'boolean'
      )
        expect(child).toBe(false);
      noUnknownReport(child);
    }
  }
}

export function assertKnownViews(values: Record<string, unknown>[]) {
  const [design, history, contextHistory, decisions] = values;
  expect(design).toMatchObject({
    contexts: [
      {
        name: 'workflow',
        subject: currentSubject,
        concepts: [
          {
            name: 'reservation',
            wording: fifteen,
            reason: laterReason,
          },
        ],
      },
    ],
  });
  expect(history).toMatchObject({
    versions: [
      { id: id(3), wording: ten, reason: firstReason },
      { id: id(5), wording: fifteen, reason: laterReason },
    ],
  });
  expect(contextHistory).toMatchObject({
    versions: [
      { id: id(1), subject: initialSubject },
      { id: id(7), subject: currentSubject, reason: contextReason },
    ],
  });
  expect(decisions).toMatchObject({
    decisions: [{ id: 'reservation-time', status: 'accepted' }],
  });
  for (const value of values) noUnknownReport(value);
}
