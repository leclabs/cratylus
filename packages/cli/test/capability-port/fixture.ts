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
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, inject } from 'vitest';

export const here = dirname(fileURLToPath(import.meta.url));
/** The repository's own root, which an installed host must never reach into. */
const repositoryRoot = fileURLToPath(new URL('../../../..', import.meta.url));
export type Args = Record<string, unknown>;
export interface ToolResult {
  isError?: boolean;
  content: { type: string; text?: string }[];
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
    ['init', '--initial-branch=main'],
    ['config', 'user.name', 'Capability check'],
    ['config', 'user.email', 'capability@example.test'],
    ['config', 'core.hooksPath', '/dev/null'],
  ])
    success(run('git', args, cwd, env));
  const command = (args: string[], directory = cwd) =>
    run('cratylus', args, directory, env);
  const install = command([
    'install',
    '--harness',
    'omp',
    '--home',
    home,
    '--model-roles',
    'default',
  ]);
  const placed = snapshot(home);
  return {
    root,
    prefix,
    home,
    cwd,
    env,
    command,
    install,
    placed,
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
