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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scenario as ExecutionScenario } from './execution-roles/check.js';
import * as execution from './execution-roles/runner.js';
import type { Scenario as ArchitectScenario } from './reconstitution/architect/check.js';
import * as architect from './reconstitution/architect/runner.js';
import type { Scenario as RoleScenario } from './reconstitution/roles/check.js';
import * as roles from './reconstitution/roles/runner.js';
import type * as JudgeHarness from './rubric-judge.js';

const control = vi.hoisted(() => ({
  root: '',
  home: '',
  calls: [] as { role: string | undefined; args: string[] }[],
  model: undefined as { provider: string; id: string; api: string } | undefined,
}));
const body =
  'Fixture role\n### procedure\n- **reconstitution** — recover the design\n';
vi.mock('node:os', async (original) => ({
  ...(await original<typeof OS>()),
  homedir: () => control.home,
}));
vi.mock('node:child_process', async (original) => ({
  ...(await original<typeof ChildProcess>()),
  spawnSync: () => ({ status: 0, stdout: 'feature/fixture\n', stderr: '' }),
}));
vi.mock('./agent-launch/fixture.js', () => ({
  fixture: () => ({
    root: control.root,
    home: control.home,
    cwd: join(control.root, 'project'),
    env: {},
    extension: join(control.home, '.cratylus/omp/extensions/cratylus.ts'),
    dispose() {},
    declaration({ name, body }: { name: string; body: string }) {
      mkdirSync(join(control.home, '.omp/agent/agents'), { recursive: true });
      writeFileSync(
        join(control.home, '.omp/agent/agents', `${name}.md`),
        body,
      );
    },
  }),
}));
vi.mock('./rubric-judge.js', async (original) => ({
  ...(await original<typeof JudgeHarness>()),
  runSession: async (
    _binary: string,
    args: string[],
    options: { env: Record<string, string> },
  ) => {
    const roleIndex = args.indexOf('--agent');
    const role = roleIndex < 0 ? undefined : args[roleIndex + 1];
    control.calls.push({ role, args });
    // The installed cratylus.ts module, not omp itself, registers --agent.
    if (
      roleIndex >= 0 &&
      !args.includes(join(control.home, '.cratylus/omp/extensions/cratylus.ts'))
    )
      return { status: 1, stdout: '', stderr: 'unknown flag: --agent' };
    const declaration = role
      ? readFileSync(
          join(
            control.home,
            role === 'rubric-judge' || role === 'film-agent'
              ? '.omp/agent/agents'
              : '.cratylus/omp/agents',
            `${role}.md`,
          ),
          'utf8',
        )
      : '';
    const judge = !role || role === 'rubric-judge';
    const session = args.includes(
      join(control.home, '.cratylus/omp/extensions/cratylus-session.ts'),
    );
    writeFileSync(
      options.env.EXECUTION_WIRING!,
      JSON.stringify({
        prompt: [
          declaration,
          ...(session && !judge ? ['# Session start: reconstitution'] : []),
        ],
        active: judge ? [] : ['read'],
        tools: judge ? [] : [{ name: 'read', parameters: { type: 'object' } }],
        model: control.model,
      }),
    );
    writeFileSync(
      options.env.EXECUTION_MESSAGES!,
      `${JSON.stringify({ role: 'assistant', provider: 'anthropic', model: 'subject', content: '{"criterion":{"pass":true,"evidence":"Observed"}}' })}\n`,
    );
    return { status: 0, stdout: '', stderr: '' };
  },
}));

const common = {
  number: 1,
  title: 'Extension wiring control',
  example: 'The criterion holds.',
  prompt:
    '```assignment\n{"cut":"fixture","concepts":["context/concept"],"examples":["context/1"],"decisions":["decision"]}\n```',
  files: { 'design/concepts.md': '' },
  clauses: [
    {
      id: 'criterion',
      binds: ['criterion holds'],
      rubric: 'The criterion holds.',
    },
  ],
};
const architectScenario: ArchitectScenario = {
  ...common,
  ref: 'workflow/1',
  role: 'architect',
  commands: [],
};
const roleScenario: RoleScenario = {
  ...common,
  ref: 'workflow/1',
  role: 'builder',
  setup: [],
};
const executionScenario: ExecutionScenario = { ...common, role: 'builder' };
const runners = [
  {
    name: 'architect',
    preflight: (output: string) =>
      architect.preflight(architectScenario, output),
    live: (output: string) => architect.liveRun(architectScenario, output),
  },
  {
    name: 'roles',
    preflight: (output: string) => roles.preflight(roleScenario, output),
    live: (output: string) => roles.liveRun(roleScenario, output),
  },
  {
    name: 'execution-roles',
    preflight: (output: string) =>
      execution.preflight(executionScenario, output),
    live: (output: string) => execution.liveRun(executionScenario, output),
  },
];
beforeEach(() => {
  control.root = mkdtempSync(join(tmpdir(), 'runner-extensions-'));
  control.home = join(control.root, 'home');
  control.calls = [];
  control.model = {
    provider: 'fixture',
    id: 'installed-architect',
    api: 'openai-completions',
  };
  mkdirSync(join(control.root, 'project'));
  const directory = join(control.home, '.cratylus/omp/extensions');
  mkdirSync(directory, { recursive: true });
  for (const filename of [
    'cratylus.ts',
    'cratylus-session.ts',
    'extra.mjs',
    'notes.txt',
  ])
    writeFileSync(join(directory, filename), 'Offline installation control');
  mkdirSync(join(control.home, '.cratylus/omp/agents'));
  for (const role of ['architect', 'builder'])
    writeFileSync(
      join(control.home, '.cratylus/omp/agents', `${role}.md`),
      body,
    );
  vi.stubEnv('EXECUTION_LIVE', '1'); // Every session is intercepted; no model can run.
  vi.stubEnv('EXECUTION_JUDGE_MODEL', 'openai-codex/judge');
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(control.root, { recursive: true, force: true });
});

