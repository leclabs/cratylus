// Binds design/examples/workflow/execution.md, structural examples 1–14.
// pnpm --filter cratylus exec vitest run test/execution/structural.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type Assignment,
  type Check,
  type Commit,
  type Efficiency,
  type ExecutionFixture,
  type History,
  type Inventory,
  type Levels,
  type Submission,
  command,
  cut,
  dispatch,
  example,
  examples,
  fixture,
  git,
  levelNames,
  log,
  refuse,
  run,
  submit,
  write,
} from './fixture.js';

let f: ExecutionFixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => {
  f.dispose();
});

function single() {
  examples(f, [example(1, 'delivery')]);
}
function readyPair() {
  examples(f, [example(1, 'window'), example(2, 'reservation')]);
  submit(f, 'windows', ['window'], ['windows/']);
  submit(f, 'reservations', ['reservation'], ['reservations/']);
  dispatch(f, 1, ['windows', 'reservations']);
}
function state() {
  const result = run(f, 'concepts', 'state');
  expect(result.code, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as {
    contexts: {
      name: string;
      efficiency: (Omit<Efficiency, 'noProgressRounds'> & {
        cut: string;
        at: string;
      })[];
    }[];
  };
}

describe('execution: work packages and counts', () => {
  it('Example 1 — a small cut needs only one package on the first level', () => {
    single();
    const answer = submit(f, 'delivery', ['delivery'], ['delivery.txt']);
    expect(answer.package).toMatchObject({
      name: 'delivery',
      outputs: ['delivery.txt'],
      concepts: ['delivery'],
      dependsOn: [],
      needs: [],
      state: 'submitted',
    });
    expect(levelNames(answer)).toEqual([{ level: 1, packages: ['delivery'] }]);
    expect(dispatch(f, 1, ['delivery']).packages[0]!.examples).toEqual([1]);
  });

  it('Example 2 — a shared output has one earlier owner and spanning examples go downstream', () => {
    examples(f, [
      example(1, 'shared schedule'),
      example(2, 'window'),
      example(3, 'reservation'),
      example(4, 'window', 'reservation'),
    ]);
    submit(f, 'shared', ['shared schedule'], ['shared/schedule.ts']);
    submit(
      f,
      'windows',
      ['window'],
      ['windows/'],
      ['shared'],
      ['shared/schedule.ts'],
    );
    const answer = submit(
      f,
      'reservations',
      ['reservation'],
      ['reservations/'],
      ['shared', 'windows'],
      ['shared/schedule.ts'],
    );
    expect(levelNames(answer)).toEqual([
      { level: 1, packages: ['shared'] },
      { level: 2, packages: ['windows'] },
      { level: 3, packages: ['reservations'] },
    ]);
    const assignments = ['shared', 'windows', 'reservations'].map((name) =>
      command<Assignment>(f, 'assignment', name),
    );
    expect(
      assignments
        .filter((a) => a.outputs.includes('shared/schedule.ts'))
        .map((a) => a.package),
    ).toEqual(['shared']);
    expect(assignments[1]!.needs).toEqual(['shared/schedule.ts']);
    expect(assignments[2]!.needs).toEqual(['shared/schedule.ts']);
    expect(assignments[1]!.examples.map((e) => e.number)).toEqual([2]);
    expect(assignments[2]!.examples.map((e) => e.number).sort()).toEqual([
      3, 4,
    ]);
    expect(
      command<Inventory>(f, 'inventory').examples.find((e) => e.number === 4)
        ?.package,
    ).toBe('reservations');
  });

  it('Example 3 — overlapping ownership is refused with the output and both claimants', () => {
    single();
    submit(f, 'owner', ['delivery'], ['shared.txt']);
    const error = refuse(
      f,
      'submit',
      'claimant',
      '--concept',
      'delivery',
      '--output',
      'shared.txt',
    );
    for (const name of ['shared.txt', 'owner', 'claimant'])
      expect(error).toContain(name);
  });

  it('Example 4 — unserved concepts block all dispatch until both are served', () => {
    examples(f, [example(1, 'window'), example(2, 'reservation')]);
    submit(f, 'windows', ['window']);
    expect(refuse(f, 'dispatch')).toContain('reservation');
    expect(command<Levels>(f, 'levels').levels[0]!.packages).toEqual([
      { name: 'windows', state: 'submitted' },
    ]);
    submit(f, 'reservations', ['reservation']);
    const answer = dispatch(f, 1, ['windows', 'reservations']);
    expect(answer.concepts).toEqual(
      expect.arrayContaining([
        { name: 'window', servedBy: ['windows'] },
        { name: 'reservation', servedBy: ['reservations'] },
      ]),
    );
    expect(command<Inventory>(f, 'inventory').unserved).toEqual([]);
  });

  it('Example 5 — a cycle names its packages instead of giving levels', () => {
    single();
    submit(f, 'A', ['delivery']);
    submit(f, 'B', ['delivery'], ['B.txt'], ['A']);
    command(f, 'update', 'A', '--depends-on', 'B');
    const error = refuse(f, 'levels');
    expect(error).toContain('A');
    expect(error).toContain('B');
  });

  it('Example 6 — levels are computed and dispatch waits for every package in the previous level', () => {
    single();
    submit(f, 'A', ['delivery']);
    submit(f, 'B', ['delivery']);
    submit(f, 'C', ['delivery'], ['C.txt'], ['A']);
    submit(f, 'D', ['delivery'], ['D.txt'], ['B']);
    submit(f, 'E', ['delivery'], ['E.txt'], ['C', 'D']);
    expect(levelNames(command<Levels>(f, 'levels'))).toEqual([
      { level: 1, packages: ['A', 'B'] },
      { level: 2, packages: ['C', 'D'] },
      { level: 3, packages: ['E'] },
    ]);
    dispatch(f, 1, ['A', 'B']);
    refuse(f, 'dispatch');
    command(f, 'finish', 'A');
    refuse(f, 'dispatch');
    command(f, 'finish', 'B');
    dispatch(f, 2, ['C', 'D']);
    refuse(f, 'dispatch');
    command(f, 'finish', 'D');
    refuse(f, 'dispatch');
    command(f, 'finish', 'C');
    dispatch(f, 3, ['E']);
  });

  it('Example 7 — updates replace outputs and dependencies and recompute levels', () => {
    single();
    submit(f, 'base', ['delivery']);
    submit(f, 'middle', ['delivery'], ['middle.txt'], ['base']);
    submit(f, 'leaf', ['delivery'], ['old.txt'], ['base']);
    const answer = command<Submission>(
      f,
      'update',
      'leaf',
      '--output',
      'new.txt',
      '--depends-on',
      'middle',
    );
    expect(answer.package.outputs).toEqual(['new.txt']);
    expect(answer.package.dependsOn).toEqual(['middle']);
    expect(levelNames(answer)).toEqual([
      { level: 1, packages: ['base'] },
      { level: 2, packages: ['middle'] },
      { level: 3, packages: ['leaf'] },
    ]);
    const assignment = command<Assignment>(f, 'assignment', 'leaf');
    expect(assignment.outputs).toEqual(['new.txt']);
    expect(assignment.dependsOn).toEqual(['middle']);
  });

  it('Example 8 — no ready package is a refusal, not an empty dispatch', () => {
    single();
    refuse(f, 'dispatch');
    submit(f, 'delivery', ['delivery']);
    dispatch(f, 1, ['delivery']);
    refuse(f, 'dispatch');
    command(f, 'finish', 'delivery');
    refuse(f, 'dispatch');
  });

  it('Example 9 — assignments partition the visible examples and inventory accounts for all', () => {
    const entries = [
      example(1, 'window'),
      example(2, 'reservation'),
      example(3, 'window'),
      example(4, 'reservation'),
    ];
    examples(f, entries);
    submit(f, 'windows', ['window']);
    submit(f, 'reservations', ['reservation']);
    for (const [name, concept] of [
      ['windows', 'window'],
      ['reservations', 'reservation'],
    ] as const) {
      const assignment = command<Assignment>(f, 'assignment', name);
      const expected = entries.filter((e) => e.concepts.includes(concept));
      expect(assignment.examples.map((e) => e.number).sort()).toEqual(
        expected.map((e) => e.number),
      );
      for (const entry of expected)
        expect(
          assignment.examples.find((e) => e.number === entry.number),
        ).toMatchObject({
          concepts: entry.concepts,
          text: expect.stringContaining(entry.text),
        });
    }
    const inventory = command<Inventory>(f, 'inventory');
    expect(inventory.examples).toHaveLength(entries.length);
    expect(inventory.examples).toEqual(
      expect.arrayContaining(
        entries.map((entry) => ({
          number: entry.number,
          concepts: entry.concepts,
          package: entry.concepts[0] === 'window' ? 'windows' : 'reservations',
        })),
      ),
    );
    expect(inventory.unowned).toEqual([]);
    expect(inventory.unserved).toEqual([]);
  });

  it('Example 10 — real commits within owned outputs are accepted and kept in order', () => {
    readyPair();
    const commits: Commit[] = [];
    for (const [index, text] of [
      'first version\n',
      'second version\n',
    ].entries()) {
      write(f, 'windows/window.txt', text);
      const message = `Window version ${index + 1}`;
      const answer = command<{ commit: Commit; history: Commit[] }>(
        f,
        'commit',
        'windows',
        '--message',
        message,
        '--path',
        'windows/window.txt',
      );
      expect(answer.commit).toEqual({
        sha: git(f.root, 'rev-parse', 'HEAD').trim(),
        message,
        paths: ['windows/window.txt'],
      });
      expect(git(f.root, 'show', 'HEAD:windows/window.txt')).toBe(text);
      commits.push(answer.commit);
      expect(answer.history).toEqual(commits);
    }
    expect(command<History>(f, 'history', 'windows').commits).toEqual(commits);
    expect(
      git(f.root, 'rev-list', '--reverse', 'HEAD').trim().split('\n'),
    ).toEqual(commits.map((c) => c.sha));
    expect(command<History>(f, 'history', 'reservations').commits).toEqual([]);
  });

  it('Example 11 — a cross-package commit changes neither HEAD nor index nor package history', () => {
    readyPair();
    write(f, 'windows/window.txt', 'accepted\n');
    command(
      f,
      'commit',
      'windows',
      '--message',
      'Accepted window',
      '--path',
      'windows/window.txt',
    );
    write(f, 'windows/window.txt', 'uncommitted change\n');
    write(f, 'reservations/reservation.txt', 'other builder\n');
    git(f.root, 'add', '--', 'reservations/reservation.txt');
    const before = {
      head: git(f.root, 'rev-parse', 'HEAD'),
      index: git(f.root, 'ls-files', '--stage', '-z'),
      history: command<History>(f, 'history', 'windows'),
      otherHistory: command<History>(f, 'history', 'reservations'),
      log: log(f),
    };
    const error = refuse(
      f,
      'commit',
      'windows',
      '--message',
      'Must refuse',
      '--path',
      'windows/window.txt',
      '--path',
      'reservations/reservation.txt',
    );
    expect(error).toContain('reservations/reservation.txt');
    expect(error).toContain('reservations');
    expect(git(f.root, 'rev-parse', 'HEAD')).toBe(before.head);
    expect(git(f.root, 'ls-files', '--stage', '-z')).toBe(before.index);
    expect(command<History>(f, 'history', 'windows')).toEqual(before.history);
    expect(command<History>(f, 'history', 'reservations')).toEqual(
      before.otherHistory,
    );
    expect(log(f)).toBe(before.log);
  });

  it('Example 12 — fixes add no whole-check runs and each check closes its own round', () => {
    single();
    const first = command<Check>(
      f,
      'check',
      '--failure',
      'a',
      '--failure',
      'b',
      '--failure',
      'c',
    );
    expect(first.wholeCheckRuns).toBe(1);
    for (const failure of ['a', 'b', 'c']) {
      command(f, 'run', '--role', 'builder');
      expect(
        command<Efficiency>(f, 'efficiency').wholeCheckRuns,
        `Fix ${failure} is not a whole check`,
      ).toBe(1);
    }
    const second = command<Check>(f, 'check');
    expect(second.rounds).toHaveLength(2);
    expect(
      second.rounds.map((r) => ({
        round: r.round,
        wholeCheckRuns: r.wholeCheckRuns,
      })),
    ).toEqual([
      { round: 1, wholeCheckRuns: 1 },
      { round: 2, wholeCheckRuns: 1 },
    ]);
    expect(second.rounds[0]!.failures.slice().sort()).toEqual(['a', 'b', 'c']);
    expect(second.rounds[1]!.failures).toEqual([]);
    expect(second.rounds[1]!.resolved.slice().sort()).toEqual(['a', 'b', 'c']);
    expect(command<Efficiency>(f, 'efficiency')).toMatchObject({
      rounds: 2,
      wholeCheckRuns: 2,
      agentRuns: { total: 3, byRole: { builder: 3 } },
    });
  });

  it('Example 13 — no-progress rounds are flagged and counted; resolving one failure is progress', () => {
    single();
    command(f, 'check', '--failure', 'a', '--failure', 'b');
    const stalled = command<Check>(
      f,
      'check',
      '--failure',
      'a',
      '--failure',
      'b',
      '--failure',
      'c',
    );
    expect(stalled.rounds[1]).toMatchObject({
      round: 2,
      noProgress: true,
      resolved: [],
    });
    expect(command<Efficiency>(f, 'efficiency')).toMatchObject({
      rounds: 2,
      wholeCheckRuns: 2,
      noProgressRounds: [2],
    });
    const progress = command<Check>(
      f,
      'check',
      '--failure',
      'b',
      '--failure',
      'c',
    );
    expect(progress.rounds[2]).toMatchObject({
      round: 3,
      noProgress: false,
      resolved: ['a'],
    });
    expect(command<Efficiency>(f, 'efficiency')).toMatchObject({
      rounds: 3,
      wholeCheckRuns: 3,
      noProgressRounds: [2],
    });
  });

  it('Example 14 — later concepts state processes read the recorded execution figures', () => {
    single();
    const context = run(
      f,
      'concepts',
      'context',
      'booking',
      '--subject',
      'Scheduling deliveries.',
    );
    expect(context.code, context.stderr).toBe(0);
    command(f, 'run', '--role', 'lead', '--tokens', '110');
    command(f, 'run', '--role', 'builder', '--tokens', '220');
    command(f, 'check', '--failure', 'a');
    command(f, 'run', '--role', 'builder', '--tokens', '330');
    command(f, 'check');
    const figures = {
      agentRuns: { total: 3, byRole: { lead: 1, builder: 2 } },
      rounds: 2,
      wholeCheckRuns: 2,
      tokens: 660,
    };
    expect(command<Efficiency>(f, 'efficiency')).toMatchObject(figures);
    expect(command(f, 'record')).toMatchObject({
      kind: 'efficiency',
      context: 'booking',
      cut: cut.split('/')[1],
      ...figures,
    });
    const later = state().contexts.find((c) => c.name === 'booking');
    expect(later?.efficiency).toEqual([
      { cut: 'delivery', ...figures, at: expect.any(String) },
    ]);
    expect(
      state().contexts.find((c) => c.name === 'booking')?.efficiency,
    ).toEqual(later?.efficiency);
  });
});
