import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  type Design,
  query,
  repositoryRoot,
} from '../concept-journal/fixture.js';
import {
  type Host,
  assertDelivered,
  deliveredPath,
  document,
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

it('delivery/1, delivery/2 — the built release installs its complete source design read-only with provenance', () => {
  const path = deliveredPath(h);
  expect(
    existsSync(path),
    'the release ships delivered/cratylus/workflow.json under its owned root',
  ).toBe(true);
  const actual = readDocument(h);
  const source = query<Design>(
    repositoryRoot,
    'design',
    '--context',
    'workflow',
  ).contexts[0]!;
  const entries = Object.values(snapshot(repositoryRoot)).map((bytes) =>
    JSON.parse(Buffer.from(bytes, 'base64').toString()),
  );
  const first = entries
    .filter((entry) => entry.kind === 'context' && entry.name === 'workflow')
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  const version = success(h.command(['--version'])).trim();
  expect({
    ...actual,
    concepts: [...actual.concepts].sort((a, b) => a.name.localeCompare(b.name)),
  }).toEqual({
    origin: 'cratylus',
    version,
    context: 'workflow',
    identity: first.id,
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
  expect(existsSync(join(owned(h), 'agents/architect.md'))).toBe(true);
  expect(snapshot(h.cwd)).toEqual({});
  assertDelivered(views(h, 'design')[0], 'design', actual);
});

it('delivery/3 — upgrading replaces an earlier release completely without touching booking', () => {
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
    views(h, 'design').find((c) => c.name === qualified),
    'design',
    actual,
  );
});

it('delivery/4 — later development journal wording does not mutate the installed release', () => {
  expect(
    existsSync(deliveredPath(h)),
    'an installed projection exists independently of the project journal',
  ).toBe(true);
  const before = readFileSync(deliveredPath(h), 'utf8');
  const release = readDocument(h);
  h.concepts('context', 'workflow', '--subject', 'Unreleased local workflow.');
  h.concepts(
    'define',
    'practice',
    '--context',
    'workflow',
    '--wording',
    'Unreleased development practice.',
    '--reason',
    'Not released.',
  );
  expect(readFileSync(deliveredPath(h), 'utf8')).toBe(before);
  assertDelivered(
    views(h, 'design').find((c) => c.name === qualified),
    'design',
    release,
  );
  expect(readDocument(h).version).toBe(release.version);
});

it('delivery/5 — uninstall removes delivered material with the root and leaves the project journal untouched', () => {
  h.seed();
  const before = snapshot(h.cwd);
  // Isolate removal from production of the projection: the fixture supplies an installed document.
  putDocument(h);
  expect.soft(views(h, 'design').map((c) => c.name)).toContain(qualified);
  success(h.command(['uninstall', '--harness', 'omp', '--home', h.home]));
  function removed(
    rootRemains: boolean,
    documentRemains: boolean,
    journal: Record<string, string>,
  ): void {
    expect(rootRemains, 'the owned root leaves').toBe(false);
    expect(documentRemains, 'the delivered document leaves').toBe(false);
    expect(journal, 'the project journal has no delivered residue').toEqual(
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
  expect(views(h, 'design').map((c) => c.name)).toEqual(['booking']);
  for (const bytes of Object.values(snapshot(h.cwd)))
    expect(Buffer.from(bytes, 'base64').toString()).not.toContain(
      document.subject,
    );
});
