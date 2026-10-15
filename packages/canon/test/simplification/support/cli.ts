// cratylus's own command, as built, run over scratch repositories these checks build
// themselves. It is cratylus's code and nothing else: no harness, agent or model.

import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { ACTING_AGENT_ENV } from '@cratylus/runtime';
import { ROOT } from './repo.js';

/** The built `cratylus` entry, as its package declares its bin. */
export const CLI = (() => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'packages/cli/package.json'), 'utf8'),
  ) as { name: string; bin: Record<string, string> };
  return join(ROOT, 'packages/cli', manifest.bin[manifest.name] as string);
})();

/** The version the built command answers with. */
export const CLI_VERSION = (
  JSON.parse(readFileSync(join(ROOT, 'packages/cli/package.json'), 'utf8')) as {
    version: string;
  }
).version;

export interface Ran {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** `cratylus <args>` in `cwd`, made by `agent` when one is named. */
export function cratylus(
  cwd: string,
  args: readonly string[],
  opts: { agent?: string; input?: string } = {},
): Ran {
  const env: NodeJS.ProcessEnv = { ...process.env };
  Reflect.deleteProperty(env, ACTING_AGENT_ENV);
  if (opts.agent !== undefined) {
    // Whoever the command takes the maker from, the acting agent or git's own
    // author, it is this one.
    env[ACTING_AGENT_ENV] = opts.agent;
    env.GIT_AUTHOR_NAME = opts.agent;
    env.GIT_COMMITTER_NAME = opts.agent;
  }
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    env,
    encoding: 'utf8',
    input: opts.input,
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

export const git = (cwd: string, ...args: string[]): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

const scratch: string[] = [];
/** Remove every scratch directory made so far. */
export function cleanScratch(): void {
  for (const d of scratch.splice(0))
    rmSync(d, { recursive: true, force: true });
}
export function scratchDir(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  scratch.push(d);
  return d;
}
