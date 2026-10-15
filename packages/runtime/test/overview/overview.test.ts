// The context overview, pure: the order whole before parts with its cycles
// named, open decisions and the work in flight on the context alone, and the
// account telling them in that order.

import { describe, expect, it } from 'vitest';
import {
  overviewOf,
  wholeBeforeParts,
} from '../../src/capabilities/concepts/overview.js';
import type {
  ConceptView,
  ContextView,
  DecisionView,
} from '../../src/capabilities/concepts/views.js';
import type { Work } from '../../src/capabilities/ledger/index.js';

const concept = (name: string, ...builtFrom: string[]): ConceptView => ({
  name,
  wording: `The ${name}.`,
  builtFrom,
  reason: 'Recorded.',
});
const names = (concepts: readonly ConceptView[]) => concepts.map((c) => c.name);

const design = (
  concepts: ConceptView[],
  over: Partial<ContextView> = {},
): ContextView => ({
  name: 'film',
  subject: 'Making a film.',
  relation: 'It asks scheduling for dates.',
  competingDescriptions: [],
  concepts,
  competing: [],
  retired: [],
  ...over,
});

const decision = (
  id: string,
  status: DecisionView['status'],
  context = 'film',
): DecisionView => ({
  entry: id,
  id,
  context,
  title: `Decide ${id}`,
  situation: '',
  decision: '',
  consequences: '',
  status,
  supersedes: null,
  supersededBy: [],
  kind: null,
  kinds: [],
});

describe('whole before parts', () => {
  it('puts every root first in recorded order, then each part once, breadth-first', () => {
    const { ordered, cycles } = wholeBeforeParts([
      concept('take'),
      concept('edit', 'cut', 'take'),
      concept('cut'),
      concept('shoot', 'take'),
      concept('production', 'shoot', 'edit'),
    ]);
    expect(names(ordered)).toEqual([
      'production',
      'edit',
      'shoot',
      'take',
      'cut',
    ]);
    expect(cycles).toEqual([]);
  });

  it('places parts of one whole in recorded order, not the order named', () => {
    const { ordered } = wholeBeforeParts([
      concept('b'),
      concept('a'),
      concept('whole', 'a', 'b'),
    ]);
    expect(names(ordered)).toEqual(['whole', 'b', 'a']);
  });

  it('never sorts roots by name and shows a shared part once after both', () => {
    const { ordered } = wholeBeforeParts([
      concept('publication', 'review'),
      concept('production', 'review'),
      concept('review'),
    ]);
    expect(names(ordered)).toEqual(['publication', 'production', 'review']);
  });

  it('follows with the concepts reached only through a cycle, in recorded order, naming the cycle', () => {
    const { ordered, cycles } = wholeBeforeParts([
      concept('root'),
      concept('below', 'b'),
      concept('a', 'b'),
      concept('b', 'a', 'leaf'),
      concept('leaf'),
      concept('self', 'self'),
    ]);
    expect(names(ordered)).toEqual(['root', 'below', 'b', 'a', 'leaf', 'self']);
    expect(cycles).toEqual([['self']]);
    const closed = wholeBeforeParts([
      concept('a', 'b'),
      concept('leaf'),
      concept('b', 'a', 'leaf'),
    ]);
    expect(names(closed.ordered)).toEqual(['a', 'leaf', 'b']);
    expect(closed.cycles).toEqual([['a', 'b']]);
  });

  it('ignores a part that is not a live concept', () => {
    const { ordered } = wholeBeforeParts([concept('whole', 'gone')]);
    expect(names(ordered)).toEqual(['whole']);
  });
});

describe('the overview of one context', () => {
  const cost = {
    agentRuns: { total: 0, byRole: {} },
    tokens: null,
    elapsedSeconds: 0,
  };
  const at = '2026-10-15T00:00:00.000Z';
  const ended = { outcome: 'merged', at } as const;
  const work: Work = {
    stories: [
      {
        story: 'film',
        contexts: ['film', 'scheduling'],
        tasks: ['shoot'],
        recorded: at,
        cost,
      },
      { story: 'everywhere', tasks: ['tidy'], recorded: at, cost },
      {
        story: 'elsewhere',
        contexts: ['scheduling'],
        tasks: ['slotting'],
        recorded: at,
        cost,
      },
      {
        story: 'finished',
        contexts: ['film'],
        tasks: [],
        recorded: at,
        ended,
        cost,
      },
    ],
    tasks: [
      { task: 'shoot', story: 'film', recorded: at, cost },
      { task: 'tidy', story: 'everywhere', recorded: at, cost },
      { task: 'slotting', story: 'elsewhere', recorded: at, cost },
      { task: 'chore', recorded: at, cost },
      { task: 'merged-chore', recorded: at, ended, cost },
    ],
  };
  const none: Work = { stories: [], tasks: [] };

  it('gives its own open decisions and the work in flight on it, telling them after the concepts', () => {
    const answer = overviewOf(
      design([concept('take'), concept('production', 'take')]),
      [
        decision('colour', 'open'),
        decision('agreed', 'accepted'),
        decision('replaced', 'superseded'),
        decision('slots', 'open', 'scheduling'),
      ],
      work,
    );
    expect(answer).toMatchObject({
      context: 'film',
      subject: 'Making a film.',
      relation: 'It asks scheduling for dates.',
    });
    expect(answer, 'each concept told once, in the account').not.toHaveProperty(
      'concepts',
    );
    expect(answer).toMatchObject({
      cycles: [],
      openDecisions: [{ id: 'colour', title: 'Decide colour' }],
      workInFlight: {
        stories: [{ story: 'film' }, { story: 'everywhere' }],
        tasks: [
          { task: 'shoot', story: 'film' },
          { task: 'tidy', story: 'everywhere' },
        ],
      },
    });
    const where = (text: string) => answer.account.indexOf(text);
    const order = [
      'Making a film.',
      'It asks scheduling for dates.',
      'Production means: The production. It is built from take.',
      'Take means: The take.',
      'Decide colour',
      'the story film; the story everywhere; the task shoot of the story film; the task tidy of the story everywhere.',
    ].map(where);
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(
      answer.account.split('The production.'),
      'each meaning given once',
    ).toHaveLength(2);
    for (const absent of [
      'agreed',
      'replaced',
      'slots',
      'elsewhere',
      'slotting',
      'finished',
      'merged-chore',
      'chore',
    ])
      expect(answer.account).not.toContain(absent);
  });

  it('says plainly when nothing is open, in flight or related', () => {
    const answer = overviewOf(design([], { relation: '' }), [], none);
    expect(answer.account).toContain('No relation to other contexts');
    expect(answer.account).toContain('no live concept');
    expect(answer.account).toContain('No decision is open.');
    expect(answer.account).toContain('No work is in flight.');
  });

  it('names a cycle in the account and tells competing descriptions without choosing one', () => {
    const answer = overviewOf(
      design([concept('a', 'b'), concept('b', 'a')], {
        subject: null,
        relation: null,
        competingDescriptions: [
          { subject: 'Films.', relation: '' },
          { subject: 'Movies.', relation: 'Upstream of scheduling.' },
        ],
      }),
      [],
      none,
    );
    expect(answer.cycles).toEqual([['a', 'b']]);
    expect(answer.subject).toBeNull();
    expect(answer.account).toContain(
      'a and b are built from one another in a cycle',
    );
    expect(answer.account).toContain('Films.');
    expect(answer.account).toContain('Movies.');
  });
});
