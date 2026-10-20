// Decision 0220: a project's design is its own contexts. The practice the
// installation delivers is shown apart from them, read first, never in the
// project's context map; decision 0320: a journal holding a delivered context
// itself reads its own copy in the delivered context's place, as part of its
// design. The design state carries no decision; the decisions reading leads
// each with its title, its id only a reference.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';

type Answer = {
  contexts: { name: string }[];
  practice?: {
    about: string;
    contexts: { name: string; readOnly?: boolean }[];
  };
};

const delivered = {
  origin: 'cratylus',
  version: '3.2.1',
  context: 'workflow',
  identity: '01ARZ3NDEKTSV4RRFFQ69G5F00',
  position: 1,
  subject: 'How the work is done.',
  relation: 'Upstream of every other context of its origin.',
  concepts: [
    { name: 'story', wording: 'A change of meaning, told.', builtFrom: [] },
  ],
};

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'delivered-practice-apart-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});
const command = (args: string[], practice = [delivered]) =>
  dispatchConcepts(args, { from: root, delivered: practice });

/** A booking project with one open and one accepted decision. */
function booking(): void {
  command([
    'context',
    'booking',
    '--subject',
    'Seats for a show.',
    '--relation',
    'Stands alone.',
  ]);
  command([
    'define',
    'seat',
    '--context',
    'booking',
    '--wording',
    'A place one person holds.',
    '--reason',
    'First.',
  ]);
  command([
    'decide',
    '0001',
    '--context',
    'booking',
    '--title',
    'Seats are held, not sold',
    '--situation',
    'Read from `src/seats.ts` today.',
    '--decision',
    'A seat is held first.',
    '--consequences',
    'Holding comes before paying.',
    '--status',
    'open',
  ]);
  command([
    'decide',
    '0002',
    '--context',
    'booking',
    '--title',
    'One seat per person',
    '--situation',
    'Double holds.',
    '--decision',
    'A person holds one seat.',
    '--consequences',
    'No double holds.',
    '--status',
    'accepted',
  ]);
}

it.each(['state', 'design'])(
  '%s lists only the project’s own contexts and shows the delivered practice apart, before them',
  (verb) => {
    booking();
    const answer = command([verb]) as Answer;
    expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
    expect(JSON.stringify(answer.contexts)).not.toContain('cratylus:workflow');
    expect(answer.practice?.about).toMatch(
      /practice this project’s agents work by/,
    );
    expect(answer.practice?.about).toMatch(/not part of this project’s design/);
    expect(answer.practice?.about).toMatch(/never .* in its context map/);
    expect(answer.practice?.about).toMatch(/read first/);
    expect(answer.practice?.contexts.map((c) => c.name)).toEqual([
      'cratylus:workflow',
    ]);
    expect(answer.practice?.contexts[0]?.readOnly).toBe(true);
    const keys = Object.keys(answer);
    expect(keys.indexOf('practice')).toBeLessThan(keys.indexOf('contexts'));
  },
);

it('state gives the practice as its design state, apart and marked, and the project’s own as lines', () => {
  booking();
  const answer = command(['state']) as Answer;
  expect(answer.practice?.contexts).toEqual([
    {
      name: 'cratylus:workflow',
      subject: 'How the work is done.',
      relation: 'Upstream of every other context of its origin.',
      concepts: ['story ≜ A change of meaning, told.'],
      competing: [],
      delivered: {
        origin: 'cratylus',
        version: '3.2.1',
        context: 'workflow',
        identity: '01ARZ3NDEKTSV4RRFFQ69G5F00',
      },
      readOnly: true,
    },
  ]);
  expect(answer.contexts).toEqual([
    {
      name: 'booking',
      subject: 'Seats for a show.',
      relation: 'Stands alone.',
      concepts: ['seat ≜ A place one person holds.'],
      competing: [],
    },
  ]);
});

it('a view of one context shows only what it names: the project’s, or the practice apart', () => {
  booking();
  for (const verb of ['state', 'design']) {
    const own = command([verb, '--context', 'booking']) as Answer;
    expect(own.contexts.map((c) => c.name)).toEqual(['booking']);
    expect(own).not.toHaveProperty('practice');
    const practice = command([
      verb,
      '--context',
      'cratylus:workflow',
    ]) as Answer;
    expect(practice.contexts).toEqual([]);
    expect(practice.practice?.contexts.map((c) => c.name)).toEqual([
      'cratylus:workflow',
    ]);
  }
});

