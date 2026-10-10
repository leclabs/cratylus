import { spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, inject } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
export interface Declaration {
  name: string;
  body: string;
  model?: string;
  effort?: string | null;
  mark?: string;
  tools?: string[];
  spawns?: string[] | '*';
  skills?: string[];
  readSummarize?: boolean;
  advisor?: boolean | string;
  prewalk?: boolean | string;
}
export interface Observation {
  phase: 'start' | 'turn' | 'context';
  kind: string;
  prompt: string[];
  model: { provider: string; id: string };
  effort: string;
  tools: string[];
  schemas: { name: string; parameters: Record<string, unknown> }[];
  entries: unknown[];
  context: unknown;
  messages?: { role: string; customType?: string; content?: unknown }[];
  prewalkArmed: boolean;
  settings: {
    readSummarize: boolean;
    advisor: boolean;
    advisorModel?: string;
    prewalk: boolean;
    personality: string;
  };
}
export interface Frame {
  type: string;
  id?: string;
  method?: string;
  text?: string;
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}
export interface LaunchOptions {
  agent?: string;
  equals?: boolean;
  tools?: string[];
  extra?: string[];
  inspect?: boolean;
  extension?: string;
  onlyInstalled?: boolean;
  cwd?: string;
  resume?: string;
  modelFlags?: boolean;
  skills?: boolean;
}
export interface Session {
  args: string[];
  frames: Frame[];
  done: Promise<{ code: number | null; stdout: string; stderr: string }>;
  send(command: Record<string, unknown>): string;
  command(command: Record<string, unknown>): Promise<Frame>;
  waitFor(predicate: (frame: Frame) => boolean): Promise<Frame>;
  stop(): boolean;
}
export interface Fixture {
  root: string;
  home: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  extension: string;
  observer: string;
  observations: string;
  models(baseUrl?: string): void;
  configure(config: Record<string, unknown>): void;
  configuration(): Record<string, unknown>;
  declaration(d: Declaration, directory?: string): string;
  launch(options?: LaunchOptions): Session;
  skill(name: string, instructions: string): void;
  observed(): Observation[];
  dispose(): void;
}
export function fixture(
  options: {
    config?: string;
    prepare?(paths: { home: string; cwd: string }): void;
  } = {},
): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'agent-launch-'));
  const home = join(root, 'home');
  const cwd = join(root, 'project');
  const prefix = join(root, 'prefix');
  mkdirSync(home);
  mkdirSync(cwd);
  cpSync(inject('capabilityPrefix'), prefix, {
    recursive: true,
    verbatimSymlinks: true,
  });
  // An allowlist, not credential-variable guessing. No operator configuration,
  // credentials, extensions, agents, model aliases or environment reach omp.
  const env = {
    HOME: home,
    PWD: cwd,
    PATH: `${join(prefix, 'node_modules/.bin')}:${dirname(process.execPath)}:${process.env.PATH}`,
    LANG: 'C.UTF-8',
    TERM: 'dumb',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
  };
  const configFile = join(home, '.omp/agent/config.yml');
  if (options.config !== undefined) {
    mkdirSync(dirname(configFile), { recursive: true });
    writeFileSync(configFile, options.config);
  }
  options.prepare?.({ home, cwd });
  const installed = spawnSync(
    'cratylus',
    [
      'install',
      '--harness',
      'omp',
      '--home',
      home,
      '--all',
      '--model-roles',
      'default',
    ],
    { cwd, env, encoding: 'utf8', timeout: 60_000 },
  );
  if (installed.error) throw installed.error;
  expect(installed.status, installed.stderr + installed.stdout).toBe(0);
  const extension = join(home, '.omp/agent/extensions/cratylus.ts');
  const observer = join(root, 'observe.ts');
  cpSync(join(here, 'observe.ts'), observer);
  const observations = join(root, 'observations.jsonl');
  function models(baseUrl = 'http://127.0.0.1:1/v1') {
    writeFileSync(
      join(home, '.omp/agent/models.yml'),
      JSON.stringify({
        providers: {
          fixture: {
            api: 'openai-completions',
            baseUrl,
            apiKey: 'fixture-key-not-a-credential',
            models: [
              'base',
              'declared',
              'adviser',
              'fast',
              'implementation',
            ].map((id) => ({
              id,
              name: id,
              reasoning: true,
              input: ['text'],
              contextWindow: 128000,
              maxTokens: 2048,
              compat: { supportsReasoningEffort: true },
            })),
          },
        },
      }),
    );
  }
  models();
  function declaration(
    d: Declaration,
    directory = join(home, '.omp/agent/agents'),
  ) {
    mkdirSync(directory, { recursive: true });
    const fields = {
      name: d.name,
      description: `Fixture declaration ${d.name}`,
      model: d.model ?? 'fixture/declared',
      ...(d.effort === null ? {} : { 'thinking-level': d.effort ?? 'high' }),
      ...(d.mark ? { mark: d.mark } : {}),
      ...(d.tools ? { tools: d.tools } : {}),
      ...(d.spawns !== undefined ? { spawns: d.spawns } : {}),
      ...(d.skills ? { 'autoload-skills': d.skills } : {}),
      ...(d.readSummarize !== undefined
        ? { 'read-summarize': d.readSummarize }
        : {}),
      ...(d.advisor !== undefined ? { advisor: d.advisor } : {}),
      ...(d.prewalk !== undefined ? { prewalk: d.prewalk } : {}),
    };
    const file = join(directory, `${d.name}.md`);
    writeFileSync(
      file,
      `---\n${Object.entries(fields)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n')}\n---\n${d.body}\n`,
    );
    return file;
  }
  function launch(options: LaunchOptions = {}) {
    rmSync(observations, { force: true });
    const args = [
      '--mode',
      'rpc',
      ...(options.modelFlags === false
        ? []
        : ['--model', 'fixture/base', '--thinking', 'low']),
      ...(options.skills ? [] : ['--no-skills']),
      '--no-rules',
      '--no-lsp',
      '--no-title',
      '--no-pty',
      ...(options.extension || options.onlyInstalled
        ? ['--no-extensions', '--extension', options.extension ?? extension]
        : []),
      '--extension',
      observer,
      '--tools',
      (options.tools ?? ['read', 'grep']).join(','),
      ...(options.resume ? ['--resume', options.resume] : ['--no-session']),
      ...(options.agent
        ? options.equals
          ? [`--agent=${options.agent}`]
          : ['--agent', options.agent]
        : []),
      ...(options.extra ?? []),
    ];
    return rpc(args, options.cwd ?? cwd, {
      ...env,
      AGENT_LAUNCH_OBSERVATIONS: observations,
      AGENT_LAUNCH_INSPECT: options.inspect === false ? '0' : '1',
    });
  }
  function observed(): Observation[] {
    return existsSync(observations)
      ? readFileSync(observations, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
  }
  return {
    root,
    home,
    cwd,
    env,
    extension,
    observer,
    observations,
    models,
    configure: (config) =>
      writeFileSync(configFile, JSON.stringify(config, null, 2)),
    configuration: () => {
      // Parse the fixture home's actual YAML, including install's edits, with
      // the same Bun YAML parser available to the real omp executable.
      const parsed = spawnSync(
        'bun',
        [
          '-e',
          'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(process.argv[1]).text())))',
          configFile,
        ],
        { cwd, env, encoding: 'utf8', timeout: 10_000 },
      );
      if (parsed.error) throw parsed.error;
      expect(parsed.status, parsed.stderr).toBe(0);
      return JSON.parse(parsed.stdout);
    },
    declaration,
    launch,
    skill: (name, instructions) => {
      const directory = join(cwd, '.omp/skills', name);
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        join(directory, 'SKILL.md'),
        `---\nname: ${name}\ndescription: Fixture skill ${name}\n---\n${instructions}\n`,
      );
    },
    observed,
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}
export function rpc(args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const child = spawn('omp', args, {
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const frames: Frame[] = [];
  let stdout = '';
  let stderr = '';
  let buffer = '';
  let sequence = 0;
  let exited = false;
  const listeners = new Set<() => void>();
  const done = new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      exited = true;
      resolve({ code, stdout, stderr });
      for (const listener of listeners) listener();
    });
  });
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    buffer += chunk;
    for (;;) {
      const end = buffer.indexOf('\n');
      if (end < 0) break;
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      try {
        frames.push(JSON.parse(line));
      } catch {
        /* omp can emit startup diagnostics outside the protocol. */
      }
    }
    for (const listener of listeners) listener();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const deadline = setTimeout(() => child.kill('SIGKILL'), 60_000);
  void done.finally(() => clearTimeout(deadline));
  function waitFor(predicate: (frame: Frame) => boolean): Promise<Frame> {
    return new Promise((resolve, reject) => {
      const check = () => {
        const frame = frames.find(predicate);
        if (frame) {
          listeners.delete(check);
          resolve(frame);
        } else if (exited) {
          listeners.delete(check);
          reject(
            new Error(`omp exited before observation:\n${stderr}${stdout}`),
          );
        }
      };
      listeners.add(check);
      check();
    });
  }
  function send(command: Record<string, unknown>) {
    const id = String(++sequence);
    child.stdin.write(`${JSON.stringify({ ...command, id })}\n`);
    return id;
  }
  async function command(command: Record<string, unknown>) {
    const id = send(command);
    const reply = await waitFor(
      (frame) => frame.type === 'response' && frame.id === id,
    );
    expect(reply.success, JSON.stringify(reply)).toBe(true);
    return reply;
  }
  return {
    args,
    frames,
    done,
    send,
    command,
    waitFor,
    stop: () => child.kill('SIGTERM'),
  };
}
export async function inspect(f: Fixture, options: LaunchOptions = {}) {
  const session = f.launch(options);
  session.send({
    type: 'prompt',
    message: 'Record this turn without contacting a provider.',
  });
  const result = await session.done;
  expect(result.code, result.stderr + result.stdout).toBe(0);
  const turns = f
    .observed()
    .filter((observation) => observation.phase === 'turn');
  expect(turns.length, 'real omp reached before_agent_start').toBeGreaterThan(
    0,
  );
  return {
    observation: turns.at(-1)!,
    frames: session.frames,
    args: session.args,
  };
}
export function status(frames: Frame[]) {
  const active = new Map<unknown, string>();
  for (const frame of frames)
    if (frame.type === 'extension_ui_request' && frame.method === 'setStatus') {
      if (typeof frame.statusText === 'string')
        active.set(frame.statusKey, frame.statusText);
      else active.delete(frame.statusKey);
    }
  return [...active.values()].join('\n');
}
export function carries(observation: Observation, d: Declaration) {
  expect(observation.prompt.join('\n')).toContain(d.body);
  expect(observation.model).toMatchObject({
    provider: 'fixture',
    id: 'declared',
  });
  expect(observation.effort).toBe(d.effort ?? 'high');
}

