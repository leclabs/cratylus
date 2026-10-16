// Binds design/examples/workflow/context-subject.md through the CLI only.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type TemporaryRepository,
  append,
  git,
  query,
  refuse,
  runConcepts,
  snapshot,
  temporaryRepository,
} from '../concept-journal/fixture.js';

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

function record(
  subject = 'Original subject.',
  relation = 'Original relation.',
): Description {
  const entry = append(
    fixture.root,
    'context',
    'workflow',
    '--subject',
    subject,
    '--relation',
    relation,
  ) as Description;
  expect(entry).toMatchObject({ subject, relation });
  expect(entry).not.toHaveProperty('reason');
  return entry;
}
function history(): ContextHistory {
  return query<ContextHistory>(
    fixture.root,
    'history',
    '--context',
    'workflow',
  );
}
function version(entry: Description, supersedes: string[] = []): Description {
  return {
    id: entry.id,
    at: entry.at,
    subject: entry.subject,
    relation: entry.relation,
    ...(entry.reason === undefined ? {} : { reason: entry.reason }),
    supersedes,
  };
}
function current(
  subject: string,
  relation: string,
  absent: string[] = [],
): void {
  for (const verb of ['state', 'design']) {
    const result = query(fixture.root, verb, '--context', 'workflow');
    expect(result.contexts).toMatchObject([
      { name: 'workflow', subject, relation },
    ]);
    // The design state lists competing descriptions only when any compete.
    if (verb === 'design')
      expect(result.contexts[0]).toHaveProperty('competingDescriptions', []);
    else expect(result.contexts[0]).not.toHaveProperty('competingDescriptions');
    expect(result.contexts).toHaveLength(1);
    for (const earlier of absent)
      expect(JSON.stringify(result)).not.toContain(earlier);
  }
}

