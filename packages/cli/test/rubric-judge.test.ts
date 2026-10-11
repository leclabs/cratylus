import type * as ChildProcess from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import type * as OS from 'node:os';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BehavioralCheck } from '@cratylus/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recording, Scenario } from './reconstitution/architect/check.js';
import * as runner from './reconstitution/architect/runner.js';

const control = vi.hoisted(() => ({
  root: '',
  models: [] as string[],
  responses: [] as string[],
  calls: 0,
}));
vi.mock('node:os', async (original) => ({
  ...(await original<typeof OS>()),
  homedir: () => control.root,
}));
vi.mock('./agent-launch/fixture.js', () => ({
  fixture: () => ({
    root: control.root,
    home: control.root,
    cwd: control.root,
    env: {},
    extension: 'fixture-extension',
    dispose() {},
    declaration({
      name,
      model,
      body,
    }: { name: string; model: string; body: string }) {
      control.models.push(model);
      const directory = join(control.root, '.omp/agent/agents');
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, `${name}.md`), body);
    },
  }),
}));
vi.mock('node:child_process', async (original) => {
  const actual = await original<typeof ChildProcess>();
  return {
    ...actual,
    spawnSync: (
      binary: string,
      args: string[],
      options: { env: Record<string, string> },
    ) => {
      if (binary !== 'omp') return actual.spawnSync(binary, args, options);
      control.calls++;
      const response =
        control.responses.shift() ??
        '{"criterion":{"pass":true,"evidence":"Observed"}}';
      if (response === 'exit')
        return { status: 1, stdout: '', stderr: 'Judge exited' };
      if (response === 'timeout')
        return {
          status: null,
          stdout: '',
          stderr: '',
          error: new Error('ETIMEDOUT'),
        };
      const env = options.env;
      writeFileSync(
        env.EXECUTION_WIRING!,
        JSON.stringify({
          prompt: [
            'Judge supplied evidence against the fixed rubric. Return only the requested JSON.',
          ],
          active: [],
          tools: [],
        }),
      );
      writeFileSync(
        env.EXECUTION_MESSAGES!,
        `${JSON.stringify({ role: 'assistant', content: response })}\n`,
      );
      return { status: 0, stdout: '', stderr: '' };
    },
  };
});