it('a journal holding the delivered context itself reads its own copy in its place in the practice, unmarked, then its other contexts', () => {
  booking();
  const own = command([
    'context',
    'workflow',
    '--subject',
    'The project’s own workflow.',
  ]) as { id: string };
  const held = [{ ...delivered, identity: own.id }];
  for (const verb of ['state', 'design']) {
    const answer = command([verb], held) as Answer & {
      practice: { contexts: Record<string, unknown>[] };
    };
    expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
    expect(answer.practice.contexts.map((c) => c.name)).toEqual(['workflow']);
    expect(answer.practice.contexts[0]).not.toHaveProperty('delivered');
    expect(answer.practice.contexts[0]).not.toHaveProperty('readOnly');
    const one = command([verb, '--context', 'workflow'], held) as Answer;
    expect(one.contexts).toEqual([]);
    expect(one.practice?.contexts.map((c) => c.name)).toEqual(['workflow']);
  }
  // Without delivery the design answers the same contexts, each unchanged:
  // only its place differs, the own copy in the practice place.
  const heldDesign = command(['design'], held) as Answer;
  const undelivered = command(['design'], []) as Answer;
  expect(undelivered).not.toHaveProperty('practice');
  expect([
    ...(heldDesign.practice?.contexts ?? []),
    ...heldDesign.contexts,
  ]).toEqual(
    [...undelivered.contexts].sort((a, b) =>
      a.name === 'workflow' ? -1 : b.name === 'workflow' ? 1 : 0,
    ),
  );
});

describe('an upstream and a downstream delivered context', () => {
  const upstream = {
    ...delivered,
    context: 'cratylic context design',
    identity: '01ARZ3NDEKTSV4RRFFQ69G5F01',
    position: 0,
    subject: 'Terms and their corrections.',
  };
  const downstream = delivered;
  /** Record the project's own copy of `context`, returning its identity. */
  const ownCopy = (context: string) =>
    (
      command(['context', context, '--subject', `Our ${context}.`]) as {
        id: string;
      }
    ).id;
  /** The names `verb` reads, in the practice place and in contexts, given
   *  the delivered contexts `given`, which the test hands in downstream
   *  first so only their positions order them. */
  const reads = (verb: string, given: (typeof delivered)[]) => {
    const answer = command([verb], given) as Answer;
    return {
      practice: answer.practice?.contexts.map((c) => c.name),
      contexts: answer.contexts.map((c) => c.name),
    };
  };

  it.each(['state', 'design'])(
    '%s reads a project’s own upstream copy, then the delivered downstream one, before its other contexts',
    (verb) => {
      booking();
      const identity = ownCopy('cratylic context design');
      expect(reads(verb, [downstream, { ...upstream, identity }])).toEqual({
        practice: ['cratylic context design', 'cratylus:workflow'],
        contexts: ['booking'],
      });
    },
  );

  it.each(['state', 'design'])(
    '%s reads both own copies in the delivered order where the project holds both',
    (verb) => {
      const down = ownCopy('workflow');
      booking();
      const up = ownCopy('cratylic context design');
      expect(
        reads(verb, [
          { ...downstream, identity: down },
          { ...upstream, identity: up },
        ]),
      ).toEqual({
        practice: ['cratylic context design', 'workflow'],
        contexts: ['booking'],
      });
    },
  );

  it.each(['state', 'design'])(
    '%s reads both delivered, upstream first, where the project holds neither',
    (verb) => {
      booking();
      expect(reads(verb, [downstream, upstream])).toEqual({
        practice: ['cratylus:cratylic context design', 'cratylus:workflow'],
        contexts: ['booking'],
      });
    },
  );

  it('records into an own copy as into any of the project’s contexts', () => {
    const identity = ownCopy('cratylic context design');
    const given = [downstream, { ...upstream, identity }];
    command(
      [
        'define',
        'term',
        '--context',
        'cratylic context design',
        '--wording',
        'The name a concept is called by.',
        '--reason',
        'First.',
      ],
      given,
    );
    const answer = command(['state'], given) as Answer & {
      practice: { contexts: { name: string; concepts: string[] }[] };
    };
    expect(answer.practice.contexts[0]).toMatchObject({
      name: 'cratylic context design',
      concepts: ['term ≜ The name a concept is called by.'],
    });
  });
});

it('decisions lead with their title, ids only as references, read apart from the design state', () => {
  booking();
  // A test reads the answer as the decisions reading prints it.
  const decisions = (args: string[]) => {
    const answer = command(['decisions', ...args]) as { decisions: object[] };
    return answer.decisions;
  };
  for (const shown of [...decisions([]), ...decisions(['--history'])]) {
    const keys = Object.keys(shown);
    expect(keys[0]).toBe('title');
    expect(keys.slice(-2)).toEqual(['id', 'entry']);
  }
  // The design state carries no decision at all.
  expect(JSON.stringify(command(['state']))).not.toContain('Seats are held');
  const leakage = command(['leakage']) as {
    warnings: { passage: { kind: string } }[];
  };
  // A decision records realization and is never inspected for leakage.
  expect(leakage.warnings.map((w) => w.passage.kind)).not.toContain('decision');
});

it('a retired own copy of a delivered context holds no place: the delivered one shows again', () => {
  booking();
  const own = command([
    'context',
    'workflow',
    '--subject',
    'The project’s own workflow.',
  ]) as { id: string };
  const held = [{ ...delivered, identity: own.id }];
  command(
    [
      'retire',
      '--context',
      'workflow',
      '--reason',
      'Dropped for the practice.',
    ],
    held,
  );
  for (const verb of ['state', 'design']) {
    const answer = command([verb], held) as Answer;
    expect(answer.contexts.map((c) => c.name)).toEqual(['booking']);
    expect(answer.practice?.contexts.map((c) => c.name)).toEqual([
      'cratylus:workflow',
    ]);
  }
});