describe('context subjects', () => {
  it('Example 1 — changing the subject keeps the relation and both descriptions in history', () => {
    const first = record();
    const changed = append(
      fixture.root,
      'context',
      'workflow',
      '--subject',
      'Revised subject.',
      '--reason',
      'The subject now includes delivery.',
    ) as Description;
    expect(changed).toMatchObject({
      subject: 'Revised subject.',
      relation: 'Original relation.',
      reason: 'The subject now includes delivery.',
      supersedes: [first.id],
    });
    current('Revised subject.', 'Original relation.', ['Original subject.']);
    expect(history()).toEqual({
      context: 'workflow',
      versions: [version(first), version(changed, [first.id])],
    });
    expect(history().versions[0]).not.toHaveProperty('reason');
  });

  it('Example 2 — changing the relation keeps the subject and the earlier context map in history', () => {
    const first = record();
    const changed = append(
      fixture.root,
      'context',
      'workflow',
      '--relation',
      'Delivery consumes workflow.',
      '--reason',
      'Make the dependency explicit.',
    ) as Description;
    expect(changed).toMatchObject({
      subject: 'Original subject.',
      relation: 'Delivery consumes workflow.',
      reason: 'Make the dependency explicit.',
      supersedes: [first.id],
    });
    current('Original subject.', 'Delivery consumes workflow.', [
      'Original relation.',
    ]);
    expect(history()).toEqual({
      context: 'workflow',
      versions: [version(first), version(changed, [first.id])],
    });
  });

  it('Example 3 — refused changes append nothing and a reason never creates an unknown context', () => {
    record();
    const before = snapshot(fixture.root);
    refuse(
      fixture.root,
      'context',
      'workflow',
      '--subject',
      'Unjustified subject.',
    );
    refuse(
      fixture.root,
      'context',
      'workflow',
      '--relation',
      'Unjustified relation.',
    );
    refuse(
      fixture.root,
      'context',
      'workflow',
      '--subject',
      'Empty reason.',
      '--reason',
      '',
    );
    refuse(
      fixture.root,
      'context',
      'workflow',
      '--reason',
      'No field to change.',
    );
    refuse(
      fixture.root,
      'context',
      'workflow',
      '--subject',
      '',
      '--reason',
      'No subject.',
    );
    // With a subject as well as a reason this is still a change, not recording.
    const unknown = runConcepts(
      fixture.root,
      'context',
      'workflwo',
      '--subject',
      'Must not be recorded.',
      '--reason',
      'A misspelling must not create a context.',
    );
    expect(unknown.code).toBe(1);
    expect(snapshot(fixture.root)).toEqual(before);
    for (const verb of ['state', 'design']) {
      expect(
        query(fixture.root, verb).contexts.map((context) => context.name),
      ).toEqual(['workflow']);
    }
    current('Original subject.', 'Original relation.');
    expect(unknown.stderr).toContain(
      "the journal has no bounded context 'workflwo'; record it without --reason first",
    );
  });

  it('Example 4 — settling merged descriptions supersedes both and keeps both in history', () => {
    const { root } = fixture;
    git(root, 'commit', '--allow-empty', '-m', 'Common ancestor');
    git(root, 'switch', '-c', 'left');
    const left = record('Left subject.', 'Left relation.');
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Left context');
    git(root, 'switch', '-c', 'right', 'journal');
    const right = record('Right subject.', 'Right relation.');
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Right context');
    git(root, 'switch', 'left');
    git(root, 'merge', '--no-edit', 'right');
    expect(git(root, 'ls-files', '--unmerged')).toBe('');
    for (const verb of ['state', 'design']) {
      const result = query(root, verb);
      expect(result.contexts).toMatchObject([
        {
          name: 'workflow',
          subject: null,
          relation: null,
          competingDescriptions: [
            { subject: 'Left subject.', relation: 'Left relation.' },
            { subject: 'Right subject.', relation: 'Right relation.' },
          ],
        },
      ]);
    }
    refuse(root, 'context', 'workflow', '--subject', 'Settled subject.');
    refuse(
      root,
      'context',
      'workflow',
      '--subject',
      'Settled subject.',
      '--reason',
      'Relation is ambiguous.',
    );
    refuse(
      root,
      'context',
      'workflow',
      '--relation',
      'Settled relation.',
      '--reason',
      'Subject is ambiguous.',
    );
    const settled = append(
      root,
      'context',
      'workflow',
      '--subject',
      'Settled subject.',
      '--relation',
      'Settled relation.',
      '--reason',
      'Reconcile both descriptions without discarding either.',
    ) as Description;
    expect(settled).toMatchObject({
      subject: 'Settled subject.',
      relation: 'Settled relation.',
      reason: 'Reconcile both descriptions without discarding either.',
    });
    expect(settled.supersedes).toHaveLength(2);
    expect(settled.supersedes).toEqual(
      expect.arrayContaining([left.id, right.id]),
    );
    current('Settled subject.', 'Settled relation.', [
      'Left subject.',
      'Left relation.',
      'Right subject.',
      'Right relation.',
    ]);
    const past = history();
    expect(past.context).toBe('workflow');
    expect(past.versions).toHaveLength(3);
    expect(past.versions.slice(0, 2)).toEqual([version(left), version(right)]);
    expect(past.versions[2]).toEqual(version(settled, settled.supersedes));
  });

  it('Example 5 — reconstitution reads only current subject and relation, with earlier descriptions only in history', () => {
    const first = record();
    const changed = append(
      fixture.root,
      'context',
      'workflow',
      '--subject',
      'Current subject.',
      '--relation',
      'Current relation.',
      '--reason',
      'Reconstitute the accepted context map, not the earlier one.',
    ) as Description;
    expect(changed).toMatchObject({
      subject: 'Current subject.',
      relation: 'Current relation.',
      reason: 'Reconstitute the accepted context map, not the earlier one.',
      supersedes: [first.id],
    });
    // Each query launches a fresh CLI process: no in-memory continuation can supply the design.
    current('Current subject.', 'Current relation.', [
      'Original subject.',
      'Original relation.',
    ]);
    expect(history()).toEqual({
      context: 'workflow',
      versions: [version(first), version(changed, [first.id])],
    });
  });
});