const scenario: Scenario = {
  number: 1,
  ref: 'workflow/1',
  title: 'judge control',
  role: 'architect',
  example: 'The criterion holds.',
  prompt: '',
  files: {},
  commands: [],
  clauses: [
    {
      id: 'criterion',
      binds: ['criterion holds'],
      rubric: 'The criterion holds.',
    },
  ],
};
function subject(model = 'anthropic/subject'): Recording {
  const [provider, id] = model.split('/');
  return {
    report: 'Subject answer',
    messages: [
      { role: 'assistant', provider, model: id, content: 'Subject answer' },
    ],
    snapshots: [],
    wiring: {
      agent: 'architect',
      declaration: 'Architect',
      prompt: ['Architect'],
      active: ['read'],
      tools: [{ name: 'read', parameters: {} }],
    },
    answers: {},
  };
}
beforeEach(() => {
  control.root = mkdtempSync(join(tmpdir(), 'rubric-judge-test-'));
  control.models = [];
  control.responses = [];
  control.calls = 0;
  mkdirSync(join(control.root, '.omp/agent'), { recursive: true });
  writeFileSync(
    join(control.root, '.omp/agent/config.yml'),
    'modelRoles:\n  frontier-other-family: openai-codex/gpt-6-astra\n',
  );
  vi.stubEnv('EXECUTION_LIVE', '1'); // All omp calls are intercepted above; no live session can run.
  vi.stubEnv('EXECUTION_JUDGE_MODEL', undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(control.root, { recursive: true, force: true });
});

describe('live rubric judge contract, exercised without model sessions', () => {
  it.each(['anthropic/judge', 'openai/judge', 'openai-codex/judge'])(
    'refuses same-family %s before launching',
    (model) => {
      vi.stubEnv('EXECUTION_JUDGE_MODEL', model);
      const input = subject(
        model.startsWith('anthropic/')
          ? 'anthropic/subject'
          : model.startsWith('openai/')
            ? 'openai-codex/subject'
            : 'openai/subject',
      );
      expect(() =>
        runner.judgeRecording(scenario, input, join(control.root, 'result')),
      ).toThrow(/same.*family/i);
      expect(control.calls).toBe(0);
    },
  );
  it('chooses the host other-family role and retains the actual judge model', () => {
    const result = runner.judgeRecording(
      scenario,
      subject(),
      join(control.root, 'result'),
    );
    expect(control.models).toEqual(['openai-codex/gpt-6-astra']);
    expect(result).toMatchObject({
      judgment: { status: 'judged', model: 'openai-codex/gpt-6-astra' },
    });
    expect(
      JSON.parse(
        readFileSync(join(control.root, 'result/recording.json'), 'utf8'),
      ),
    ).toEqual(result);
  });
  it('honours an explicit other-family model override', () => {
    vi.stubEnv('EXECUTION_JUDGE_MODEL', 'google/judge');
    expect(
      runner.judgeRecording(scenario, subject(), join(control.root, 'result')),
    ).toMatchObject({ judgment: { model: 'google/judge', status: 'judged' } });
    expect(control.models).toEqual(['google/judge']);
  });
  it.each(['exit', 'timeout', 'not JSON', '{}'])(
    'retains an unjudged run after bounded %s retries',
    (failure) => {
      control.responses = Array(3).fill(failure);
      const input = subject();
      const result = runner.judgeRecording(
        scenario,
        input,
        join(control.root, 'result'),
      );
      expect(result).toMatchObject({
        answers: {},
        judgment: { status: 'unjudged', model: 'openai-codex/gpt-6-astra' },
      });
      expect(result.messages).toEqual(input.messages);
      expect(control.calls).toBe(3);
      expect(
        JSON.parse(
          readFileSync(join(control.root, 'result/subject.json'), 'utf8'),
        ).messages,
      ).toEqual(input.messages);
    },
  );
  it('rejudges the retained subject before returning, preserving attempt evidence', () => {
    control.responses = [
      'exit',
      'not JSON',
      '{"criterion":{"pass":false,"evidence":"Missing"}}',
    ];
    const result = runner.judgeRecording(
      scenario,
      subject(),
      join(control.root, 'result'),
    );
    expect(result).toMatchObject({
      answers: { criterion: { pass: false } },
      judgment: {
        status: 'judged',
        attempts: [
          { error: expect.any(String) },
          { error: expect.any(String) },
          {},
        ],
      },
    });
    expect(control.calls).toBe(3);
    expect(
      readFileSync(
        join(control.root, 'result/rubric/attempt-1/stderr'),
        'utf8',
      ),
    ).toBe('Judge exited');
  });
  it('reports four judged and one unjudged as incomplete, never a pass or a failed subject', async () => {
    const source: BehavioralCheck<Recording> = {
      example: 'criterion holds',
      assertions: [{ id: 'criterion', binds: ['criterion holds'] }],
      judge: (record) => ({
        criterion: record.answers.criterion?.pass === true,
      }),
    };
    const good: Recording = {
      ...subject(),
      answers: { criterion: { pass: true, evidence: 'Observed' } },
      judgment: {
        status: 'judged',
        model: 'openai-codex/gpt-6-astra',
        attempts: [{}],
      },
    };
    const unjudged: Recording = {
      ...subject(),
      judgment: {
        status: 'unjudged',
        model: 'openai-codex/gpt-6-astra',
        attempts: [{ error: 'No answer' }],
      },
    };
    // The runner exports the aggregation used by its live suite, not a test-only surrogate.
    const aggregate = runner.judgeRuns;
    expect(
      await aggregate(source, [good, good, good, good, unjudged]),
    ).toMatchObject({
      passed: false,
      status: 'incomplete',
      judged: 4,
      unjudged: 1,
      assertions: [],
    });
    expect(await aggregate(source, [good, good, good, good])).toMatchObject({
      passed: false,
      status: 'incomplete',
      judged: 4,
      unjudged: 1,
    });
    expect(await aggregate(source, Array(5).fill(good))).toMatchObject({
      passed: true,
      status: 'passed',
      judged: 5,
      unjudged: 0,
    });
  });
});
