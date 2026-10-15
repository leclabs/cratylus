// The ledger capability, its store and the lifecycle append: one exclusively
// created file per entry in ULID order, a transition recorded once even when
// delivered at once by several processes, each story and task in flight, how
// each ended, and what each cost in agent runs by role, tokens and elapsed
// time, taken from the harness's dispatches and returns, every one of them
// counted though dispatched at once; the cut-era entries kept as history.

import { execFileSync, spawn } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { dispatchLedger } from '../src/capabilities/ledger/dispatch.js';
import { workIn } from '../src/capabilities/ledger/index.js';
import { LEDGER_DIR } from '../src/capabilities/ledger/store.js';
import { appendLifecycle } from '../src/lifecycle/index.js';

let sandbox: string;
let repo: string;
beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'ledger-'));
  repo = join(sandbox, 'repo');
  mkdirSync(repo);
  execFileSync('git', ['init', '-q'], { cwd: repo });
});
afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

const ledger = (...argv: string[]) =>
  dispatchLedger(argv, { from: repo }) as Record<string, unknown>;
const files = () => {
  try {
    return readdirSync(join(repo, 'design/ledger')).sort();
  } catch {
    return [];
  }
};
const refused = (argv: string[], words: RegExp) => {
  const before = files();
  expect(() => ledger(...argv)).toThrow(words);
  expect(files()).toEqual(before);
};
/** Entry `n`, written at `at`, as the ledger would have written it. */
const entry = (n: number, at: string, fields: Record<string, unknown>) => {
  const id = `01ARZ3NDEKTSV4RRFFQ69G5F${String(n).padStart(2, '0')}`;
  mkdirSync(join(repo, 'design/ledger'), { recursive: true });
  writeFileSync(
    join(repo, 'design/ledger', `${id}.json`),
    JSON.stringify({ id, at, transition: `fixture:${n}`, ...fields }),
  );
};

/** Each process's exit code, `script` run as a module in `repo` by `count`
 *  node processes started at once, the runtime read from its source. */
const raced = (script: string, count: number) =>
  Promise.all(
    Array.from(
      { length: count },
      (_, i) =>
        new Promise<number | null>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              '--import',
              pathToFileURL(createRequire(import.meta.url).resolve('tsx/esm'))
                .href,
              '--input-type=module',
              '-e',
              script.replaceAll('$I', String(i)),
            ],
            { cwd: repo, stdio: 'ignore' },
          );
          child.on('error', reject);
          child.on('close', resolve);
        }),
    ),
  );
const lifecycleModule = JSON.stringify(
  fileURLToPath(new URL('../src/lifecycle/index.ts', import.meta.url)),
);
/** What the entries of the ledger say, in the order of their files' names. */
const written = () =>
  files().map(
    (name) =>
      JSON.parse(readFileSync(join(repo, LEDGER_DIR, name), 'utf8')) as {
        id: string;
        transition: string;
      },
  );

describe('the ledger’s store', () => {
  it('writes one file per entry, named by its ULID, in append order', () => {
    for (const name of ['a', 'b', 'c']) ledger('task', name);
    const names = files();
    expect(names.every((n) => /^[0-9A-HJKMNP-TV-Z]{26}\.json$/.test(n))).toBe(
      true,
    );
    expect(written().map((e) => `${e.id}.json`)).toEqual(names);
    expect(written().map((e) => e.transition)).toEqual([
      'task:a',
      'task:b',
      'task:c',
    ]);
  });

  it('records the same transition once when several processes deliver it at once', async () => {
    const event = {
      kind: 'dispatched',
      call: 'call-1',
      agent: 'Builder',
      role: 'builder',
      task: 'chore',
    };
    const codes = await raced(
      `import { appendLifecycle } from ${lifecycleModule};
try { appendLifecycle(process.cwd(), ${JSON.stringify(event)}); process.exit(0); }
catch { process.exit(1); }`,
      4,
    );
    expect(codes.filter((c) => c === 0)).toHaveLength(1);
    expect(written().map((e) => e.transition)).toEqual([
      'task:chore',
      'dispatched:call-1/Builder',
    ]);
  }, 30_000);
});

