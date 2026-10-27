// Every installation delivers cratylic context design beside intent-based
// delegation, read-only, shown before it in the practice apart from the
// project's own contexts and outside its context map; a write aimed at it is
// refused; a project holding it reads its own. How the architect reads a
// project's record is agent behaviour judged in review.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { query, repositoryRoot } from '../concept-journal/fixture.js';
import {
  type ContextView,
  type Host,
  assertDelivered,
  deliveredPath,
  document,
  expectMeaning,
  expectReleased,
  installed,
  owned,
  putDocument,
  qualified,
  readDocument,
  snapshot,
  success,
  upstream,
  upstreamQualified,
  views,
} from './fixture.js';

let h: Host;
beforeEach(() => {
  h = installed();
});
afterEach(() => h.dispose());

const ccd = 'cratylic context design';
const verbs = ['design', 'state'];

/** Expects `practice` to be exactly the two delivered contexts, cratylic context
 *  design first, each named by its origin and marked delivered and read-only. */
function expectPractice(practice: ContextView[]): void {
  expect(practice.map((c) => c.name)).toEqual([upstreamQualified, qualified]);
  for (const [view, context] of [
    [practice[0], ccd],
    [practice[1], 'intent-based delegation'],
  ] as const)
    expect(view).toMatchObject({
      delivered: { origin: 'cratylus', context },
      readOnly: true,
    });
}

it('the release ships cratylic context design read-only beside intent-based delegation, at its upstream position', () => {
  expectReleased(h, ccd, 0);
  expect(readDocument(h).position).toBe(1);
});

it.each(verbs)(
  '%s in a project with no recorded context shows cratylic context design then intent-based delegation, recording nothing',
  (verb) => {
    const answer = views(h, verb);
    expectPractice(answer.practice);
    assertDelivered(answer.practice[0], verb, readDocument(h, ccd));
    assertDelivered(answer.practice[1], verb, readDocument(h));
    expect(answer.contexts).toEqual([]);
    expect(existsSync(join(h.cwd, 'design/journal'))).toBe(false);
  },
);

it.each(['user', 'project'])(
  'a %s install declining every ruleset still delivers cratylic context design beside intent-based delegation',
  (scope) => {
    success(h.command(['uninstall', '--harness', 'omp', '--home', h.home]));
    expect(existsSync(owned(h))).toBe(false);
    const root = scope === 'user' ? owned(h) : join(h.cwd, '.cratylus/omp');
    success(
      h.command(
        scope === 'user'
          ? [
              'install',
              '--harness',
              'omp',
              '--home',
              h.home,
              '--rules',
              'none',
              '--model-roles',
              'default',
            ]
          : [
              'install',
              '--harness',
              'omp',
              '--scope',
              'project',
              '--rules',
              'none',
            ],
      ),
    );
    const record = JSON.parse(
      readFileSync(join(root, 'installation.json'), 'utf8'),
    );
    expect(record).toMatchObject({ scope });
    expect(record.rules ?? []).toEqual([]);
    for (const context of [ccd, 'intent-based delegation']) {
      const path = deliveredPath(h, context, root);
      expect(existsSync(path), `${context} is delivered under ${root}`).toBe(
        true,
      );
      expect(statSync(path).mode & 0o222).toBe(0);
    }
    for (const verb of verbs) expectPractice(views(h, verb).practice);
  },
);

it.each(verbs)(
  '%s reads cratylic context design first, then intent-based delegation, then the booking context, the practice named apart',
  (verb) => {
    h.seed();
    const answer = h.concepts<{
      practice?: { about: string; contexts: ContextView[] };
      contexts: ContextView[];
    }>(verb);
    const keys = Object.keys(answer);
    expect(keys.indexOf('practice')).toBeGreaterThanOrEqual(0);
    expect(keys.indexOf('practice')).toBeLessThan(keys.indexOf('contexts'));
    expect(answer.practice?.about).toMatch(/read first/);
    expect(answer.practice?.about).toMatch(/not part of this project.s design/);
    expectPractice(answer.practice?.contexts ?? []);
    expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
  },
);

