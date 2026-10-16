import './omp-mocks.js';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Ajv, type AnySchema } from 'ajv';
import { expect } from 'vitest';
import { type Fixture, fixture } from '../../agent-launch/fixture.js';
import { parseYaml } from '../../yaml.js';
import { omp } from './omp-mocks.js';

export const roles = [
  'architect',
  'illustrator',
  'lead',
  'check-writer',
  'builder',
  'reviewer',
];
export const story = {
  story: 'film',
  slice: 'The creative approves a finished film.',
  why: 'A film is released only once its creative has approved it.',
  acceptanceCriteria: [
    "The creative's approval of a finished film is recorded.",
  ],
  outOfScope: [],
  path: 'plain',
  review: 'Ask: each change reviewed before it joins.',
  cost: 'One task.',
  examples: ['film-production/1'],
  decisions: ['0081'],
};
export const outcome = {
  story: 'film',
  criteria: [
    {
      criterion: "The creative's approval of a finished film is recorded.",
      holds: true,
      evidence:
        'film-production/1: the approval is recorded once the creative approves',
    },
  ],
  meaningQuestions: [],
  followUps: ['Approval could be exercised with another creative.'],
  cost: {
    agentRuns: { total: 3, byRole: { builder: 1, reviewer: 1, lead: 1 } },
    tokens: 127,
    elapsed: '14m',
  },
};
export const assignment = (value: unknown) =>
  `\`\`\`assignment\n${JSON.stringify(value)}\n\`\`\``;
