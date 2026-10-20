// workflow-delivery, decision 0207: projection over fixture journals, not a summary.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import * as runtime from '../src/index.js';

type Document = {
  origin: string;
  version: string;
  context: string;
  identity: string;
  position: number;
  subject: string;
  relation: string;
  concepts: { name: string; wording: string; builtFrom: string[] }[];
};
type Project = (options: {
  from: string;
  context: string;
  origin: string;
  version: string;
  position: number;
}) => Document;
let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'delivered-context-'));
  mkdirSync(join(root, 'nested'));
  execFileSync('git', ['init', '-q'], { cwd: root });
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});
const command = (...args: string[]) => dispatchConcepts(args, { from: root });
function project() {
  const fn = Reflect.get(runtime, 'deliverContext') as Project | undefined;
  expect(
    fn,
    '@cratylus/runtime exports the release projection deliverContext',
  ).toBeTypeOf('function');
  return fn!({
    from: join(root, 'nested'),
    context: 'workflow',
    origin: 'cratylus',
    version: '3.2.1',
    position: 1,
  });
}
function seed() {
  const first = command(
    'context',
    'workflow',
    '--subject',
    'Earlier subject.',
    '--relation',
    'Earlier relation.',
  ) as { id: string };
  command(
    'context',
    'workflow',
    '--subject',
    'Current subject.',
    '--relation',
    'Current relation.',
    '--reason',
    'Current description.',
  );
  command(
    'define',
    'part',
    '--context',
    'workflow',
    '--wording',
    'A current part.',
    '--reason',
    'First part.',
  );
  command(
    'define',
    'whole',
    '--context',
    'workflow',
    '--wording',
    'Earlier whole.',
    '--reason',
    'First whole.',
  );
  command(
    'supersede',
    'whole',
    '--context',
    'workflow',
    '--wording',
    'The current whole.',
    '--reason',
    'Sharpened.',
    '--built-from',
    'part',
  );
  command(
    'define',
    'obsolete',
    '--context',
    'workflow',
    '--wording',
    'A retired meaning.',
    '--reason',
    'Once needed.',
  );
  command(
    'retire',
    'obsolete',
    '--context',
    'workflow',
    '--reason',
    'No longer needed.',
  );
  command(
    'decide',
    'choice',
    '--context',
    'workflow',
    '--title',
    'A private source decision',
    '--situation',
    'Source situation.',
    '--decision',
    'Source choice.',
    '--consequences',
    'Source consequences.',
    '--status',
    'accepted',
  );
  return first.id;
}
const journal = () =>
  Object.fromEntries(
    readdirSync(join(root, 'design/journal'))
      .sort()
      .map((name) => [
        name,
        readFileSync(join(root, 'design/journal', name), 'utf8'),
      ]),
  );

it('delivery/1 — projects exactly the current source design, first context identity, no history or decisions', () => {
  const identity = seed();
  const before = journal();
  const actual = project();
  expect({
    ...actual,
    concepts: [...actual.concepts].sort((a, b) => a.name.localeCompare(b.name)),
  }).toEqual({
    origin: 'cratylus',
    version: '3.2.1',
    context: 'workflow',
    identity,
    position: 1,
    subject: 'Current subject.',
    relation: 'Current relation.',
    concepts: [
      { name: 'part', wording: 'A current part.', builtFrom: [] },
      { name: 'whole', wording: 'The current whole.', builtFrom: ['part'] },
    ],
  });
  expect(journal()).toEqual(before);
});

it('delivery/4 — identical source and version serialize identically and a later source cannot change earlier values', () => {
  seed();
  const a = project();
  const saved = JSON.stringify(a);
  expect(JSON.stringify(project())).toBe(saved);
  command(
    'supersede',
    'whole',
    '--context',
    'workflow',
    '--wording',
    'Unreleased later whole.',
    '--reason',
    'Development moves on.',
  );
  expect(project().concepts.find((c) => c.name === 'whole')?.wording).toBe(
    'Unreleased later whole.',
  );
  expect(JSON.stringify(a)).toBe(saved);
  expect(a.version).toBe('3.2.1');
});

it('workflow/1 — a library caller without delivered documents sees none and creates no journal', () => {
  const installation = join(root, 'home/.cratylus/omp');
  const documents = join(installation, 'delivered/cratylus');
  mkdirSync(documents, { recursive: true });
  writeFileSync(
    join(documents, 'workflow.json'),
    JSON.stringify({
      origin: 'cratylus',
      version: '3.2.1',
      context: 'workflow',
      identity: '01ARZ3NDEKTSV4RRFFQ69G5F00',
      position: 1,
      subject: 'Installed only.',
      relation: '',
      concepts: [],
    }),
  );
  vi.stubEnv('HOME', join(root, 'home'));
  vi.stubEnv('CRATYLUS_INSTALLATION', installation);
  function noDelivery(answer: unknown, journalExists: boolean): void {
    expect(answer).toMatchObject({ contexts: [] });
    expect(journalExists).toBe(false);
  }
  for (const verb of ['design', 'state'])
    noDelivery(command(verb), existsSync(join(root, 'design/journal')));
  // Prove both absence assertions reject the prohibited observations.
  expect(() =>
    noDelivery({ contexts: [{ name: 'cratylus:workflow' }] }, false),
  ).toThrow();
  expect(() => noDelivery({ contexts: [] }, true)).toThrow();
});
