import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setImmediate as nextTurn } from 'node:timers/promises';
import type { BehavioralCheck } from '@cratylus/runtime';
import { afterEach, describe, expect, it } from 'vitest';
import { countHeldDrift } from './rubric-delivered.js';
import * as harness from './rubric-judge.js';

interface Run {
  judgment: harness.Judgment;
  ordinary: boolean;
  second: boolean;
  never: boolean;
  heldDrift?: { guard: string; attempt: 'call'; reason: string }[];
}
const source: BehavioralCheck<Run> = {
  example: 'Both ordinary criteria hold and never is violated.',
  assertions: [
    { id: 'ordinary', binds: ['ordinary'] },
    { id: 'second', binds: ['ordinary'] },
    { id: 'never', binds: ['never'], never: true },
  ],
  judge: (run) => ({
    ordinary: run.ordinary,
    second: run.second,
    never: run.never,
  }),
};
const good: Run = {
  ordinary: true,
  second: true,
  never: true,
  judgment: { status: 'judged', model: 'other/judge', attempts: [{}] },
};
const bad: Run = { ...good, ordinary: false };
const unjudged: Run = {
  ...good,
  judgment: { ...good.judgment, status: 'unjudged' },
};
const roots: string[] = [];
function directory() {
  const root = mkdtempSync(join(tmpdir(), 'rubric-batch-'));
  roots.push(root);
  return root;
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

it('two failures of an ordinary assertion decide failure without three more runs', async () => {
  expect(await harness.judgeRuns(source, [bad, bad])).toMatchObject({
    status: 'failed',
    passed: false,
    judged: 2,
    unjudged: 3,
  });
});
it('the first never violation decides failure', async () => {
  expect(
    await harness.judgeRuns(source, [{ ...good, never: false }]),
  ).toMatchObject({ status: 'failed', passed: false, judged: 1, unjudged: 4 });
});
it('four passes decide success; fewer passes with unjudged runs stay incomplete', async () => {
  expect(
    await harness.judgeRuns(source, [good, good, good, good]),
  ).toMatchObject({ status: 'passed', passed: true, judged: 4 });
  expect(
    await harness.judgeRuns(source, [good, good, good, unjudged, unjudged]),
  ).toMatchObject({
    status: 'incomplete',
    passed: false,
    judged: 3,
    unjudged: 2,
  });
});
it('different ordinary failures do not replace the frozen per-assertion threshold', async () => {
  expect(
    await harness.judgeRuns(source, [bad, { ...good, second: false }]),
  ).toMatchObject({ status: 'incomplete' });
  expect(
    await harness.judgeRuns(source, [
      bad,
      { ...good, second: false },
      good,
      good,
      good,
    ]),
  ).toMatchObject({ status: 'passed' });
});

describe('parallel batches stop and cancel outstanding runs', () => {
  it.each([
    {
      title: 'two failures',
      records: [bad, bad],
      status: 'failed',
      cancelled: 3,
    },
    {
      title: 'four passes',
      records: [good, good, good, good],
      status: 'passed',
      cancelled: 1,
    },
    {
      title: 'first never violation',
      records: [{ ...good, never: false }],
      status: 'failed',
      cancelled: 4,
    },
  ])('$title', async ({ records, status, cancelled }) => {
    const output = directory();
    const started: number[] = [];
    const stopped: number[] = [];
    const release = new Map<number, (record: Run) => void>();
    const batch = harness.liveBatch(
      source,
      (index, signal) => {
        started.push(index);
        // The package's ES2022 lib requires the executor form.
        return new Promise<Run>((resolve, reject) => {
          release.set(index, resolve);
          signal.addEventListener(
            'abort',
            () => {
              stopped.push(index);
              reject(signal.reason);
            },
            { once: true },
          );
        });
      },
      output,
    );
    await nextTurn();
    expect(started).toEqual([1, 2, 3, 4, 5]);
    for (const [index, record] of records.entries()) {
      release.get(index + 1)!(record);
      await nextTurn();
    }
    const result = await batch;
    expect(result).toMatchObject({
      status,
      passed: status === 'passed',
      judged: records.length,
      cancelled,
      notRun: cancelled,
      runsSpent: { started: 5, completed: records.length },
    });
    expect(stopped).toEqual(
      Array.from({ length: cancelled }, (_, i) => i + records.length + 1),
    );
    expect(
      result.runs.filter((run: { status: string }) => run.status === 'not-run'),
    ).toHaveLength(cancelled);
    expect(
      JSON.parse(readFileSync(join(output, 'assessment.json'), 'utf8')),
    ).toEqual(result);
  });
});

it('cancels an actual offline process without waiting for its timeout', async () => {
  const controller = new AbortController();
  // This is node, not omp: no model or credential is reached.
  const pending = harness.runSession(
    process.execPath,
    ['-e', 'require("node:net").createServer().listen(0)'],
    {
      cwd: directory(),
      env: process.env,
      timeout: 5000,
      signal: controller.signal,
    },
  );
  setImmediate(() => controller.abort(new Error('Batch decided')));
  const result = await pending;
  expect(result.error?.message).toBe('Batch decided');
  expect(result.status).not.toBe(0);
});

describe('0106 held drift is reported separately from verdicts', () => {
  it('counts a jointly held attempt once overall and once for each refusing guard', () => {
    expect(
      countHeldDrift({
        heldDrift: [
          {
            guard: ['descend', 'past-objective'],
            attempt: 'call',
            reason: 'Combined refusal',
          },
        ],
      }),
    ).toEqual({ total: 1, byGuard: { descend: 1, 'past-objective': 1 } });
  });
  it('does not count stale reply refusals in retained held-drift metadata', () => {
    expect(
      countHeldDrift({
        heldDrift: [
          { guard: 'hand-back', attempt: 'reply', reason: 'Turn-end refusal' },
          { guard: 'descend', attempt: 'call', reason: 'Pre-act refusal' },
        ],
      }),
    ).toEqual({ total: 1, byGuard: { descend: 1 } });
  });
  const drift = [
    {
      guard: 'readback-gate',
      attempt: 'call' as const,
      reason: 'Readback required',
    },
    { guard: 'descend', attempt: 'call' as const, reason: 'Source inspection' },
    {
      guard: 'readback-gate',
      attempt: 'call' as const,
      reason: 'Readback still required',
    },
  ];
  const counts = { total: 3, byGuard: { 'readback-gate': 2, descend: 1 } };
  it('counts drift for each judged or unjudged retained run without treating it as failure', async () => {
    const result = await harness.judgeRuns(source, [
      { ...good, heldDrift: drift },
      good,
      good,
      good,
      { ...unjudged, heldDrift: drift },
    ]);
    expect(result).toMatchObject({
      passed: true,
      judged: 4,
      unjudged: 1,
      heldDrift: { total: 6, byGuard: { 'readback-gate': 4, descend: 2 } },
      runs: [
        { index: 1, heldDrift: counts },
        { index: 2, heldDrift: { total: 0, byGuard: {} } },
        { index: 3, heldDrift: { total: 0, byGuard: {} } },
        { index: 4, heldDrift: { total: 0, byGuard: {} } },
        { index: 5, heldDrift: counts },
      ],
    });
  });
  it('writes per-run and total held drift to assessment.json without changing fail-fast', async () => {
    const output = directory();
    const result = await harness.liveBatch(
      source,
      async () => ({ ...good, never: false, heldDrift: drift }),
      output,
    );
    expect(result).toMatchObject({
      passed: false,
      judged: 1,
      cancelled: 4,
      // All five returned records must be reported, including already-resolved
      // siblings whose rubric verdicts fail-fast deliberately did not consume.
      heldDrift: {
        total: 15,
        byGuard: { 'readback-gate': 10, descend: 5 },
      },
      runs: Array.from({ length: 5 }, (_, index) => ({
        index: index + 1,
        heldDrift: counts,
      })),
    });
    expect(
      JSON.parse(readFileSync(join(output, 'assessment.json'), 'utf8')),
    ).toEqual(result);
  });
});
