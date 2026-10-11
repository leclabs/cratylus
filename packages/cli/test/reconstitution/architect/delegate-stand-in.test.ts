import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';
import { rpc } from '../../agent-launch/fixture.js';
import { provider } from '../../agent-launch/provider.js';
import type { Scenario } from './check.js';
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

it.each([true, false])(
  'preserves task activation (%s), native schema and description, and acknowledges every assignment',
  async (active) => {
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
      getActiveTools: () => (active ? ['read', 'task'] : ['read']),
      registerTool,
    });
    expect(registerTool).not.toHaveBeenCalled();
    start();
    const tool = registerTool.mock.calls[0]![0];
    expect(tool.parameters).toBe(native.parameters);
    expect(tool.description).toBe(native.description);
    expect(tool.defaultInactive).toBe(!active);
    const before = structuredClone(input);
    expect(await tool.execute('dispatch-1', input)).toEqual({
      content: input.tasks.map(() => ({ type: 'text', text: acknowledgement })),
      details: { fixture: 'delegate-stand-in', input },
    });
    expect(input).toEqual(before);
  },
);

it('does not introduce task when the subject has no native task tool', () => {
  const registerTool = vi.fn();
  standIn({
    on: (_event, handler) => handler(),
    getAllTools: () => [],
    getActiveTools: () => ['read'],
    registerTool,
  });
  expect(registerTool).not.toHaveBeenCalled();
});

it.each([
  { name: 'default active task', tools: undefined, hasTask: true },
  { name: 'explicit active task', tools: ['task'], hasTask: true },
  { name: 'inactive task', tools: ['read'], hasTask: false },
])(
  '$name: real omp preserves the offered tools and routes only exposed dispatch',
  async ({ tools, hasTask }) => {
    const scenario: Scenario = JSON.parse(
      readFileSync(join(here, 'scenarios.json'), 'utf8'),
    ).find((item: Scenario) => item.number === 31);
    const f = project(scenario);
    execFileSync('git', ['checkout', '-qb', 'feature/film-approval'], {
      cwd: f.cwd,
      env: f.env,
    });
    let dispatched = false;
    const server = await provider((request) => {
      if (!request.tools?.some((tool) => tool.function.name === 'task'))
        return { text: 'No dispatch capability.' };
      if (dispatched) return { text: 'Assignment acknowledged.' };
      dispatched = true;
      return { tool: 'task', args: input };
    });
    f.models(server.baseUrl);
    f.declaration({
      name: 'fixture-subject',
      body: 'Dispatch the supplied assignments.',
      tools,
      spawns: '*',
    });
    const messages = join(f.root, 'messages.jsonl');
    Object.assign(f.env, {
      EXECUTION_PROJECT: f.cwd,
      EXECUTION_MESSAGES: messages,
    });
    // Active controls use native defaults, as in the live runners, not the
    // fixture.launch() helper's --tools override. Main-session tool selection
    // is operator-owned; declaration.tools alone only narrows child sessions.
    const session = rpc(
      [
        '--mode',
        'rpc',
        '--agent',
        'fixture-subject',
        '--no-session',
        '--no-rules',
        '--no-skills',
        '--no-lsp',
        '--no-title',
        '--no-pty',
        '--no-extensions',
        ...(!hasTask ? ['--tools', 'read'] : []),
        '--extension',
        f.extension,
        '--extension',
        f.observer,
        '--extension',
        join(here, 'delegate-stand-in.ts'),
        '--extension',
        join(here, 'handoff-observe.ts'),
      ],
      f.cwd,
      {
        ...f.env,
        AGENT_LAUNCH_OBSERVATIONS: f.observations,
        AGENT_LAUNCH_INSPECT: '0',
      },
    );
    try {
      const declaration = readFileSync(
        join(f.home, '.cratylus/omp/agents/illustrator.md'),
        'utf8',
      );
      const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(declaration);
      expect(front, 'illustrator has YAML front matter').not.toBeNull();
      const { model } = JSON.parse(
        execFileSync(
          'bun',
          [
            '-e',
            'console.log(JSON.stringify(Bun.YAML.parse(await Bun.stdin.text())))',
          ],
          { cwd: f.cwd, env: f.env, input: front![1], encoding: 'utf8' },
        ),
      );
      expect
        .soft(model, 'illustrator role precedes its profile fallback')
        .toEqual(['@illustrator', '@frontier-other-family:high']);
      expect
        .soft(f.configuration().modelRoles ?? {}, 'install seeds no host roles')
        .toEqual({});
      await session.command({
        type: 'prompt',
        message: 'Dispatch both assignments.',
      });
      await session.waitFor((frame) => frame.type === 'agent_end');
      expect(server.errors).toEqual([]);
      expect(
        server.requests[0]!.tools?.some(
          (tool) => tool.function.name === 'task',
        ) ?? false,
      ).toBe(hasTask);
      if (!hasTask) {
        expect(server.requests).toHaveLength(1);
        expect(
          session.frames.some((frame) => frame.type === 'tool_execution_start'),
        ).toBe(false);
        return;
      }
      expect(server.requests).toHaveLength(2);
      const result = server.requests[1]!.messages.find(
        (m) => m.role === 'tool',
      );
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
  },
  60_000,
);