describe('the ledger’s verbs', () => {
  it('records stories and tasks in flight and how each ended', () => {
    dispatchConcepts(['context', 'booking', '--subject', 'Booking.'], {
      from: repo,
    });
    expect(ledger('story', 'seats', '--context', 'booking')).toMatchObject({
      kind: 'story',
      story: 'seats',
      contexts: ['booking'],
    });
    expect(ledger('task', 'seat-hold', '--story', 'seats')).toMatchObject({
      kind: 'task',
      task: 'seat-hold',
      story: 'seats',
    });
    ledger('task', 'chore');
    expect(ledger('end', 'chore', '--outcome', 'dropped')).toMatchObject({
      kind: 'end',
      task: 'chore',
      outcome: 'dropped',
    });
    const state = ledger('state') as {
      inFlight: { stories: object[]; tasks: object[] };
      ended: { stories: object[]; tasks: object[] };
    };
    expect(state.inFlight).toMatchObject({
      stories: [
        { story: 'seats', contexts: ['booking'], tasks: ['seat-hold'] },
      ],
      tasks: [{ task: 'seat-hold', story: 'seats' }],
    });
    expect(state.ended).toMatchObject({
      stories: [],
      tasks: [{ task: 'chore', ended: { outcome: 'dropped' } }],
    });
    expect(state).not.toHaveProperty('uninterpreted');
  });

  it('refuses what is not a story or task of the ledger, writing nothing', () => {
    ledger('story', 'seats');
    ledger('task', 'seat-hold', '--story', 'seats');
    refused(
      ['story', 'seats'],
      /^ledger story: 'seats' is already recorded as a story/,
    );
    refused(
      ['task', 'seats'],
      /^ledger task: 'seats' is already recorded as a story/,
    );
    refused(['story', 'seat-hold'], /already recorded as a task/);
    refused(['story', 'Seats'], /^ledger story: name the story as a kebab id/);
    refused(['task', 'rows', '--story', 'rows'], /records no story 'rows'/);
    refused(
      ['story', 'rows', '--context', 'absent'],
      /the journal has no bounded context 'absent'/,
    );
    refused(
      ['end', 'rows', '--outcome', 'merged'],
      /records no story or task 'rows'/,
    );
    refused(
      ['end', 'seats', '--outcome', 'done'],
      /--outcome merged or dropped/,
    );
    refused(['end', 'seats'], /--outcome merged or dropped/);
    ledger('end', 'seats', '--outcome', 'merged');
    refused(
      ['end', 'seats', '--outcome', 'dropped'],
      /'seats' already ended, merged/,
    );
  });

  it('counts each story’s and task’s cost from what the harness saw, its elapsed time from the entries', () => {
    entry(1, '2026-10-15T10:00:00.000Z', { kind: 'story', story: 'seats' });
    entry(2, '2026-10-15T10:01:00.000Z', {
      kind: 'task',
      task: 'seat-hold',
      story: 'seats',
    });
    entry(3, '2026-10-15T10:02:00.000Z', {
      kind: 'dispatched',
      call: 'c1',
      agent: 'Builder',
      role: 'builder',
      task: 'seat-hold',
    });
    entry(4, '2026-10-15T10:03:00.000Z', {
      kind: 'dispatched',
      call: 'c1',
      agent: 'Reviewer',
      role: 'reviewer',
      task: 'seat-hold',
    });
    entry(5, '2026-10-15T10:04:00.000Z', {
      kind: 'dispatched',
      call: 'c2',
      agent: 'Lead',
      role: 'lead',
      story: 'seats',
    });
    entry(6, '2026-10-15T10:05:00.000Z', {
      kind: 'returned',
      call: 'c1',
      agent: 'Builder',
      tokens: 1000,
    });
    entry(7, '2026-10-15T10:06:00.000Z', {
      kind: 'returned',
      call: 'c1',
      agent: 'Reviewer',
      tokens: 200,
    });
    entry(8, '2026-10-15T10:07:00.000Z', {
      kind: 'returned',
      call: 'c2',
      agent: 'Lead',
    });
    entry(9, '2026-10-15T10:31:00.000Z', {
      kind: 'end',
      task: 'seat-hold',
      outcome: 'merged',
    });
    const now = Date.parse('2026-10-15T11:00:00.000Z');
    const state = dispatchLedger(['state'], { from: repo, now }) as {
      inFlight: { stories: { cost: unknown }[] };
      ended: { tasks: { cost: unknown }[] };
    };
    expect(state.inFlight.stories[0]?.cost).toEqual({
      agentRuns: { total: 3, byRole: { builder: 1, reviewer: 1, lead: 1 } },
      tokens: 1200,
      elapsedSeconds: 3600,
    });
    expect(state.ended.tasks[0]?.cost).toEqual({
      agentRuns: { total: 2, byRole: { builder: 1, reviewer: 1 } },
      tokens: 1200,
      elapsedSeconds: 30 * 60,
    });
  });

  it('keeps the cut-era entries as history: never in flight, never counted, never unknown', () => {
    const at = '2026-10-01T00:00:00.000Z';
    entry(1, at, {
      kind: 'cut',
      cut: 'old',
      branch: 'feature/old',
      contexts: ['booking'],
      architects: { booking: 'architect' },
    });
    entry(2, at, { kind: 'freeze', cut: 'old', checks: ['a.test.ts'] });
    entry(3, at, {
      kind: 'dispatched',
      cut: 'old',
      role: 'builder',
      run: 'r1',
      workPackage: 'p',
    });
    entry(4, at, { kind: 'returned', cut: 'old', role: 'builder', run: 'r1' });
    entry(5, at, { kind: 'check', cut: 'old', failures: [] });
    entry(6, at, { kind: 'integrate', cut: 'old' });
    entry(7, at, { kind: 'cut', cut: 'open', branch: 'b', contexts: [] });
    expect(ledger('state')).toEqual({
      inFlight: { stories: [], tasks: [] },
      ended: { stories: [], tasks: [] },
    });
    expect([...workIn(repo).integratedCuts]).toEqual(['old']);
  });
});

