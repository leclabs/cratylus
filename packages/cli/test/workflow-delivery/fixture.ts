import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';
export { type Host, success } from '../capability-port/fixture.js';
export { git, snapshot } from '../concept-journal/fixture.js';

export interface Delivered {
  origin: string;
  version: string;
  context: string;
  identity: string;
  subject: string;
  relation: string;
  concepts: { name: string; wording: string; builtFrom: string[] }[];
}
export interface ContextView {
  name?: string;
  context?: string;
  subject: string;
  relation: string;
  /** Absent from an overview, which tells each concept only in its account. */
  concepts?: { name: string; wording: string; builtFrom: string[] }[];
  delivered?: Pick<Delivered, 'origin' | 'version' | 'context' | 'identity'>;
  readOnly?: boolean;
  account?: string;
  decisions?: { accepted: unknown[]; open: unknown[] };
  efficiency?: unknown[];
  retired?: unknown[];
}
export const document: Delivered = {
  origin: 'cratylus',
  version: '7.8.9',
  context: 'workflow',
  identity: '01ARZ3NDEKTSV4RRFFQ69G5F00',
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
export function installed(): Host {
  const h = host();
  success(h.install);
  return h;
}
export function owned(h: Host): string {
  return join(h.home, '.cratylus/omp');
}
export function deliveredPath(h: Host): string {
  return join(owned(h), 'delivered/cratylus/workflow.json');
}
export function putDocument(h: Host, value = document, root = owned(h)): void {
  const path = join(root, 'delivered/cratylus/workflow.json');
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
export function readDocument(h: Host): Delivered {
  return JSON.parse(readFileSync(deliveredPath(h), 'utf8'));
}
/** A view's answer: the project's own `contexts`, its design and context map,
 *  and apart from them the delivered `practice` (none where it shows none),
 *  which, where shown, is labelled and comes before the project's contexts. */
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
    [verb === 'overview' ? 'context' : 'name']: qualified,
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
  if (verb === 'overview') {
    for (const c of value.concepts)
      expect(context!.account).toContain(
        `${c.name[0]!.toUpperCase()}${c.name.slice(1)} means: ${c.wording}`,
      );
    expect(context!.account).toMatch(/delivered/i);
    expect(context!.account).toMatch(/read.only/i);
    expect(context!.account).toMatch(/practice this project.s agents work by/);
    expect(context!.account).toMatch(/not part of this project.s design/);
    expect(context!.account).not.toMatch(/In the context map/);
  } else
    expect(
      context!
        .concepts!.map(({ name, wording, builtFrom }) => ({
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
/** Expects `view` to give `wording` as its first concept's meaning: in its
 *  concepts, or in its account for an overview, which has no concepts. */
export function expectMeaning(view: ContextView, wording: string): void {
  if (view.concepts === undefined) expect(view.account).toContain(wording);
  else expect(view.concepts[0]!.wording).toBe(wording);
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

export function assertSourceView(
  answer: ContextView[],
  verb: string,
  name: string,
): void {
  expect(answer).toHaveLength(1);
  expect(answer[0]).toMatchObject({
    [verb === 'overview' ? 'context' : 'name']: name,
    subject: 'The local source subject.',
  });
  expect(answer[0]).not.toHaveProperty('delivered');
  expectMeaning(answer[0]!, 'The branch practice.');
}
