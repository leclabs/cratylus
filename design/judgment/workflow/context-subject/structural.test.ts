// Judgment-only cases. Never imported or named by a package check.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type TemporaryRepository,
  append,
  git,
  query,
  temporaryRepository,
} from '../../../../packages/cli/test/concept-journal/fixture.js';

interface Description {
  id: string;
  at: string;
  subject: string;
  relation: string;
  reason?: string;
  supersedes?: string[];
}
interface ContextHistory {
  context: string;
  versions: Description[];
}

let fixture: TemporaryRepository;
beforeEach(() => {
  fixture = temporaryRepository();
});
afterEach(() => {
  fixture.dispose();
});

describe('context subjects judgment', () => {
  it('Case 1 — two changes retain all three descriptions in order, with each change reason and the first as recorded', () => {
    const { root } = fixture;
    // Recording has no reason; a reason marks a change to an existing context.
    const first = append(
      root,
      'context',
      'workflow',
      '--subject',
      'Initial subject.',
      '--relation',
      'Initial relation.',
    ) as Description;
    const second = append(
      root,
      'context',
      'workflow',
      '--subject',
      'Second subject.',
      '--reason',
      'Expand the subject.',
    ) as Description;
    const third = append(
      root,
      'context',
      'workflow',
      '--relation',
      '',
      '--reason',
      'Remove the former dependency.',
    ) as Description;
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
    const history = query<ContextHistory>(
      root,
      'history',
      '--context',
      'workflow',
    );
    expect(history).toEqual({
      context: 'workflow',
      versions: [
        {
          id: first.id,
          at: first.at,
          subject: 'Initial subject.',
          relation: 'Initial relation.',
          supersedes: [],
        },
        {
          id: second.id,
          at: second.at,
          subject: 'Second subject.',
          relation: 'Initial relation.',
          reason: 'Expand the subject.',
          supersedes: [first.id],
        },
        {
          id: third.id,
          at: third.at,
          subject: 'Second subject.',
          relation: '',
          reason: 'Remove the former dependency.',
          supersedes: [second.id],
        },
      ],
    });
    for (const verb of ['state', 'design']) {
      const current = query(root, verb, '--context', 'workflow');
      expect(current.contexts).toMatchObject([
        {
          name: 'workflow',
          subject: 'Second subject.',
          relation: '',
          competingDescriptions: [],
        },
      ]);
      expect(JSON.stringify(current)).not.toContain('Initial subject.');
      expect(JSON.stringify(current)).not.toContain('Initial relation.');
    }
  });

  it('Case 2 — different subject changes on merged branches compete until one change supersedes both', () => {
    const { root } = fixture;
    const first = append(
      root,
      'context',
      'workflow',
      '--subject',
      'Shared subject.',
      '--relation',
      'Shared relation.',
    ) as Description;
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Shared context');
    git(root, 'switch', '-c', 'left');
    const left = append(
      root,
      'context',
      'workflow',
      '--subject',
      'Left changed subject.',
      '--reason',
      'Left branch expands the subject.',
    ) as Description;
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Left subject change');
    git(root, 'switch', '-c', 'right', 'journal');
    const right = append(
      root,
      'context',
      'workflow',
      '--subject',
      'Right changed subject.',
      '--reason',
      'Right branch narrows the subject.',
    ) as Description;
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Right subject change');
    git(root, 'switch', 'left');
    git(root, 'merge', '--no-edit', 'right');
    expect(git(root, 'ls-files', '--unmerged')).toBe('');
    for (const verb of ['state', 'design']) {
      const current = query(root, verb, '--context', 'workflow');
      expect(current.contexts).toMatchObject([
        {
          name: 'workflow',
          subject: null,
          relation: null,
          competingDescriptions: [
            { subject: 'Left changed subject.', relation: 'Shared relation.' },
            { subject: 'Right changed subject.', relation: 'Shared relation.' },
          ],
        },
      ]);
      expect(JSON.stringify(current)).not.toContain('Shared subject.');
    }
    // The shared relation can carry forward even while the subjects compete.
    const settled = append(
      root,
      'context',
      'workflow',
      '--subject',
      'Settled subject.',
      '--reason',
      'Resolve the two branch changes.',
    ) as Description;
    expect(settled.supersedes).toHaveLength(2);
    expect(settled.supersedes).toEqual(
      expect.arrayContaining([left.id, right.id]),
    );
    for (const verb of ['state', 'design']) {
      expect(query(root, verb).contexts).toMatchObject([
        {
          name: 'workflow',
          subject: 'Settled subject.',
          relation: 'Shared relation.',
          competingDescriptions: [],
        },
      ]);
    }
    expect(
      query<ContextHistory>(root, 'history', '--context', 'workflow'),
    ).toEqual({
      context: 'workflow',
      versions: [
        {
          id: first.id,
          at: first.at,
          subject: 'Shared subject.',
          relation: 'Shared relation.',
          supersedes: [],
        },
        {
          id: left.id,
          at: left.at,
          subject: 'Left changed subject.',
          relation: 'Shared relation.',
          reason: 'Left branch expands the subject.',
          supersedes: [first.id],
        },
        {
          id: right.id,
          at: right.at,
          subject: 'Right changed subject.',
          relation: 'Shared relation.',
          reason: 'Right branch narrows the subject.',
          supersedes: [first.id],
        },
        {
          id: settled.id,
          at: settled.at,
          subject: 'Settled subject.',
          relation: 'Shared relation.',
          reason: 'Resolve the two branch changes.',
          supersedes: settled.supersedes,
        },
      ],
    });
  });
});
