// Decision 0220: a project's design is its own contexts. The practice the
// installation delivers is shown apart from them, read first, never in the
// project's context map; a journal holding that context itself reads its own as
// part of its design. The design state carries no decision; the decisions
// reading leads each with its title, its id only a reference.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
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

it('a journal holding the delivered context itself reads its own, among its contexts, with no practice apart', () => {
  booking();
  const own = command([
    'context',
    'workflow',
    '--subject',
    'The project’s own workflow.',
  ]) as { id: string };
  const held = [{ ...delivered, identity: own.id }];
  for (const verb of ['state', 'design']) {
    const answer = command([verb], held) as Answer;
    expect(answer.contexts.map((c) => c.name)).toEqual(['booking', 'workflow']);
    expect(answer).not.toHaveProperty('practice');
  }
  // Without delivery the same reading is unchanged.
  expect(command(['design'], held)).toEqual(command(['design'], []));
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