describe('the lifecycle append', () => {
  const dispatched = (fields: Record<string, unknown>) =>
    appendLifecycle(repo, {
      kind: 'dispatched',
      call: 'call-1',
      agent: 'Builder',
      role: 'builder',
      ...fields,
    });

  it('records a dispatch naming a story or task, recording each new one in flight first', () => {
    expect(dispatched({ story: 'seats', task: 'seat-hold' })).toMatchObject({
      kind: 'dispatched',
      transition: 'dispatched:call-1/Builder',
      story: 'seats',
      task: 'seat-hold',
    });
    expect(
      appendLifecycle(repo, {
        kind: 'returned',
        call: 'call-1',
        agent: 'Builder',
        tokens: 7,
      }),
    ).toMatchObject({ kind: 'returned', tokens: 7 });
    expect(ledger('state')).toMatchObject({
      inFlight: {
        stories: [
          {
            story: 'seats',
            tasks: ['seat-hold'],
            cost: { agentRuns: { total: 1 }, tokens: 7 },
          },
        ],
        tasks: [{ task: 'seat-hold', story: 'seats' }],
      },
    });
    expect(files()).toHaveLength(4);
  });

  it('counts every one of several dispatches naming one new story at once, recording the story once', async () => {
    const codes = await raced(
      `import { appendLifecycle } from ${lifecycleModule};
try {
  appendLifecycle(process.cwd(), { kind: 'dispatched', call: 'call-1', agent: 'Builder$I', role: 'builder', story: 'seats' });
  process.exit(0);
} catch { process.exit(1); }`,
      4,
    );
    expect(codes).toEqual([0, 0, 0, 0]);
    expect(
      written().filter((e) => e.transition === 'story:seats'),
    ).toHaveLength(1);
    expect(ledger('state')).toMatchObject({
      inFlight: {
        stories: [
          {
            story: 'seats',
            cost: { agentRuns: { total: 4, byRole: { builder: 4 } } },
          },
        ],
      },
    });
  }, 30_000);

  it('records nothing, and never fails, for a dispatch naming neither, or the return of one it does not hold', () => {
    expect(dispatched({})).toBeUndefined();
    expect(
      appendLifecycle(repo, {
        kind: 'returned',
        call: 'call-1',
        agent: 'Builder',
      }),
    ).toBeUndefined();
    expect(files()).toEqual([]);
  });

  it('refuses a repeated event, another shape, or a story named as a task, writing nothing', () => {
    dispatched({ task: 'chore' });
    const before = files();
    expect(() => dispatched({ task: 'chore' })).toThrow(/already recorded/);
    expect(() =>
      appendLifecycle(repo, {
        kind: 'dispatched',
        transition: 'x',
        cut: 'old',
        role: 'builder',
        run: 'r',
      }),
    ).toThrow(
      /^lifecycle: the dispatched event is missing or mistypes: call, agent/,
    );
    expect(() =>
      appendLifecycle(repo, { kind: 'verdict', call: 'c', agent: 'a' }),
    ).toThrow(/give one of dispatched, returned/);
    expect(() =>
      appendLifecycle(repo, {
        kind: 'returned',
        call: 'c',
        agent: 'a',
        tokens: -1,
      }),
    ).toThrow(/tokens/);
    expect(() =>
      appendLifecycle(repo, {
        kind: 'dispatched',
        call: 'call-2',
        agent: 'Builder',
        role: 'builder',
        story: 'chore',
      }),
    ).toThrow(/'chore' is recorded as a task, not a story/);
    expect(files()).toEqual(before);
  });
});
