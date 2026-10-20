import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';
import {
  type Design,
  query,
  repositoryRoot,
  snapshot,
} from '../concept-journal/fixture.js';
export { type Host, success } from '../capability-port/fixture.js';
export { git, snapshot } from '../concept-journal/fixture.js';

export interface Delivered {
  origin: string;
  version: string;
  context: string;
  identity: string;
  /** The context's place, upstream first, among those its origin delivers. */
  position: number;
  subject: string;
  relation: string;
  concepts: { name: string; wording: string; builtFrom: string[] }[];
}
export interface ContextView {
  name: string;
  subject: string;
  relation: string;
  /** Each concept whole in the design, one line `name ≜ wording` in the state. */
  concepts: Delivered['concepts'] | string[];
  delivered?: Pick<Delivered, 'origin' | 'version' | 'context' | 'identity'>;
  readOnly?: boolean;
  decisions?: { accepted: unknown[]; open: unknown[] };
  efficiency?: unknown[];
  retired?: unknown[];
}
export const document: Delivered = {
  origin: 'cratylus',
  version: '7.8.9',
  context: 'workflow',
  identity: '01ARZ3NDEKTSV4RRFFQ69G5F00',
  position: 1,
  subject: 'The released workflow subject.',
  relation: 'The released workflow relation.',
  concepts: [
    {
      name: 'practice',
      wording: 'The released practice, not its earlier version.',
      builtFrom: ['record'],
    },
    { name: 'record', wording: 'The released record.', builtFrom: [] },
  ],
};
export const qualified = 'cratylus:workflow';
/** The context upstream of every other cratylus delivers, read before workflow. */
export const upstream: Delivered = {
  origin: 'cratylus',
  version: '7.8.9',
  context: 'cratylic context design',
  identity: '01ARZ3NDEKTSV4RRFFQ69G5F01',
  position: 0,
  subject: 'The released cratylic context design subject.',
  relation: 'The released cratylic context design relation.',
  concepts: [{ name: 'term', wording: 'The released term.', builtFrom: [] }],
};
export const upstreamQualified = 'cratylus:cratylic context design';
export function installed(): Host {
  const h = host();
  success(h.install);
  return h;
}
export function owned(h: Host): string {
  return join(h.home, '.cratylus/omp');
}
/** Where `context`'s delivered document is under the installation `root`:
 *  named by the context as recorded, spaces included. */
