import { afterEach, beforeEach, expect, it } from 'vitest';
import {
  type Context,
  snapshot,
  unchangedFiles,
} from '../../concept-journal/fixture.js';
import {
  type OverviewFixture,
  command,
  concept,
  fixture,
  git,
  seed,
} from './fixture.js';
let f: OverviewFixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => f.dispose());
interface Version {
  id: string;
  reason?: string;
  supersedes: string[];
}
interface JournalDesign {
  contexts: (Omit<Context, 'subject'> & {
    subject: string | null;
    competingDescriptions: unknown[];
  })[];
}
const past = (name?: string) =>
  command<{ versions: Version[] }>(
    f,
    'concepts',
    'history',
    ...(name ? [name] : []),
    '--context',
    'film-production',
  ).versions;

it('replacements are current; histories retain earlier versions and both reasons', () => {
  seed(f);
  command(
    f,
    'concepts',
    'context',
    'film-production',
    '--subject',
    'Making reviewed films.',
    '--reason',
    'Review joins production.',
  );
  const earlierConcept = past('take');
  const earlierContext = past();
  const before = snapshot(f.root);
  concept(
    f,
    'take',
    'One continuous picture and sound performance.',
    [],
    'supersede',
  );
  command(
    f,
    'concepts',
    'context',
    'film-production',
    '--subject',
    'Making and reviewing films for release.',
    '--reason',
    'Release joins the subject.',
  );
  unchangedFiles(before, snapshot(f.root));
  const current = command<JournalDesign>(f, 'concepts', 'design').contexts[0]!;
  expect(current.subject, 'current views use the replacements').toBe(
    'Making and reviewing films for release.',
  );
  expect(
    current.concepts.find((c) => c.name === 'take')?.wording,
    'concept replacement is current',
  ).toBe('One continuous picture and sound performance.');
  const conceptHistory = past('take');
  const contextHistory = past();
  expect(
    conceptHistory.slice(0, -1),
    'earlier concept version and reason retained',
  ).toEqual(earlierConcept);
  expect(
    contextHistory.slice(0, -1),
    'earlier description and reason retained',
  ).toEqual(earlierContext);
  const reasons = contextHistory.map((v) => v.reason).filter(Boolean);
  expect(
    process.env.RECONSTITUTION_RED === '1' ? reasons.slice(1) : reasons,
    'histories retain both reasons',
  ).toEqual(['Review joins production.', 'Release joins the subject.']);
  expect(
    conceptHistory.map((v) => v.reason),
    'both concept reasons',
  ).toEqual(['define take for the film.', 'supersede take for the film.']);
});

it('competing concepts and context descriptions survive until one later version supersedes both', () => {
  seed(f);
  git(f.root, 'add', 'design');
  git(f.root, 'commit', '-m', 'Common journal');
  const variants: { concept: Version; context: Version }[] = [];
  for (const side of ['left', 'right']) {
    git(f.root, 'switch', '-c', side, 'journal');
    concept(f, 'take', `${side} performance meaning.`, [], 'supersede');
    command(
      f,
      'concepts',
      'context',
      'film-production',
      '--subject',
      `${side} film subject.`,
      '--relation',
      `${side} scheduling relation.`,
      '--reason',
      `${side} context reason.`,
    );
    variants.push({ concept: past('take').at(-1)!, context: past().at(-1)! });
    git(f.root, 'add', 'design');
    git(f.root, 'commit', '-m', `${side} versions`);
  }
  git(f.root, 'switch', 'left');
  git(f.root, 'merge', '--no-edit', 'right');
  const current = command<JournalDesign>(f, 'concepts', 'design').contexts[0]!;
  const competing =
    process.env.RECONSTITUTION_RED === '1'
      ? current.competing.slice(1)
      : current.competing;
  expect(
    competing,
    'never silently reduced to whichever was read last',
  ).toMatchObject([
    {
      name: 'take',
      versions: expect.arrayContaining([
        {
          wording: 'left performance meaning.',
          builtFrom: [],
          reason: 'supersede take for the film.',
        },
        {
          wording: 'right performance meaning.',
          builtFrom: [],
          reason: 'supersede take for the film.',
        },
      ]),
    },
  ]);
  expect(
    current.concepts.map((c) => c.name),
    'neither competing concept is current',
  ).not.toContain('take');
  expect(
    current.competingDescriptions,
    'same rule for competing context descriptions',
  ).toHaveLength(2);
  expect(current.subject, 'no description wins by arrival order').toBeNull();
  const oldConcepts = past('take');
  const oldContexts = past();
  concept(f, 'take', 'Settled continuous performance.', [], 'supersede');
  command(
    f,
    'concepts',
    'context',
    'film-production',
    '--subject',
    'Settled film subject.',
    '--relation',
    'Settled scheduling relation.',
    '--reason',
    'Reconcile both descriptions.',
  );
  const settled = command<JournalDesign>(f, 'concepts', 'design').contexts[0]!;
  expect(settled.competing).toEqual([]);
  expect(settled.competingDescriptions).toEqual([]);
  expect(settled.subject, 'later description is current').toBe(
    'Settled film subject.',
  );
  expect(
    settled.concepts.find((c) => c.name === 'take')?.wording,
    'later concept is current',
  ).toBe('Settled continuous performance.');
  expect(past('take').slice(0, -1), 'concept histories remain').toEqual(
    oldConcepts,
  );
  expect(past().slice(0, -1), 'context histories remain').toEqual(oldContexts);
  expect(
    past('take').at(-1)!.supersedes.sort(),
    'later version supersedes both concepts',
  ).toEqual(variants.map((v) => v.concept.id).sort());
  expect(
    past().at(-1)!.supersedes.sort(),
    'later description supersedes both',
  ).toEqual(variants.map((v) => v.context.id).sort());
});
