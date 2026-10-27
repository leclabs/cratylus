import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  type Host,
  assertDelivered,
  deliveredPath,
  document,
  expectReleased,
  installed,
  owned,
  putDocument,
  qualified,
  readDocument,
  snapshot,
  success,
  views,
} from './fixture.js';

let h: Host;
beforeEach(() => {
  h = installed();
});
afterEach(() => h.dispose());

it('the built release installs its complete source design read-only with provenance', () => {
  const actual = expectReleased(h, 'intent-based delegation', 1);
  expect(existsSync(join(owned(h), 'agents/architect.md'))).toBe(true);
  expect(snapshot(h.cwd)).toEqual({});
  assertDelivered(
    views(h, 'design').practice.find((c) => c.name === qualified),
    'design',
    actual,
  );
});

it('upgrading replaces an earlier release completely without touching booking', () => {
  h.seed();
  const before = snapshot(h.cwd);
  // A is an older installed release; B is the packed release under test.
  const earlier = {
    ...document,
    version: '0.0.1',
    subject: 'Only release A says this.',
    concepts: [
      {
        name: 'removed-in-B',
        wording: 'A-only obsolete practice.',
        builtFrom: [],
      },
    ],
  };
  putDocument(h, earlier);
  success(
    h.command([
      'install',
      '--harness',
      'omp',
      '--home',
      h.home,
      '--all',
      '--model-roles',
      'default',
    ]),
  );
  expect(
    existsSync(deliveredPath(h)),
    'replacement root contains release B projection',
  ).toBe(true);
  const actual = readDocument(h);
  expect(actual.version).toBe(success(h.command(['--version'])).trim());
  expect(actual.subject).not.toBe(earlier.subject);
  expect(JSON.stringify(actual)).not.toContain('A-only');
  expect(actual.concepts.map((c) => c.name)).not.toContain('removed-in-B');
  expect(statSync(deliveredPath(h)).mode & 0o222).toBe(0);
  expect(snapshot(h.cwd)).toEqual(before);
  assertDelivered(
    views(h, 'design').practice.find((c) => c.name === qualified),
    'design',
    actual,
  );
});

it('later development journal wording does not mutate the installed release', () => {
  expect(
    existsSync(deliveredPath(h)),
    'an installed projection exists independently of the project journal',
  ).toBe(true);
  const before = readFileSync(deliveredPath(h), 'utf8');
  const release = readDocument(h);
  h.concepts(
    'context',
    'intent-based delegation',
    '--subject',
    'Unreleased local intent-based delegation.',
  );
  h.concepts(
    'define',
    'practice',
    '--context',
    'intent-based delegation',
    '--wording',
    'Unreleased development practice.',
    '--reason',
    'Not released.',
  );
  expect(readFileSync(deliveredPath(h), 'utf8')).toBe(before);
  assertDelivered(
    views(h, 'design').practice.find((c) => c.name === qualified),
    'design',
    release,
  );
  expect(readDocument(h).version).toBe(release.version);
});

it('uninstall removes delivered material with the root and leaves the project journal untouched', () => {
  h.seed();
  const before = snapshot(h.cwd);
  // Isolate removal from production of the projection: the fixture supplies an installed document.
  putDocument(h);
  expect
    .soft(views(h, 'design').practice.map((c) => c.name))
    .toContain(qualified);
  success(h.command(['uninstall', '--harness', 'omp', '--home', h.home]));
  function removed(
    rootRemains: boolean,
    documentRemains: boolean,
    journal: Record<string, string>,
  ): void {
    expect(rootRemains, 'the owned root leaves').toBe(false);
    expect(documentRemains, 'the delivered document leaves').toBe(false);
    expect(journal, 'the project journal keeps nothing delivered').toEqual(
      before,
    );
  }
  removed(existsSync(owned(h)), existsSync(deliveredPath(h)), snapshot(h.cwd));
  // Existing whole-root removal already satisfies this part: convict each
  // plausible negative with exactly the assertions used on the real command.
  expect(() => removed(true, false, before)).toThrow();
  expect(() => removed(false, true, before)).toThrow();
  expect(() =>
    removed(false, false, {
      ...before,
      'leaked.json': JSON.stringify(document),
    }),
  ).toThrow();
  const after = views(h, 'design');
  expect(after.contexts.map((c) => c.name)).toEqual(['booking']);
  expect(after.practice).toEqual([]);
  for (const bytes of Object.values(snapshot(h.cwd)))
    expect(Buffer.from(bytes, 'base64').toString()).not.toContain(
      document.subject,
    );
});