describe.each(runners)(
  '$name installed-extension wiring',
  ({ name, preflight, live }) => {
    it('loads every installed subject module, including session guards, without host discovery', async () => {
      await preflight(join(control.root, 'inspection'));
      const args = control.calls[0]!.args;
      const modules = args.flatMap((value, index) =>
        value === '--extension' ? [args[index + 1]] : [],
      );
      for (const name of ['cratylus.ts', 'cratylus-session.ts', 'extra.mjs'])
        expect(modules).toContain(
          join(control.home, '.cratylus/omp/extensions', name),
        );
      expect(modules).not.toContain(
        join(control.home, '.cratylus/omp/extensions/notes.txt'),
      );
      expect(args).toContain('--no-extensions');
      expect(modules.some((path) => path?.endsWith('/observe.ts'))).toBe(true);
      expect(
        modules.some((path) => path?.endsWith('/delegate-stand-in.ts')),
      ).toBe(name !== 'execution-roles');
      if (name !== 'execution-roles')
        expect(
          modules.some((path) => path?.endsWith('/handoff-observe.ts')),
        ).toBe(true);
    });
    it('keeps the flag-registering module but excludes session hooks from the rubric judge', async () => {
      const result = await live(join(control.root, 'run'));
      expect(result).toMatchObject({ judgment: { status: 'judged' } });
      const judge = control.calls.find(
        (call) => !call.role || call.role === 'rubric-judge',
      );
      expect(judge).toBeDefined();
      expect(judge!.args).toContain('--no-extensions');
      const installed = judge!.args.filter((arg) =>
        arg.startsWith(join(control.home, '.cratylus/omp/extensions/')),
      );
      expect(installed).toEqual([
        join(control.home, '.cratylus/omp/extensions/cratylus.ts'),
      ]);
      expect(
        judge!.args.some((path) => path.endsWith('/delegate-stand-in.ts')),
      ).toBe(false);
    });
  },
);

describe('architect native history restoration', () => {
  const scenario: ArchitectScenario = {
    ...architectScenario,
    history: [{ user: 'Recover the design.', assistant: 'I recovered it.' }],
  };

  it('seeds native history with the model resolved by the installed architect', async () => {
    await architect.liveRun(scenario, join(control.root, 'run'));
    const resumed = control.calls.find((call) =>
      call.args.includes('--resume'),
    )!;
    const file = resumed.args[resumed.args.indexOf('--resume') + 1]!;
    const entries = readFileSync(file, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const selected = entries.find((entry) => entry.type === 'model_change');
    expect(selected).toMatchObject({ model: 'fixture/installed-architect' });
    const messages = entries.filter((entry) => entry.type === 'message');
    expect(messages[0].parentId).toBe(selected.id);
    expect(messages[1].parentId).toBe(messages[0].id);
    expect(messages[1].message).toMatchObject({
      role: 'assistant',
      provider: 'fixture',
      model: 'installed-architect',
      api: 'openai-completions',
      content: [{ type: 'text', text: scenario.history![0]!.assistant }],
      stopReason: 'stop',
    });
    expect(control.calls[0]!.args).not.toContain('--model');
  });

  it('preflights the resumed history without masking model restoration with a CLI override', async () => {
    await architect.preflight(scenario, join(control.root, 'inspection'));
    const resumed = control.calls.find((call) =>
      call.args.includes('--resume'),
    );
    expect(resumed).toBeDefined();
    expect(resumed!.args).not.toContain('--model');
    expect(control.calls.every((call) => call.role === 'architect')).toBe(true);
  });

  it('refuses to manufacture model metadata when inspection did not resolve a model', async () => {
    control.model = undefined;
    await expect(
      architect.liveRun(scenario, join(control.root, 'run')),
    ).rejects.toThrow('resolved architect model');
    expect(control.calls.some((call) => call.args.includes('--resume'))).toBe(
      false,
    );
  });
});
