// pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/execution/vitest.config.ts
// Held-out structural cases 5–7; separate from package test discovery.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type Assignment,
  type Check,
  type Efficiency,
  type ExecutionFixture,
  command,
  example,
  examples,
  fixture,
  refuse,
  submit,
} from '../../../../packages/cli/test/execution/fixture.js';

let f: ExecutionFixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => {
  f.dispose();
});

describe('execution judgment: structural', () => {
  it('Example 5 — a two-concept assignment contains every example of both and no other', () => {
    const entries = [
      example(1, 'window'),
      example(2, 'reservation'),
      example(3, 'capacity'),
      example(4, 'window', 'reservation'),
      example(5, 'reservation'),
      example(6, 'window'),
      example(7, 'capacity'),
    ];
    examples(f, entries);
    submit(f, 'delivery', ['window', 'reservation']);
    submit(f, 'capacity', ['capacity']);
    const answer = command<Assignment>(f, 'assignment', 'delivery');
    const expected = entries.filter((e) =>
      e.concepts.some((c) => ['window', 'reservation'].includes(c)),
    );
    expect(answer.examples.map((e) => e.number).sort()).toEqual(
      expected.map((e) => e.number),
    );
    for (const entry of expected)
      expect(
        answer.examples.find((e) => e.number === entry.number),
      ).toMatchObject({
        concepts: entry.concepts,
        text: expect.stringContaining(entry.text),
      });
  });

  it('Example 6 — consecutive no-progress rounds both remain flagged', () => {
    examples(f, [example(1, 'delivery')]);
    command(f, 'check', '--failure', 'late', '--failure', 'overbooked');
    command(f, 'check', '--failure', 'late', '--failure', 'overbooked');
    const answer = command<Check>(
      f,
      'check',
      '--failure',
      'late',
      '--failure',
      'overbooked',
      '--failure',
      'unassigned',
    );
    expect(answer.rounds).toHaveLength(3);
    expect(
      answer.rounds.slice(1).map((r) => ({
        round: r.round,
        noProgress: r.noProgress,
        resolved: r.resolved,
      })),
    ).toEqual([
      { round: 2, noProgress: true, resolved: [] },
      { round: 3, noProgress: true, resolved: [] },
    ]);
    expect(command<Efficiency>(f, 'efficiency')).toMatchObject({
      rounds: 3,
      wholeCheckRuns: 3,
      noProgressRounds: [2, 3],
    });
  });

  it('Example 7 — submitting a missing dependency is refused by name', () => {
    examples(f, [example(1, 'delivery')]);
    const error = refuse(
      f,
      'submit',
      'delivery',
      '--concept',
      'delivery',
      '--output',
      'delivery.txt',
      '--depends-on',
      'absent-schedule',
    );
    expect(error).toContain('absent-schedule');
  });
});
