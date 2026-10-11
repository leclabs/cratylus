import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, inject } from 'vitest';
import { repositoryRoot } from '../concept-journal/fixture.js';

export const here = dirname(fileURLToPath(import.meta.url));
export const shellTools = ['bash', 'read', 'write', 'edit', 'grep', 'glob'];
export type Args = Record<string, unknown>;
export interface ToolInfo {
  name: string;
  description: string;
  label?: string;
  sourceInfo: { path: string };
  parameters: {
    type: string;
    required?: string[];
    properties: Record<string, Record<string, unknown>>;
  };
}
export interface ToolResult {
  isError?: boolean;
  content: { type: string; text?: string }[];
}
export interface Wiring {
  active: string[];
  registered: { name: string; path: string }[];
  tools: ToolInfo[];
  results: { args: Args; approval: string; result: ToolResult }[];
  observerError?: string;
}
export interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
}
export interface Host {
  root: string;
  prefix: string;
  home: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  install: CommandResult;
  placed: Record<string, string>;
  command(args: string[], directory?: string): CommandResult;
  concepts<T = Record<string, unknown>>(...args: string[]): T;
  modules(): string[];
  launchArgs(explicit?: boolean): string[];
  inspect(
    calls?: Args[],
    names?: string[],
    directory?: string,
    explicit?: boolean,
  ): Wiring;
  offered(wiring: Wiring, names?: string[]): ToolInfo;
  call(args: Args, directory?: string): Wiring['results'][number];
  seed(): unknown;
  dispose(): void;
}
declare module 'vitest' {
  export interface ProvidedContext {
    capabilityPrefix: string;
  }
}
export function run(
  executable: string,
  args: string[],
  cwd: string,
  env = process.env,
  timeout = 60_000,
) {
  const r = spawnSync(executable, args, {
    cwd,
    env,
    input: '',
    encoding: 'utf8',
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}
export function success(r: CommandResult) {
  expect(r.code, r.stderr + r.stdout).toBe(0);
  return r.stdout;
}
// Architect's check ruling, 2026-10-10: bind one tool per capability the
// installed runtime explains, not a closed list of today's capabilities.
export function runtimeCapabilityTools(command: Host['command']): string[] {
  const help = success(command(['--help']));
  const section = help.split(/^Capabilities:\s*$/m)[1]?.split(/^\S.*:\s*$/m)[0];
  expect(section, 'runtime help declares its capabilities').toBeDefined();
  const commands = [...section!.matchAll(/^\s{2}([A-Za-z][\w-]*)\s/gm)].map(
    (match) => match[1]!,
  );
  expect(commands.length).toBeGreaterThan(0);
  return commands
    .flatMap((name) => {
      const result = command([name, '--explain']);
      // Legacy capabilities without an explanation are not adapter tools.
      if (result.code !== 0) return [];
      const explanation = JSON.parse(result.stdout) as { name: string };
      expect(explanation.name).toEqual(expect.any(String));
      return [explanation.name.replace(/ /g, '_')];
    })
    .sort();
}
export function files(root: string, ancestors: string[] = []): string[] {
  if (!existsSync(root)) return [];
  const real = realpathSync(root);
  if (ancestors.includes(real))
    throw new Error(`Installed directory link cycle: ${root}`);
  return readdirSync(root)
    .sort()
    .flatMap((name) => {
      const p = join(root, name);
      return statSync(p).isDirectory() ? files(p, [...ancestors, real]) : [p];
    });
}
export function snapshot(root: string) {
  return Object.fromEntries(
    files(root).map((p) => [
      relative(root, p),
      readFileSync(p).toString('base64'),
    ]),
  );
}
export function host(): Host {
  // The setup's npm install is shared; each test copies the installed artifact,
  // not a workspace tree. Upgrade tests cannot mutate another test's runtime.
  const root = mkdtempSync(join(tmpdir(), 'capability-host-'));
  try {
    return hostIn(root);
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}
function hostIn(root: string): Host {
  const prefix = join(root, 'prefix');
  cpSync(inject('capabilityPrefix'), prefix, {
    recursive: true,
    verbatimSymlinks: true,
  });
  const home = join(root, 'home');
  const cwd = join(root, 'project');
  mkdirSync(home);
  mkdirSync(cwd);
  const env: NodeJS.ProcessEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key, value]) =>
        !/^(?:NODE_PATH|NODE_OPTIONS|PWD|OLDPWD|INIT_CWD|OMP_|PI_|npm_)/.test(
          key,
        ) && !value?.includes(repositoryRoot),
    ),
  );
  env.HOME = home;
  env.PWD = cwd;
  env.NODE_PATH = '';
  env.PATH = [
    join(prefix, 'node_modules/.bin'),
    dirname(process.execPath),
    ...String(process.env.PATH)
      .split(':')
      .filter(
        (p) =>
          p &&
          !resolve(p).startsWith(repositoryRoot) &&
          (!existsSync(p) || !realpathSync(p).startsWith(repositoryRoot)),
      ),
  ].join(':');
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_GLOBAL = '/dev/null';
  env.GIT_TERMINAL_PROMPT = '0';
  for (const args of [
    ['init', '--initial-branch=journal'],
    ['config', 'user.name', 'Capability check'],
    ['config', 'user.email', 'capability@example.test'],
    ['config', 'core.hooksPath', '/dev/null'],
  ])
    success(run('git', args, cwd, env));
  const observer = join(root, 'observe-omp.ts');
  cpSync(join(here, 'observe-omp.ts'), observer);
  const tap = join(root, 'tap-omp.ts');
  cpSync(join(here, 'tap-omp.ts'), tap);
  cpSync(join(here, 'isolation.ts'), join(root, 'isolation.ts'));
  const command = (args: string[], directory = cwd) =>
    run('cratylus', args, directory, env);
  const concepts = <T = Record<string, unknown>>(...args: string[]): T =>
    JSON.parse(success(command(['concepts', ...args])));
  const install = command([
    'install',
    '--harness',
    'omp',
    '--home',
    home,
    '--all',
    '--model-roles',
    'default',
  ]);
  const placed = snapshot(home);
  const extensionRoots = [
    join(home, '.cratylus/omp/extensions'),
    join(home, '.omp/agent/extensions'),
  ];
  // Omp discovers the installed projection and host-owned observer controls.
  const modules = () =>
    extensionRoots.flatMap((root) =>
      files(root).filter((f) => /\.(?:[cm]?js|ts)$/.test(f)),
    );
  let adapter: string | null | undefined;
  const launchArgs = (explicit = true) => [
    '--print',
    '--mode',
    'json',
    '--model',
    'anthropic/claude-opus-5-5',
    '--thinking',
    'medium',
    '--no-skills',
    '--no-rules',
    '--no-lsp',
    '--no-title',
    '--no-pty',
    ...(explicit ? ['--no-extensions'] : []),
    '--extension',
    tap,
    ...(explicit && adapter
      ? [
          '--extension',
          adapter.startsWith(join(home, '.cratylus/omp/'))
            ? join(home, '.cratylus/omp')
            : adapter,
        ]
      : []),
    '--extension',
    observer,
    '--tools',
    shellTools.join(','),
  ];
  function inspect(
    calls: Args[] = [],
    names = ['concept_journal'],
    directory = cwd,
    explicit = true,
  ): Wiring {
    if (explicit && adapter === undefined) {
      const discovery = inspect([], names, directory, false);
      const tool = discovery.tools.find((t) => t.name === names[0]);
      adapter = tool?.sourceInfo.path ?? null;
      if (tool) {
        expect(
          adapter,
          'omp identifies the placed module by provenance',
        ).toBeTruthy();
        expect(modules().map((p) => realpathSync(p))).toContain(
          realpathSync(adapter!),
        );
      }
    }
    const output = join(root, 'wiring.json');
    const requests = join(root, 'calls.json');
    writeFileSync(requests, JSON.stringify(calls));
    rmSync(output, { force: true });
    const result = run('omp', launchArgs(explicit), directory, {
      ...env,
      CAPABILITY_INSPECT: '1',
      CAPABILITY_TOOLS: JSON.stringify(names),
      CAPABILITY_WIRING: output,
      CAPABILITY_CALLS: requests,
    });
    success(result);
    expect(
      existsSync(output),
      `omp observer emitted wiring: ${result.stderr}`,
    ).toBe(true);
    const wiring: Wiring = JSON.parse(readFileSync(output, 'utf8'));
    expect(wiring.observerError).toBeUndefined();
    if (explicit && wiring.tools.some((t) => t.name === 'concept_journal')) {
      expect(
        wiring.registered
          .filter((registration) => registration.path === adapter)
          .map((registration) => registration.name)
          .sort(),
        'the adapter registers one capability tool per runtime capability, exactly once',
      ).toEqual(runtimeCapabilityTools(command));
    }
    return wiring;
  }
  function offered(wiring: Wiring, names = ['concept_journal']) {
    for (const name of names) {
      const tool = wiring.tools.find((t) => t.name === name);
      expect(
        tool,
        `installed omp must offer ${name}; install: ${install.stderr.trim()}`,
      ).toBeDefined();
      expect(tool!.parameters.type).toBe('object');
      expect(Object.keys(tool!.parameters.properties).length).toBeGreaterThan(
        0,
      );
    }
    expect(wiring.active.slice().sort()).toEqual(names.slice().sort());
    return wiring.tools.find((t) => t.name === 'concept_journal')!;
  }
  function call(args: Args, directory = cwd) {
    const wiring = inspect([args], ['concept_journal'], directory);
    offered(wiring);
    expect(wiring.results).toHaveLength(1);
    return wiring.results[0]!;
  }
  const seed = () =>
    concepts('context', 'booking', '--subject', 'Scheduling deliveries.');
  return {
    root,
    prefix,
    home,
    cwd,
    env,
    command,
    concepts,
    install,
    placed,
    modules,
    launchArgs,
    inspect,
    offered,
    call,
    seed,
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}
export function toolText(result: ToolResult) {
  return result.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('\n');
}
export function toolJSON(result: ToolResult) {
  expect(result.isError).not.toBe(true);
  return JSON.parse(toolText(result));
}
export const openDecision = {
  verb: 'decide',
  id: 'window',
  context: 'booking',
  title: 'Delivery windows',
  situation: 'Schedule a delivery.',
  decision: 'Delivery windows are one hour.',
  consequences: 'Plan by the hour.',
  status: 'open',
};
export function seedWindow(h: Host) {
  h.seed();
  h.concepts(
    'define',
    'delivery window',
    '--context',
    'booking',
    '--wording',
    'A two-hour interval.',
    '--reason',
    'Initial design.',
  );
}
export function argv(args: Args): string[] {
  const verb = String(args.verb);
  const positional = ['history', 'define', 'supersede', 'retire'].includes(verb)
    ? 'concept'
    : verb === 'context'
      ? 'context'
      : ['decide', 'accept'].includes(verb)
        ? 'id'
        : undefined;
  return [
    verb,
    ...(positional ? [String(args[positional])] : []),
    ...Object.entries(args)
      .filter(([k]) => k !== 'verb' && k !== positional)
      .flatMap(([k, v]) =>
        Array.isArray(v)
          ? v.flatMap((item) => [`--${k}`, String(item)])
          : typeof v === 'boolean'
            ? v
              ? [`--${k}`]
              : []
            : [`--${k}`, String(v)],
      ),
  ];
}