export function deliveredPath(
  h: Host,
  context = 'workflow',
  root = owned(h),
): string {
  return join(root, `delivered/cratylus/${context}.json`);
}
export function putDocument(h: Host, value = document, root = owned(h)): void {
  const path = deliveredPath(h, value.context, root);
  mkdirSync(dirname(path), { recursive: true });
  // A fixture installation supplies a document independently of the build check.
  // Unlinking is unnecessary: the owner can set its own fixture's mode first.
  try {
    chmodSync(path, 0o644);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  writeFileSync(path, JSON.stringify(value));
  chmodSync(path, 0o444);
}
export function readDocument(h: Host, context = 'workflow'): Delivered {
  return JSON.parse(readFileSync(deliveredPath(h, context), 'utf8'));
}
/** Expects the installation `h` reaches to hold the release's projection of
 *  the repository's own `context`, at `position`, read-only: its current design,
 *  with its identity, the one its earliest entry carrying one carries, else its
 *  earliest entry's id; returns it. */
export function expectReleased(
  h: Host,
  context: string,
  position: number,
): Delivered {
  const path = deliveredPath(h, context);
  expect(
    existsSync(path),
    `the release ships delivered/cratylus/${context}.json under its owned root`,
  ).toBe(true);
  const actual = readDocument(h, context);
  const source = query<Design>(repositoryRoot, 'design', '--context', context)
    .contexts[0]!;
  const recorded = Object.values(snapshot(repositoryRoot))
    .map((bytes) => JSON.parse(Buffer.from(bytes, 'base64').toString()))
    .filter((entry) => entry.kind === 'context' && entry.name === context)
    .sort((a, b) => a.id.localeCompare(b.id));
  const identity =
    recorded.find((entry) => entry.identity !== undefined)?.identity ??
    recorded[0]?.id;
  const version = success(h.command(['--version'])).trim();
  expect({
    ...actual,
    concepts: [...actual.concepts].sort((a, b) => a.name.localeCompare(b.name)),
  }).toEqual({
    origin: 'cratylus',
    version,
    context,
    identity,
    position,
    subject: source.subject,
    relation: source.relation,
    concepts: source.concepts
      .map(({ name, wording, builtFrom }) => ({ name, wording, builtFrom }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });
  expect(
    statSync(path).mode & 0o222,
    'no owner, group or other write bit',
  ).toBe(0);
  return actual;
}
/** A view's answer: the project's other `contexts`, and apart from them the
 *  `practice` place (none where it shows none), each delivered context or the
 *  project's own copy in its place, which, where shown, is labelled and comes
 *  before the project's other contexts. */
export function views(
  h: Host,
  verb: string,
  ...args: string[]
): { contexts: ContextView[]; practice: ContextView[] } {
  const answer = h.concepts<{
    contexts: ContextView[];
    practice?: { about: string; contexts: ContextView[] };
  }>(verb, ...args);
  if (answer.practice !== undefined) {
    expect(answer.practice.about).toMatch(/practice/);
    expect(answer.practice.about).toMatch(/not part of this project.s design/);
    const keys = Object.keys(answer);
    expect(keys.indexOf('practice')).toBeLessThan(keys.indexOf('contexts'));
  }
  for (const own of answer.contexts)
    expect(own, 'a project context is never delivered').not.toHaveProperty(
      'delivered',
    );
  return {
    contexts: answer.contexts,
    practice: answer.practice?.contexts ?? [],
  };
}
export function assertDelivered(
  context: ContextView | undefined,
  verb: string,
  value = document,
): void {
  expect(context, `${verb} includes the delivered context`).toBeDefined();
  expect(context).toMatchObject({
    name: `${value.origin}:${value.context}`,
    delivered: {
      origin: value.origin,
      version: value.version,
      context: value.context,
      identity: value.identity,
    },
    readOnly: true,
    subject: value.subject,
    relation: value.relation,
  });
  if (verb === 'state')
    expect(context!.concepts).toEqual(
      value.concepts.map((c) => `${c.name} ≜ ${c.wording}`),
    );
  else
    expect(
      (context!.concepts as Delivered['concepts'])
        .map(({ name, wording, builtFrom }) => ({
          name,
          wording,
          builtFrom,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ).toEqual([...value.concepts].sort((a, b) => a.name.localeCompare(b.name)));
  if (verb === 'state') {
    expect(context).not.toHaveProperty('decisions');
    expect(context).not.toHaveProperty('efficiency');
    expect(context).not.toHaveProperty('retired');
  }
}
/** Expects `view` to give `wording` as its first concept's meaning: whole in
 *  the design, after `≜` on its line in the state. */
export function expectMeaning(view: ContextView, wording: string): void {
  const [first] = view.concepts;
  expect(
    typeof first === 'string' ? first.split(' ≜ ')[1] : first?.wording,
  ).toBe(wording);
}
export function ownSource(h: Host, name = 'workflow'): void {
  // Same identity, a different branch's current meaning; names do not decide ownership.
  const dir = join(h.cwd, 'design/journal');
  mkdirSync(dir, { recursive: true });
  const entry = {
    id: document.identity,
    at: '2026-01-01T00:00:00.000Z',
    kind: 'context',
    name,
    subject: 'The local source subject.',
    relation: 'The local source relation.',
  };
  writeFileSync(join(dir, `${entry.id}.json`), JSON.stringify(entry));
  h.concepts(
    'define',
    'practice',
    '--context',
    name,
    '--wording',
    'The branch practice.',
    '--reason',
    'Current on this branch.',
  );
}

export function assertSourceView(answer: ContextView[], name: string): void {
  expect(answer).toHaveLength(1);
  expect(answer[0]).toMatchObject({
    name,
    subject: 'The local source subject.',
  });
  expect(answer[0]).not.toHaveProperty('delivered');
  expectMeaning(answer[0]!, 'The branch practice.');
}
