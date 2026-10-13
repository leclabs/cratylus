// Judgment-only structural cases. Never imported or named by a package check.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type Decision,
  type History,
  type TemporaryRepository,
  append,
  context,
  decisionArgs,
  expectedDecision,
  extractSeedSource,
  query,
  seed,
  snapshot,
  successful,
  temporaryRepository,
} from '../../../../packages/cli/test/concept-journal/fixture.js';

let fixture: TemporaryRepository;
beforeEach(() => {
  fixture = temporaryRepository();
});
afterEach(() => {
  fixture.dispose();
});

describe('concept journal structural judgment', () => {
  it('1 — a three-decision chain retains each immediate successor and leaves only the third current, none open', () => {
    const { root } = fixture;
    context(root);
    append(root, ...decisionArgs('first', 'open'));
    append(root, ...decisionArgs('second', 'open', 'first'));
    append(root, ...decisionArgs('third', 'accepted', 'second'));
    expect(query<{ decisions: Decision[] }>(root, 'decisions')).toMatchObject({
      decisions: [
        expectedDecision('first', 'superseded', null, ['second']),
        expectedDecision('second', 'superseded', 'first', ['third']),
        expectedDecision('third', 'accepted', 'second'),
      ],
    });
    expect(
      query<{ decisions: Decision[] }>(root, 'decisions', '--open').decisions,
    ).toEqual([]);
    expect(query(root, 'state', '--context', 'workflow')).toMatchObject({
      contexts: [
        {
          name: 'workflow',
          subject: 'The workflow subject.',
          relation: '',
          concepts: [],
          competing: [],
          retired: [],
          decisions: {
            accepted: [expectedDecision('third', 'accepted', 'second')],
            open: [],
          },
        },
      ],
    });
  });

  it('2 — reseeding after a real supersession is refused byte-identically and does not restore the seeded version', () => {
    const { root, sandbox } = fixture;
    const source = extractSeedSource(sandbox);
    successful(
      seed(root, source),
      'seed-concept-journal.mjs --from pinned design',
    );
    const concept = source.concepts.find(
      (c) => c.context === 'workflow' && c.name === 'concept journal',
    );
    expect(concept).toBeDefined();
    const original = query<History>(
      root,
      'history',
      concept!.name,
      '--context',
      concept!.context,
    );
    expect(original.versions).toHaveLength(1);
    expect(original.versions[0]).toMatchObject({
      kind: 'define',
      wording: concept!.wording,
      builtFrom: concept!.builtFrom,
      supersedes: [],
    });
    const wording =
      'The design and its reasons are recovered from the journal before any continuation.';
    const reason = 'The accepted meaning now explicitly includes continuation.';
    append(
      root,
      'supersede',
      concept!.name,
      '--context',
      concept!.context,
      '--wording',
      wording,
      '--reason',
      reason,
      '--built-from',
      'concept',
      '--built-from',
      'decision',
    );
    const before = snapshot(root);
    const repeated = seed(root, source);
    expect(repeated.code).toBe(1);
    expect(snapshot(root)).toEqual(before);
    const current = query(root, 'design', '--context', concept!.context)
      .contexts[0];
    expect(current.competing).toEqual([]);
    expect(current.retired).toEqual([]);
    expect(
      current.concepts.filter((c) => c.name === concept!.name),
    ).toMatchObject([
      {
        name: concept!.name,
        wording,
        builtFrom: ['concept', 'decision'],
        reason,
      },
    ]);
    const past = query<History>(
      root,
      'history',
      concept!.name,
      '--context',
      concept!.context,
    );
    expect(past.versions).toHaveLength(2);
    expect(past.versions[0]).toEqual(original.versions[0]);
    expect(past.versions[1]).toMatchObject({
      kind: 'supersede',
      wording,
      builtFrom: ['concept', 'decision'],
      reason,
      supersedes: [original.versions[0].id],
    });
    expect(snapshot(root)).toEqual(before);
  }, 120_000);
});
