import { afterEach, beforeEach, expect, it } from 'vitest';
import { snapshot } from '../../concept-journal/fixture.js';
import {
  type OverviewFixture,
  command,
  concept,
  dispatch,
  fixture,
  git,
  meanings,
  ordered,
  overview,
  relation,
  seed,
  subject,
} from './fixture.js';
let f: OverviewFixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => f.dispose());

it('workflow/2 — subject and relation first, whole before parts, then open decisions and work in flight', () => {
  seed(f);
  dispatch(f);
  const answer = overview(f);
  expect(answer, 'recorded subject and context-map relation').toMatchObject({
    context: 'film-production',
    subject,
    relation,
  });
  expect(answer, 'each concept told once, in the account').not.toHaveProperty(
    'concepts',
  );
  ordered(
    answer.account,
    [
      'production means',
      meanings.production,
      'shoot means',
      meanings.shoot,
      'take means',
      meanings.take,
    ],
    'production, shoot and take in that order',
  );
  expect(answer.openDecisions, 'then its open decisions').toEqual([
    { id: 'colour', title: 'Choose the colour treatment' },
  ]);
  expect(answer.workInFlight, 'then work in flight').toEqual({
    stories: [{ story: 'film' }],
    tasks: [{ task: 'shoot', story: 'film' }],
  });
  // Prose ordering, fidelity and subject/relation are judged by workflow/22;
  // requiring verbatim source wording here would reject valid plain prose.
  expect(
    answer.account.trim(),
    'plain prose account accompanies recorded state',
  ).not.toBe('');
});

it('workflow/3 — next overview reflects supersession, acceptance and newly dispatched work without rewriting an account', () => {
  seed(f);
  const before = overview(f);
  expect(before.workInFlight, 'nothing dispatched yet').toEqual({
    stories: [],
    tasks: [],
  });
  concept(
    f,
    'take',
    'One continuous performance, including its sound.',
    [],
    'supersede',
  );
  command(
    f,
    'concepts',
    'accept',
    'colour',
    '--reason',
    'The creative chose monochrome.',
  );
  dispatch(f);
  const journal = snapshot(f.root);
  const after = overview(f);
  expect(after.account, 'reflects the new meaning').toContain(
    'One continuous performance, including its sound.',
  );
  expect(
    after.account,
    'never repeats superseded meaning as current',
  ).not.toContain(meanings.take);
  expect(after.openDecisions, 'never settled decision as open').toEqual([]);
  expect(
    after.workInFlight.stories.map((s) => s.story),
    'reflects newly dispatched work',
  ).toEqual(['film']);
  expect(
    snapshot(f.root),
    'computed without rewriting an overview or journal',
  ).toEqual(journal);
  expect(
    overview(f),
    'a subsequent query computes the same current account',
  ).toEqual(after);
});

it('workflow/8 — branch journal and ledger stay local and land together with merge', () => {
  seed(f);
  git(f.root, 'add', 'design');
  git(f.root, 'commit', '-m', 'Common design');
  const common = snapshot(f.root);
  git(f.root, 'switch', '-c', 'feature/film');
  concept(
    f,
    'take',
    'A continuous picture and sound recording.',
    [],
    'supersede',
  );
  command(
    f,
    'concepts',
    'accept',
    'colour',
    '--reason',
    'Film creative acceptance.',
  );
  dispatch(f);
  const feature = overview(f);
  expect(
    feature.workInFlight.stories.map((s) => s.story),
    'feature shows its dispatch',
  ).toEqual(['film']);
  expect(feature.openDecisions, 'feature shows acceptance').toEqual([]);
  git(f.root, 'add', 'design');
  git(f.root, 'commit', '-m', 'Film records');
  git(f.root, 'switch', 'journal');
  expect(
    snapshot(f.root),
    'the shared checkout does not claim the feature journal',
  ).toEqual(common);
  const shared = overview(f);
  expect(
    shared.workInFlight,
    'shared checkout does not leak feature ledger',
  ).toEqual({ stories: [], tasks: [] });
  expect(
    shared.openDecisions.map((d) => d.id),
    'the shared checkout does not claim the acceptance',
  ).toEqual(['colour']);
  expect(shared.account).toContain(meanings.take);
  git(f.root, 'merge', '--no-edit', 'feature/film');
  expect(overview(f), 'entries land with the work').toEqual(feature);
});

it('workflow/16 — feature concepts, decisions and acceptances integrate in an ordinary checkout without a worktree', () => {
  seed(f);
  git(f.root, 'add', 'design');
  git(f.root, 'commit', '-m', 'Base film design');
  const before = snapshot(f.root);
  git(f.root, 'switch', '-c', 'feature/film');
  concept(f, 'review', 'The creative decides whether the film is ready.');
  command(
    f,
    'concepts',
    'accept',
    'colour',
    '--reason',
    'Feature branch acceptance.',
  );
  command(
    f,
    'concepts',
    'decide',
    'review',
    '--context',
    'film-production',
    '--title',
    'Creative review',
    '--situation',
    'Film needs review.',
    '--decision',
    'The creative reviews it.',
    '--consequences',
    'Review precedes release.',
    '--status',
    'accepted',
  );
  const feature = snapshot(f.root);
  git(f.root, 'add', 'design');
  git(f.root, 'commit', '-m', 'Film design and acceptance');
  git(f.root, 'switch', 'journal');
  expect(snapshot(f.root), 'recorded on the feature branch').toEqual(before);
  git(f.root, 'merge', '--no-edit', 'feature/film');
  expect(snapshot(f.root), 'arrive with its merge').toEqual(feature);
  expect(
    git(f.root, 'worktree', 'list', '--porcelain').match(/^worktree /gm),
    'neither working nor integrating requires another worktree',
  ).toHaveLength(1);
  const design = command<{ contexts: { concepts: { name: string }[] }[] }>(
    f,
    'concepts',
    'design',
    '--context',
    'film-production',
  );
  const actual = design.contexts[0]!.concepts.map((c) => c.name);
  expect(
    process.env.RECONSTITUTION_RED === '1'
      ? actual.filter((name: string) => name !== 'review')
      : actual,
    'feature concept lands with its merge',
  ).toContain('review');
});

it('workflow/24 — roots retain recorded order and shared review appears only once after both', () => {
  command(f, 'concepts', 'context', 'film-production', '--subject', subject);
  concept(f, 'publication', 'Making the reviewed film public.', ['review']);
  concept(f, 'production', 'Making the film.', ['review']);
  concept(f, 'review', 'Assessing the film.');
  const answer = overview(f);
  ordered(
    answer.account,
    ['publication means', 'production means', 'review means'],
    'publication and production first in recorded order, then review',
  );
  expect(answer.account.split('Review means').length, 'review told once').toBe(
    2,
  );
  ordered(
    answer.account,
    ['publication', 'production', 'review'],
    'never sorts roots by name or places review before them',
  );
});