export const task = (agent: string, value: unknown, id = 'handoff-1') => ({
  type: 'tool_call',
  toolName: 'task',
  toolCallId: id,
  input: {
    agent,
    tasks: [
      {
        id: 'one',
        description: 'Realize the confirmed story',
        agent,
        task: assignment(value),
      },
    ],
  },
});
export function parse(text: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  expect(match, 'installed declaration has omp frontmatter').not.toBeNull();
  return {
    frontmatter: parseYaml(match![1]!) as Record<string, unknown>,
    body: match![2]!,
  };
}
export function declaration(f: Fixture, role: string) {
  const filePath = join(f.home, '.cratylus/omp/agents', `${role}.md`);
  const text = readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parse(text);
  return {
    ...frontmatter,
    name: role,
    filePath,
    source: 'user',
    systemPrompt: body,
    model: [frontmatter.model],
    thinkingLevel: frontmatter['thinking-level'],
    autoloadSkills: frontmatter.autoloadSkills,
    frontmatter,
    text,
  };
}
export function command(f: Fixture, ...args: string[]) {
  const result = spawnSync('cratylus', args, {
    cwd: f.cwd,
    env: f.env,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) throw result.error;
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}
export function succeeds(f: Fixture, ...args: string[]) {
  const result = command(f, ...args);
  expect(
    result.code,
    `missing capability operation: cratylus ${args.join(' ')}\n${result.stderr}${result.stdout}`,
  ).toBe(0);
  return JSON.parse(result.stdout);
}
export function git(f: Fixture, ...args: string[]) {
  const result = spawnSync('git', args, {
    cwd: f.cwd,
    env: f.env,
    encoding: 'utf8',
  });
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.trim();
}
export function write(f: Fixture, path: string, text: string) {
  const file = join(f.cwd, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}
export function bindingFixture() {
  const f = fixture();
  git(f, 'init', '-q', '--initial-branch=feature/film');
  git(f, 'config', 'user.name', 'Binding check');
  git(f, 'config', 'user.email', 'binding@example.invalid');
  git(f, 'config', 'core.hooksPath', '/dev/null');
  write(
    f,
    'design/examples/film-production/film.md',
    '1. (approval) **Given** a finished film, **when** the creative approves, **then** its approval is recorded.\n',
  );
  succeeds(
    f,
    'concepts',
    'context',
    'film-production',
    '--subject',
    'Creative film approval',
  );
  succeeds(
    f,
    'concepts',
    'define',
    'approval',
    '--context',
    'film-production',
    '--wording',
    'The creative accepts a finished film.',
    '--reason',
    'Fixture Given',
  );
  git(f, 'add', '--', 'design');
  git(f, 'commit', '-qm', 'Fixture Given');
  return f;
}
// The pinned validator, with mutation disabled. This checks the actual output JSON Schema
// published to omp, never a second test-authored deliverable schema.
export function outputValidator(f: Fixture, role: string) {
  const schema = declaration(f, role).frontmatter.output;
  expect(
    schema,
    `${role}: deliverable is bound as the harness's output schema, never prose`,
  ).toBeDefined();
  return new Ajv({
    allErrors: true,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    strict: false,
  }).compile(schema as AnySchema);
}
export interface RegisteredTool {
  name: string;
  parameters: { properties: { verb: { enum: string[] } } };
  execute(
    id: string,
    args: Record<string, unknown>,
    signal: undefined,
    update: undefined,
    ctx: unknown,
  ): Promise<unknown>;
}
export interface HookResult {
  block?: boolean;
  reason?: string;
  [key: string]: unknown;
}
type Handler = (
  event: unknown,
  ctx: unknown,
) => HookResult | undefined | Promise<HookResult | undefined>;
export interface LoadedExtension {
  fire(event: string, payload?: unknown): Promise<HookResult | undefined>;
  tools: RegisteredTool[];
  activeTools: unknown[];
  handlers: Map<string, Handler[]>;
  pi: Record<string, unknown>;
  ctx: {
    cwd: string;
    agent: { kind: string; name: string };
    model: { provider: string; id: string };
    modelRegistry: object;
    ui: {
      setStatus(): void;
      notify(text: string, level?: string): void;
    };
    sessionManager: { getSessionId(): string };
  };
  /** Every notice the extension showed, in order. */
  notices: { text: string; level?: string }[];
  restore(): void;
}
export async function load(
  f: Fixture,
  options: {
    role?: string;
    kind?: 'main' | 'sub';
    dispatchTool?: string;
  } = {},
): Promise<LoadedExtension> {
  const previous = { PATH: process.env.PATH, HOME: process.env.HOME };
  process.env.PATH = f.env.PATH;
  process.env.HOME = f.home;
  omp.parse = parse;
  omp.agents = roles.map((role) => declaration(f, role));
  omp.args = { model: 'fixture/base', thinking: 'low' };
  const handlers = new Map<string, Handler[]>();
  const tools: RegisteredTool[] = [];
  const activeTools: unknown[] = [];
  const notices: { text: string; level?: string }[] = [];
  const ctx = {
    cwd: f.cwd,
    agent: { kind: options.kind ?? 'main', name: options.role ?? 'main' },
    model: { provider: 'fixture', id: 'base' },
    modelRegistry: {},
    ui: {
      setStatus: () => {},
      notify: (text: string, level?: string) => {
        notices.push({ text, level });
      },
    },
    sessionManager: { getSessionId: () => 'binding-session' },
  };
  const pi = {
    getAllTools: () => [
      {
        name: options.dispatchTool ?? 'task',
        parameters: {
          type: 'object',
          properties: {
            agent: { type: 'string' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agent: { type: 'string' },
                  task: { type: 'string' },
                  id: { type: 'string' },
                },
                required: ['agent', 'task', 'id'],
              },
            },
          },
          required: ['tasks'],
        },
      },
    ],
    typebox: { Type: { Unsafe: (schema: unknown) => schema } },
    registerTool: (tool: RegisteredTool) => tools.push(tool),
    registerFlag: () => {},
    getFlag: (name: string) =>
      name === 'agent' && options.kind !== 'sub' ? options.role : undefined,
    on: (event: string, fn: Handler) =>
      handlers.set(event, [...(handlers.get(event) ?? []), fn]),
    setModel: async () => {},
    setThinkingLevel: () => {},
    setActiveTools: (names: unknown) => activeTools.push(names),
  };
  try {
    // Installed projection is created under a fresh temporary home at runtime.
    const factory = (await import(f.extension)).default;
    await factory(pi);
    const fire = async (event: string, payload: unknown = {}) => {
      let answer: HookResult | undefined;
      for (const fn of handlers.get(event) ?? []) {
        const result = await fn(payload, ctx);
        if (result !== undefined) answer = result;
        if (result?.block) break;
      }
      return answer;
    };
    await fire('session_start');
    return {
      fire,
      tools,
      activeTools,
      handlers,
      pi,
      ctx,
      notices,
      restore: () => {
        process.env.PATH = previous.PATH;
        process.env.HOME = previous.HOME;
      },
    };
  } catch (error) {
    process.env.PATH = previous.PATH;
    process.env.HOME = previous.HOME;
    throw error;
  }
}
