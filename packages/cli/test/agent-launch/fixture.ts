import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { expect, inject } from 'vitest';

/** A scratch home and project with cratylus installed for omp from the packed
 *  packages: the installed extension is loaded in process by the tests, never
 *  by starting omp. */
export interface Fixture {
  root: string;
  home: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  extension: string;
  dispose(): void;
}
export function fixture(): Fixture {
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
  // An allowlist, not credential-variable guessing: no product owner's configuration
  // or environment reaches the installation.
  const env = {
    HOME: home,
    PWD: cwd,
    PATH: `${join(prefix, 'node_modules/.bin')}:${dirname(process.execPath)}:${process.env.PATH}`,
    LANG: 'C.UTF-8',
    TERM: 'dumb',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
  };
  const installed = spawnSync(
    'cratylus',
    ['install', '--harness', 'omp', '--home', home, '--model-roles', 'default'],
    { cwd, env, encoding: 'utf8', timeout: 60_000 },
  );
  if (installed.error) throw installed.error;
  expect(installed.status, installed.stderr + installed.stdout).toBe(0);
  return {
    root,
    home,
    cwd,
    env,
    extension: join(home, '.cratylus/omp/extensions/cratylus.ts'),
    dispose: () => rmSync(root, { recursive: true, force: true }),
  };
}
