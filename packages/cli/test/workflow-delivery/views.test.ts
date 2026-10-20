import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { temporaryRepository } from '../concept-journal/fixture.js';
import {
  type Host,
  assertDelivered,
  assertSourceView,
  deliveredPath,
  document,
  expectMeaning,
  git,
  installed,
  ownSource,
  putDocument,
  qualified,
  snapshot,
  views,
} from './fixture.js';

let h: Host;
beforeEach(() => {
  h = installed();
  putDocument(h);
});
afterEach(() => h.dispose());

it.each(['design', 'state'])(
  'workflow/1 — %s shows the release apart from the project, in a journal-less project without writing',
  (verb) => {
    const answer = views(h, verb);
    expect(existsSync(join(h.cwd, 'design/journal'))).toBe(false);
    expect(answer.contexts).toEqual([]);
    expect(answer.practice.filter((c) => c.name === qualified)).toHaveLength(1);
    assertDelivered(
      answer.practice.find((c) => c.name === qualified),
      verb,
    );
    const named = views(h, verb, '--context', qualified);
    expect(named.contexts).toEqual([]);
    expect(named.practice.map((c) => c.name)).toEqual([qualified]);
    assertDelivered(named.practice[0], verb);
  },
);

it.each(['design', 'state'])(
  'workflow/2 — %s keeps unrelated same-name contexts separate, the release apart from the project',
  (verb) => {
    h.seed();
    h.concepts('context', 'workflow', '--subject', 'A project workflow.');
    h.concepts(
      'define',
      'practice',
      '--context',
      'workflow',
      '--wording',
      'A project-only practice.',
      '--reason',
      'Local.',
    );
    const before = snapshot(h.cwd);
    const answer = views(h, verb);
    expect(answer.contexts.map((c) => c.name).sort()).toEqual([
      'booking',
      'workflow',
    ]);
    const local = answer.contexts.find((c) => c.name === 'workflow')!;
    expectMeaning(local, 'A project-only practice.');
    expect(answer.practice.filter((c) => c.name === qualified)).toHaveLength(1);
    assertDelivered(
      answer.practice.find((c) => c.name === qualified),
      verb,
    );
    expect(snapshot(h.cwd)).toEqual(before);
  },
);

it.each(['workflow', 'branch-practice'])(
  'workflow/3 — identity suppresses the release under the project name %s',
  (name) => {
    // The baseline binds inclusion too: silently ignoring all delivery is not suppression.
    expect
      .soft(views(h, 'design').practice.map((c) => c.name))
      .toContain(qualified);
    ownSource(h, name);
    const before = snapshot(h.cwd);
    for (const verb of ['design', 'state']) {
      const { contexts: answer, practice } = views(h, verb);
      // Held by the project, it is part of its design: not in the practice apart.
      expect(practice.map((c) => c.name)).not.toContain(qualified);
      assertSourceView(answer, name);
      // Suppression already holds vacuously on a reader that ignores all delivery.
      // Prove the same assertions reject a duplicate and a delivered override.
      const duplicate = {
        ...answer[0]!,
        name: qualified,
        delivered: document,
      };
      expect(() => assertSourceView([...answer, duplicate], name)).toThrow();
      expect(() =>
        assertSourceView([{ ...answer[0]!, delivered: document }], name),
      ).toThrow();
      expect(() =>
        assertSourceView(
          [{ ...answer[0]!, concepts: document.concepts }],
          name,
        ),
      ).toThrow();
    }
    expect(snapshot(h.cwd)).toEqual(before);
  },
);

const writes = [
  ['context', qualified, '--subject', 'Forbidden subject.'],
  [
    'define',
    'new',
    '--context',
    qualified,
    '--wording',
    'Forbidden meaning.',
    '--reason',
    'Attempt.',
  ],
  [
    'supersede',
    'practice',
    '--context',
    qualified,
    '--wording',
    'Forbidden version.',
    '--reason',
    'Attempt.',
  ],
  ['retire', 'practice', '--context', qualified, '--reason', 'Attempt.'],
  [
    'decide',
    'forbidden',
    '--context',
    qualified,
    '--title',
    'Forbidden decision',
    '--situation',
    'Attempt.',
    '--decision',
    'Attempt.',
    '--consequences',
    'Attempt.',
  ],
];
it.each(
  writes.flatMap((args) =>
    [false, true].map(
      (booking) =>
        [args[0], booking ? 'booking' : 'empty', args, booking] as const,
    ),
  ),
)(
  'workflow/4 — refuses %s on a delivered context in a %s journal without a substitute',
  (_verb, _journal, args, booking) => {
    if (booking) h.seed();
    const before = snapshot(h.cwd);
    const released = readFileSync(deliveredPath(h), 'utf8');
    const result = h.command(['concepts', ...args]);
    expect.soft(result.code).toBe(1);
    expect.soft(result.stderr + result.stdout).toMatch(/delivered/i);
    expect.soft(result.stderr + result.stdout).toMatch(/read.only/i);
    expect.soft(snapshot(h.cwd)).toEqual(before);
    expect.soft(existsSync(join(h.cwd, 'design/journal'))).toBe(booking);
    expect(readFileSync(deliveredPath(h), 'utf8')).toBe(released);
  },
);

