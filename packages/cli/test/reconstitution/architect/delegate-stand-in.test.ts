import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judgeBatch } from '@cratylus/runtime';
import { expect, it, vi } from 'vitest';
import { provider } from '../../agent-launch/provider.js';
import {
  type Recording,
  type Scenario,
  assess,
  check,
  rubricPrompt,
} from './check.js';
import standIn, { acknowledgement } from './delegate-stand-in.js';
import { project } from './runner.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const input = {
  context: 'Creative acceptance does not grant release authority.',
  tasks: [
    {
      agent: 'lead',
      task: 'Realize film approval without granting release permission.\n```assignment\n{"cut":"film-approval","concepts":["approval","release permission"],"examples":["film-production/1","film-production/2"],"decisions":["creative-not-release"]}\n```',
      solutionSpace:
        'Keep creative acceptance separate from release authority.',
    },
    {
      agent: 'illustrator',
      task: 'Write examples for night shoots under date-reservation rules.\n```assignment\n{"cut":"night-shoots","concepts":["night shoot"]}\n```',
      solutionSpace: 'Do not decide release permission.',
    },
  ],
};

it('keeps the native task schema and description and acknowledges every assignment', async () => {
  const native = {
    name: 'task',
    description: 'Native dispatch description',
    parameters: { type: 'object', properties: { tasks: { type: 'array' } } },
  };
  let start = () => {};
  const registerTool = vi.fn();
  standIn({
    on: (_event, handler) => {
      start = handler;
    },
    getAllTools: () => [native],
    registerTool,
  });
  expect(registerTool).not.toHaveBeenCalled();
  start();
  const tool = registerTool.mock.calls[0]![0];
  expect(tool.parameters).toBe(native.parameters);
  expect(tool.description).toBe(native.description);
  expect(tool.defaultInactive).toBe(true);
  const before = structuredClone(input);
  expect(await tool.execute('dispatch-1', input)).toEqual({
    content: input.tasks.map(() => ({ type: 'text', text: acknowledgement })),
    details: { fixture: 'delegate-stand-in', input },
  });
  expect(input).toEqual(before);
});

it('does not introduce task when the subject has no native task tool', () => {
  const registerTool = vi.fn();
  standIn({
    on: (_event, handler) => handler(),
    getAllTools: () => [],
    registerTool,
  });
  expect(registerTool).not.toHaveBeenCalled();
});

it('routes real omp dispatch to the stand-in while retaining role, assignment and branch, without child requests', async () => {
  const scenario: Scenario = JSON.parse(
    readFileSync(join(here, 'scenarios.json'), 'utf8'),
  ).find((item: Scenario) => item.number === 31);
  const f = project(scenario);
  execFileSync('git', ['checkout', '-qb', 'feature/film-approval'], {
    cwd: f.cwd,
    env: f.env,
  });
  let dispatched = false;
  const server = await provider(() => {
    if (dispatched) return { text: 'Assignment acknowledged.' };
    dispatched = true;
    return { tool: 'task', args: input };
  });
  f.models(server.baseUrl);
  f.declaration({
    name: 'fixture-subject',
    body: 'Dispatch the supplied assignments.',
    tools: ['task'],
    spawns: '*',
  });
  const messages = join(f.root, 'messages.jsonl');
  Object.assign(f.env, {
    EXECUTION_PROJECT: f.cwd,
    EXECUTION_MESSAGES: messages,
  });
  const session = f.launch({
    agent: 'fixture-subject',
    inspect: false,
    onlyInstalled: true,
    tools: ['task'],
    extra: [
      '--extension',
      join(here, 'delegate-stand-in.ts'),
      '--extension',
      join(here, 'handoff-observe.ts'),
    ],
  });
  try {
    const roles = f.configuration().modelRoles as Record<string, string>;
    expect(roles.illustrator).toBe('@frontier-other-family:high');
    expect(roles['frontier-other-family']).toBeUndefined();
    expect(roles.frontier).toBeUndefined();
    expect(roles.default).toBeUndefined();
    await session.command({
      type: 'prompt',
      message: 'Dispatch both assignments.',
    });
    await session.waitFor((frame) => frame.type === 'agent_end');
    expect(server.errors).toEqual([]);
    expect(server.requests).toHaveLength(2);
    const result = server.requests[1]!.messages.find((m) => m.role === 'tool');
    expect(JSON.stringify(result)).toContain(acknowledgement);
    expect(JSON.stringify(result)).not.toContain('No model selected');
    const ended = session.frames.find(
      (frame) =>
        frame.type === 'tool_execution_end' && frame.toolName === 'task',
    );
    expect(ended).toMatchObject({
      isError: false,
      result: { details: { fixture: 'delegate-stand-in', input } },
    });
    const observations = readFileSync(messages, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(observations).toEqual([
      {
        role: 'fixture-observation',
        kind: 'branch-at-handoff',
        branch: 'feature/film-approval',
        input,
      },
    ]);
    expect(f.observed().some((o) => o.kind === 'sub')).toBe(false);
  } finally {
    session.stop();
    await session.done;
    server.close();
    f.dispose();
  }
}, 60_000);

it('seen red (0094): rejects the delegate failure as the subject report opening topic', async () => {
  const scenario: Scenario = JSON.parse(
    readFileSync(join(here, 'scenarios.json'), 'utf8'),
  ).find((item: Scenario) => item.number === 23);
  const { recording }: { recording: Recording } = JSON.parse(
    readFileSync(
      join(here, 'recordings/23/negative-delegate-failure.json'),
      'utf8',
    ),
  );
  expect(rubricPrompt(scenario, recording)).toContain(
    'Delegate: the illustrator could not start.',
  );
  expect(
    Object.entries(assess(scenario, recording))
      .filter(([, pass]) => !pass)
      .map(([id]) => id),
  ).toEqual(['conclusion-first']);
  const batch = await judgeBatch(check(scenario), Array(5).fill(recording), {
    atLeast: 4,
    of: 5,
  });
  // Explicit opt-in demonstrates red; the normal offline run proves rejection.
  expect(batch.passed).toBe(process.env.EXECUTION_RED === '1');
});