export const skillInstructions = [
  'When surveying this estuary, count violet buoys before amber buoys.',
  'Report tidal measurements in fathoms beside the silver lighthouse.',
];
export const wholeDeclaration: Declaration = {
  name: 'estuary-chief',
  body: 'Coordinate the quartz estuary survey from the northern observatory.',
  mark: 'EC',
  tools: ['read', 'write', 'task'],
  spawns: ['estuary-east', 'estuary-west'],
  skills: ['buoy-order', 'tidal-units'],
  readSummarize: false,
  advisor: 'fixture/adviser',
  // Distinct from smol: arming omp's default must not satisfy the declaration.
  prewalk: 'fixture/implementation',
};
export const dispatchTargets = [
  'estuary-east',
  'estuary-west',
  'estuary-south',
];
export function wholeFixture() {
  const f = fixture();
  f.configure({
    modelRoles: {
      default: 'fixture/base',
      smol: 'fixture/fast',
      advisor: 'fixture/base',
    },
    defaultThinkingLevel: 'low',
    personality: 'default',
    async: { enabled: false },
    memory: { backend: 'off' },
    read: { summarize: { enabled: true } },
    advisor: { enabled: false },
    prewalk: { enabled: false },
  });
  wholeDeclaration.skills!.forEach((name, index) =>
    f.skill(name, skillInstructions[index]!),
  );
  for (const name of dispatchTargets)
    f.declaration({
      name,
      body: `Only ${name} records the copper tide gauge.`,
      tools: [],
      advisor: false,
      prewalk: false,
    });
  f.declaration(wholeDeclaration);
  return f;
}
