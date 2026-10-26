import { afterEach, beforeEach, expect, it } from 'vitest';
import { snapshot } from '../../concept-journal/fixture.js';
import {
  type OverviewFixture,
  command,
  concept,
  fixture,
  git,
  meanings,
  open,
  relation,
  seed,
  state,
  subject,
} from './fixture.js';
let f: OverviewFixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => f.dispose());

it('intent-based delegation/2 — the design state gives subject and relation, then each live concept as a line', () => {
  seed(f);
  const answer = state(f);
  expect(answer, 'recorded subject, relation and concepts alone').toEqual({
    name: 'film-production',
    subject,
    relation,
    concepts: [
      `take ≜ ${meanings.take}`,
      `shoot ≜ ${meanings.shoot}`,
      `production ≜ ${meanings.production}`,
    ],
    competing: [],
  });
  expect(open(f), 'its decisions are read apart').toEqual(['colour']);
});

it('intent-based delegation/3 — the next design state reflects supersession, and acceptance, without rewriting', () => {
  seed(f);
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
  const journal = snapshot(f.root);
  const after = state(f);
  expect(after.concepts, 'reflects the new meaning').toContain(
    'take ≜ One continuous performance, including its sound.',
  );
  expect(
    after.concepts.join('\n'),
    'never repeats superseded meaning as current',
  ).not.toContain(meanings.take);
  expect(open(f), 'never settled decision as open').toEqual([]);
  expect(snapshot(f.root), 'computed without rewriting the journal').toEqual(
    journal,
  );
  expect(state(f), 'a subsequent query computes the same state').toEqual(after);
});

it('intent-based delegation/8 — a branch journal stays local and lands with merge', () => {
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
  const feature = state(f);
  expect(open(f), 'feature shows acceptance').toEqual([]);
  git(f.root, 'add', 'design');
  git(f.root, 'commit', '-m', 'Film records');
  git(f.root, 'switch', 'journal');
  expect(
    snapshot(f.root),
    'the shared checkout does not claim the feature journal',
  ).toEqual(common);
  expect(open(f), 'the shared checkout does not claim the acceptance').toEqual([
    'colour',
  ]);
  expect(state(f).concepts).toContain(`take ≜ ${meanings.take}`);
  git(f.root, 'merge', '--no-edit', 'feature/film');
  expect(state(f), 'entries land with the work').toEqual(feature);
  expect(open(f)).toEqual([]);
});

it('intent-based delegation/16 — feature concepts, decisions and acceptances integrate in an ordinary checkout without a worktree', () => {
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