it('workflow/5 — appends to the unrelated project workflow while preserving delivery and provenance', () => {
  h.concepts('context', 'workflow', '--subject', 'Project workflow.');
  h.concepts(
    'define',
    'practice',
    '--context',
    'workflow',
    '--wording',
    'Earlier local practice.',
    '--reason',
    'Initial.',
  );
  const before = snapshot(h.cwd);
  const release = readFileSync(deliveredPath(h), 'utf8');
  h.concepts(
    'supersede',
    'practice',
    '--context',
    'workflow',
    '--wording',
    'Current local practice.',
    '--reason',
    'Local reason.',
  );
  const after = snapshot(h.cwd);
  for (const [path, bytes] of Object.entries(before))
    expect(after[path]).toBe(bytes);
  expect(Object.keys(after)).toHaveLength(Object.keys(before).length + 1);
  expect(
    h.concepts('history', 'practice', '--context', 'workflow'),
  ).toMatchObject({
    versions: [
      expect.objectContaining({ wording: 'Earlier local practice.' }),
      expect.objectContaining({
        wording: 'Current local practice.',
        reason: 'Local reason.',
      }),
    ],
  });
  const answer = views(h, 'design');
  expect(answer.contexts.find((c) => c.name === 'workflow')).toMatchObject({
    concepts: [expect.objectContaining({ wording: 'Current local practice.' })],
  });
  assertDelivered(
    answer.practice.find((c) => c.name === qualified),
    'design',
  );
  expect(readFileSync(deliveredPath(h), 'utf8')).toBe(release);
});

it('workflow/6 — delivered history has only a current meaning and no invented version or decision', () => {
  h.seed();
  const before = snapshot(h.cwd);
  const concept = h.command([
    'concepts',
    'history',
    'practice',
    '--context',
    qualified,
  ]);
  expect.soft(concept.code, concept.stderr).toBe(0);
  if (concept.code === 0) {
    const answer = JSON.parse(concept.stdout);
    expect(answer.versions).toEqual([]);
    expect(JSON.stringify(answer.current)).toContain(
      document.concepts[0]!.wording,
    );
    expect(JSON.stringify(answer.current)).toContain('record');
  }
  const context = h.command(['concepts', 'history', '--context', qualified]);
  expect.soft(context.code, context.stderr).toBe(0);
  if (context.code === 0) {
    const answer = JSON.parse(context.stdout);
    expect(answer.versions).toEqual([]);
    expect(JSON.stringify(answer.current)).toContain(document.subject);
    expect(JSON.stringify(answer.current)).toContain(
      document.concepts[0]!.wording,
    );
  }
  expect(h.concepts('decisions', '--context', qualified)).toEqual({
    decisions: [],
  });
  expect(h.concepts('decisions')).toMatchObject({ decisions: [] });
  expect(snapshot(h.cwd)).toEqual(before);
});

it('workflow/9 — suppression follows each checked-out branch rather than a prior read', () => {
  h.seed();
  git(h.cwd, 'add', 'design');
  git(h.cwd, 'commit', '-m', 'Booking only');
  git(h.cwd, 'switch', '-c', 'source');
  ownSource(h);
  git(h.cwd, 'add', 'design');
  git(h.cwd, 'commit', '-m', 'Source workflow');
  expect(
    views(h, 'design')
      .contexts.map((c) => c.name)
      .sort(),
  ).toEqual(['booking', 'workflow']);
  expect(views(h, 'design').practice.map((c) => c.name)).not.toContain(
    qualified,
  );
  git(h.cwd, 'switch', 'journal');
  expect(views(h, 'design').contexts.map((c) => c.name)).toEqual(['booking']);
  assertDelivered(
    views(h, 'design').practice.find((c) => c.name === qualified),
    'design',
  );
  git(h.cwd, 'switch', 'source');
  expect(
    views(h, 'design')
      .contexts.map((c) => c.name)
      .sort(),
  ).toEqual(['booking', 'workflow']);
  expect(views(h, 'design').practice.map((c) => c.name)).not.toContain(
    qualified,
  );
});

it('workflow/10 — the first project context records only itself and retains the delivered view', () => {
  views(h, 'state');
  h.seed();
  const journal = snapshot(h.cwd);
  expect(Object.keys(journal)).toHaveLength(1);
  const entry = JSON.parse(
    Buffer.from(Object.values(journal)[0]!, 'base64').toString(),
  );
  expect(entry).toMatchObject({ kind: 'context', name: 'booking' });
  expect(entry).not.toHaveProperty('delivered');
  const answer = views(h, 'design');
  expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
  expect(answer.practice.filter((c) => c.name === qualified)).toHaveLength(1);
  assertDelivered(
    answer.practice.find((c) => c.name === qualified),
    'design',
  );
  expect(snapshot(h.cwd)).toEqual(journal);
});

it('delivery/2 — one installation supplies multiple projects', () => {
  const other = temporaryRepository();
  try {
    const result = h.command(['concepts', 'design'], other.root);
    expect(result.code, result.stderr).toBe(0);
    assertDelivered(
      JSON.parse(result.stdout).practice.contexts.find(
        (c: { name: string }) => c.name === qualified,
      ),
      'design',
    );
    expect(snapshot(other.root)).toEqual({});
  } finally {
    other.dispose();
  }
});

it('delivery/2 — explicit installation selection wins over other roots in HOME', () => {
  const selected = join(h.home, '.cratylus/other');
  mkdirSync(selected, { recursive: true });
  const alternate = {
    ...document,
    version: '99.1.0',
    subject: 'Explicitly selected installation.',
  };
  putDocument(h, alternate, selected);
  h.env.CRATYLUS_INSTALLATION = selected;
  assertDelivered(views(h, 'design').practice[0], 'design', alternate);
});