it.each(verbs)(
  '%s keeps cratylic context design and intent-based delegation out of the booking–payments context map',
  (verb) => {
    h.concepts(
      'context',
      'booking',
      '--subject',
      'Seats held for a show.',
      '--relation',
      'Downstream of payments, which settles each booking.',
    );
    h.concepts(
      'context',
      'payments',
      '--subject',
      'Money taken for a booking.',
      '--relation',
      'Upstream of booking.',
    );
    const answer = views(h, verb);
    expect(answer.contexts.map((c) => c.name)).toEqual(['booking', 'payments']);
    expectPractice(answer.practice);
    const map = JSON.stringify(answer.contexts);
    for (const delivered of answer.practice)
      for (const told of [delivered.name, delivered.relation])
        expect(map).not.toContain(told);
    expect(map).not.toContain(ccd);
  },
);

const writes = [
  ['context', upstreamQualified, '--subject', 'Forbidden subject.'],
  [
    'define',
    'refund',
    '--context',
    upstreamQualified,
    '--wording',
    'Forbidden meaning.',
    '--reason',
    'Attempt.',
  ],
  [
    'supersede',
    'term',
    '--context',
    upstreamQualified,
    '--wording',
    'Forbidden version.',
    '--reason',
    'Attempt.',
  ],
  ['retire', 'term', '--context', upstreamQualified, '--reason', 'Attempt.'],
  [
    'decide',
    'forbidden',
    '--context',
    upstreamQualified,
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
  'refuses %s aimed at cratylic context design in a %s journal, changing nothing and copying nothing',
  (_verb, _journal, args, booking) => {
    if (booking) h.seed();
    const before = snapshot(h.cwd);
    const path = deliveredPath(h, ccd);
    expect
      .soft(existsSync(path), 'cratylic context design is delivered')
      .toBe(true);
    const released = existsSync(path) ? readFileSync(path, 'utf8') : null;
    const result = h.command(['concepts', ...args]);
    expect.soft(result.code).toBe(1);
    expect.soft(result.stderr + result.stdout).toMatch(/delivered/i);
    expect.soft(result.stderr + result.stdout).toMatch(/read.only/i);
    expect.soft(snapshot(h.cwd)).toEqual(before);
    expect.soft(existsSync(join(h.cwd, 'design/journal'))).toBe(booking);
    if (released !== null) expect(readFileSync(path, 'utf8')).toBe(released);
    const after = views(h, 'design');
    expect(after.contexts.map((c) => c.name)).toEqual(
      booking ? ['booking'] : [],
    );
    expectPractice(after.practice);
  },
);

it('the correction lands as a new version of booking’s own refund, the delivered practice untouched', () => {
  h.seed();
  h.concepts(
    'define',
    'refund',
    '--context',
    'booking',
    '--wording',
    'Money returned for any reason.',
    '--reason',
    'First.',
  );
  expectPractice(views(h, 'design').practice);
  const before = snapshot(h.cwd);
  const released = readFileSync(deliveredPath(h, ccd), 'utf8');
  h.concepts(
    'supersede',
    'refund',
    '--context',
    'booking',
    '--wording',
    'Money returned for a cancelled booking.',
    '--reason',
    'The record redefined an established term.',
  );
  const after = snapshot(h.cwd);
  for (const [path, bytes] of Object.entries(before))
    expect(after[path]).toBe(bytes);
  expect(Object.keys(after)).toHaveLength(Object.keys(before).length + 1);
  expect(h.concepts('history', 'refund', '--context', 'booking')).toMatchObject(
    {
      versions: [
        expect.objectContaining({ wording: 'Money returned for any reason.' }),
        expect.objectContaining({
          wording: 'Money returned for a cancelled booking.',
        }),
      ],
    },
  );
  expect(readFileSync(deliveredPath(h, ccd), 'utf8')).toBe(released);
  const answer = views(h, 'design');
  expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
  expectPractice(answer.practice);
  assertDelivered(answer.practice[0], 'design', readDocument(h, ccd));
});

/** Records `name` in the project's journal with its own wording of `term`;
 *  returns its identity, the id of the entry recording it. */
function ownContext(name: string): string {
  const { id } = h.concepts<{ id: string }>(
    'context',
    name,
    '--subject',
    `The project’s own ${name} subject.`,
  );
  h.concepts(
    'define',
    'term',
    '--context',
    name,
    '--wording',
    `The project’s own ${name} term.`,
    '--reason',
    'Current in this project.',
  );
  return id;
}

it('a project holding both reads its own copies in the practice place, cratylic context design then intent-based delegation, then the rest in record order', () => {
  // Record order (booking, intent-based delegation, cratylic context design) and name order
  // (booking, cratylic context design, intent-based delegation) each differ from the order shown.
  h.seed();
  const delegationId = ownContext('intent-based delegation');
  const ccdId = ownContext(ccd);
  putDocument(h, { ...document, identity: delegationId });
  putDocument(h, { ...upstream, identity: ccdId });
  const before = snapshot(h.cwd);
  for (const verb of verbs) {
    const answer = views(h, verb);
    expect(answer.practice.map((c) => c.name)).toEqual([
      ccd,
      'intent-based delegation',
    ]);
    expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
    const own = answer.practice.find((c) => c.name === ccd)!;
    expect(own).not.toHaveProperty('delivered');
    expect(own.subject).toBe(`The project’s own ${ccd} subject.`);
    expectMeaning(own, `The project’s own ${ccd} term.`);
    expect(JSON.stringify(answer)).not.toContain(upstream.subject);
    expect(JSON.stringify(answer)).not.toContain(upstream.concepts[0]!.wording);
  }
  expect(snapshot(h.cwd)).toEqual(before);
});

/** Expects a project holding cratylic context design alone to read its own
 *  copy in the delivered one's place, before the delivered intent-based delegation, then its
 *  other contexts. */
function expectHeldAlone(answer: {
  contexts: ContextView[];
  practice: ContextView[];
}): void {
  expect(answer.practice.map((c) => c.name)).toEqual([ccd, qualified]);
  expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
  const own = answer.practice[0]!;
  expect(own).not.toHaveProperty('delivered');
  expectMeaning(own, `The project’s own ${ccd} term.`);
}

it('a project holding cratylic context design alone reads its own copy first, then the delivered intent-based delegation, then its other contexts', () => {
  h.seed();
  const ccdId = ownContext(ccd);
  putDocument(h, { ...upstream, identity: ccdId });
  for (const verb of verbs) {
    const answer = views(h, verb);
    expectHeldAlone(answer);
    // The reader already suppresses by identity, so this holds on today's work:
    // convict each plausible negative with the same assertions.
    const delivered = { ...answer.practice[0]!, name: upstreamQualified };
    expect(() =>
      expectHeldAlone({ ...answer, practice: [delivered, ...answer.practice] }),
    ).toThrow();
    expect(() =>
      expectHeldAlone({ ...answer, practice: [...answer.practice].reverse() }),
    ).toThrow();
    expect(() =>
      expectHeldAlone({
        ...answer,
        practice: answer.practice.map((c) =>
          c.name === ccd ? { ...c, concepts: upstream.concepts } : c,
        ),
      }),
    ).toThrow();
    expect(() =>
      expectHeldAlone({
        ...answer,
        practice: answer.practice.map((c) =>
          c.name === ccd ? { ...c, delivered: upstream } : c,
        ),
      }),
    ).toThrow();
  }
});

it('cratylus’s own repository reads its cratylic context design, then intent-based delegation, in the practice place, then its other contexts', () => {
  // Read with no installation, the repository's contexts in record order.
  const recorded = query(repositoryRoot, 'design').contexts.map((c) => c.name);
  expect(recorded).toContain(ccd);
  expect(recorded).toContain('intent-based delegation');
  // The release under test, whatever installation lies above the repository.
  h.env.CRATYLUS_INSTALLATION = owned(h);
  const result = h.command(['concepts', 'design'], repositoryRoot);
  expect(result.code, result.stderr).toBe(0);
  const answer = JSON.parse(result.stdout);
  expect(answer.practice.contexts.map((c: { name: string }) => c.name)).toEqual(
    [ccd, 'intent-based delegation'],
  );
  expect(answer.contexts.map((c: { name: string }) => c.name)).toEqual(
    recorded.filter(
      (name) => name !== ccd && name !== 'intent-based delegation',
    ),
  );
});
