// line-worktree behavioral gate — the WorktreeCreate hook cuts the agent's worktree from
// the tip of the bound plan's line, and from nowhere else while it can say so. Drives the
// committed worker (`targets/guardrail/line-worktree.sh`) end to end with crafted stdin,
// a repository it builds itself, and the REAL runtime answering `plan show`.
//
// THE RUNTIME IS REAL. `<root>/bin/cratylus` execs the built CLI against a host config
// emitted from the live `plan` skill, and the plan is bound through the same CLI. A
// stubbed `plan show` would prove the shell can parse a sentence the test wrote; the claim
// of this cell is that it reads the sentence the runtime writes.
//
// THE COMMIT ON THE LINE IS THE CONTROL. Every leg that asserts where a worktree was cut
// from is paired with a commit the line holds and main lacks, so a worker that cut from
// HEAD (or from origin's default branch) is told apart from one that cut from the line.
//
// FAILING IS THE OTHER HARD CASE, and it is never asserted by an exit code alone: a
// worker that exited non-zero after leaving a worktree behind, or after printing a path,
// has not failed loudly, it has failed halfway. Each failing leg reads stdout, the
// worktree list and the disk.

import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claudeHarnessAdapter } from '@cratylus/forge/adapters/claude';
import { emitRuntimeConfig } from '@cratylus/forge/deploy';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CANONICAL_EVENTS } from '../src/manifest.js';
import { plan } from '../src/skills/plan/skill.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = requireRepoRoot(here);
const worker = join(here, '..', 'targets', 'guardrail', 'line-worktree.sh');
const cratylusCli = join(repoRoot, 'packages', 'cli', 'dist', 'cratylus.js');

let root: string;
let repo: string;
let home: string;
let config: string;
/** A PATH holding the tools the worker needs and the runtime shim, and nothing else. */
let toolbin: string;
let withRuntime: string;

const identity = {
  GIT_AUTHOR_NAME: 'fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
  GIT_COMMITTER_NAME: 'fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
};

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...identity },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function put(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
}

/** The path a tool resolves to on the real PATH. */
function resolved(tool: string): string {
  return execFileSync('sh', ['-c', `command -v ${tool}`], {
    encoding: 'utf8',
  }).trim();
}

/** Run the real CLI against the fixture host, as the worker's own `cratylus` would. */
function cli(cwd: string, ...args: string[]): string {
  const res = spawnSync(process.execPath, [cratylusCli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: home, AGENT_RUNTIME_CONFIG: config },
  });
  expect(
    res.status,
    `cratylus ${args.join(' ')} exited ${res.status}: ${res.stderr}`,
  ).toBe(0);
  return res.stdout;
}

const by = ['--author', 't', '--reason', 'r', '--cause', 'c'];

/** A PATH dir holding exactly the tools the worker uses, and the runtime shim if asked. */
function toolDir(name: string, runtime: boolean): string {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  for (const tool of ['git', 'jq', 'sed', 'cat', 'mkdir']) {
    symlinkSync(resolved(tool), join(dir, tool));
  }
  if (runtime) {
    put(
      join(dir, 'cratylus'),
      `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(cratylusCli)} "$@"\n`,
    );
    chmodSync(join(dir, 'cratylus'), 0o755);
  }
  return dir;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'line-worktree-'));
  repo = join(root, 'repo');
  home = join(root, 'home');
  config = join(root, 'runtime.json');
  mkdirSync(home, { recursive: true });

  expect(
    existsSync(cratylusCli),
    `the CLI this fixture shims is absent (${cratylusCli}) — a concurrent build is mid-clean, not a defect in the hook`,
  ).toBe(true);
  emitRuntimeConfig({
    path: config,
    events: CANONICAL_EVENTS,
    harness: claudeHarnessAdapter.name,
    nativeEvents: claudeHarnessAdapter.nativeEvents,
    skills: [plan],
  });

  toolbin = toolDir('toolbin', false);
  withRuntime = toolDir('with-runtime', true);

  mkdirSync(repo, { recursive: true });
  git(repo, 'init', '-q', '-b', 'main');
  put(join(repo, 'main.txt'), 'main\n');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

interface Run {
  readonly stdout: string;
  readonly stderr: string;
  readonly status: number | null;
}

function run(
  input: Record<string, unknown>,
  path: string = withRuntime,
  env: Record<string, string> = {},
): Run {
  const res = spawnSync(resolved('sh'), [worker], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: {
      PATH: path,
      HOME: home,
      AGENT_RUNTIME_CONFIG: config,
      ...env,
    },
  });
  expect(
    res.error,
    `worker failed to spawn: ${res.error?.message}`,
  ).toBeUndefined();
  return { stdout: res.stdout, stderr: res.stderr, status: res.status };
}

const request = (name: string) => ({
  session_id: 'sess-1',
  cwd: repo,
  hook_event_name: 'WorktreeCreate',
  name,
});

/** Bind plan `p` and put a commit on its line that main lacks; return the line's tip. */
function bindLineWithCommit(): string {
  cli(repo, 'design', 'define', 'root', '--gloss', 'the root', ...by);
  cli(
    repo,
    'design',
    'define',
    'leaf',
    '--gloss',
    'a leaf',
    '--factors',
    'root',
    ...by,
  );
  cli(
    repo,
    'plan',
    'add',
    'u1',
    '--plan',
    'p',
    '--plan-realizes',
    'leaf',
    '--realizes',
    'leaf',
    '--intent',
    'x',
    ...by,
  );
  cli(repo, 'plan', 'bind', 'p', ...by);
  const line = join(root, 'repo.plan-p');
  put(join(line, 'line.txt'), 'on the line\n');
  git(line, 'add', '-A');
  git(line, 'commit', '-q', '-m', 'a commit the line holds and main lacks');
  return git(line, 'rev-parse', 'HEAD');
}

const worktrees = (): string[] =>
  git(repo, 'worktree', 'list', '--porcelain')
    .split('\n')
    .filter((l) => l.startsWith('worktree '))
    .map((l) => l.slice('worktree '.length));

const isAncestor = (cwd: string, ancestor: string): boolean =>
  spawnSync('git', ['merge-base', '--is-ancestor', ancestor, 'HEAD'], { cwd })
    .status === 0;

describe('line-worktree — a plan is bound', () => {
  it('cuts the worktree from the tip of the line, on a branch that is neither main nor the line', () => {
    const tip = bindLineWithCommit();
    expect(isAncestor(repo, tip)).toBe(false);

    const { stdout, status, stderr } = run(request('u1'));
    expect(status, stderr).toBe(0);

    // STDOUT IS THE PATH AND NOTHING ELSE: one line, absolute, a worktree of the repo.
    const lines = stdout.split('\n').filter((l) => l !== '');
    expect(lines).toHaveLength(1);
    const path = lines[0] as string;
    expect(isAbsolute(path)).toBe(true);
    expect(worktrees()).toContain(path);

    const branch = git(path, 'rev-parse', '--abbrev-ref', 'HEAD');
    expect(branch).not.toBe('main');
    expect(branch).not.toBe('plan/p');
    expect(isAncestor(path, tip)).toBe(true);
    // The control: what only the line holds is in the worktree.
    expect(readFileSync(join(path, 'line.txt'), 'utf8')).toBe('on the line\n');
  });
});

describe('line-worktree — no plan is bound', () => {
  /** A line main lacks, left unbound: the control that nothing is cut from it. */
  function unboundLine(): string {
    git(repo, 'branch', 'plan/p');
    const side = join(root, 'side');
    git(repo, 'worktree', 'add', '-q', side, 'plan/p');
    put(join(side, 'line.txt'), 'on the line\n');
    git(side, 'add', '-A');
    git(side, 'commit', '-q', '-m', 'on the line');
    const tip = git(side, 'rev-parse', 'HEAD');
    git(repo, 'worktree', 'remove', '--force', side);
    return tip;
  }

  it('cuts from the checkout HEAD where the host sets worktree.baseRef to head, and from nothing on the line', () => {
    const tip = unboundLine();
    put(
      join(repo, '.claude', 'settings.json'),
      `${JSON.stringify({ worktree: { baseRef: 'head' } })}\n`,
    );

    const { stdout, status, stderr } = run(request('u1'));
    expect(status, stderr).toBe(0);
    const path = stdout.trim();
    expect(path).toBe(join(repo, '.claude', 'worktrees', 'u1'));
    expect(worktrees()).toContain(path);
    expect(git(path, 'rev-parse', 'HEAD')).toBe(git(repo, 'rev-parse', 'HEAD'));
    expect(isAncestor(path, tip)).toBe(false);
  });

  it("cuts from origin's default branch where baseRef is not head, as the harness does", () => {
    const origin = join(root, 'origin.git');
    git(root, 'clone', '-q', '--bare', repo, origin);
    git(repo, 'remote', 'add', 'origin', origin);
    git(repo, 'fetch', '-q', 'origin');
    git(repo, 'remote', 'set-head', 'origin', 'main');
    const originTip = git(repo, 'rev-parse', 'origin/main');
    // The session's HEAD moves past origin, so HEAD and origin's default branch differ.
    put(join(repo, 'ahead.txt'), 'ahead\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'ahead of origin');
    expect(git(repo, 'rev-parse', 'HEAD')).not.toBe(originTip);

    const { stdout, status, stderr } = run(request('u2'));
    expect(status, stderr).toBe(0);
    const path = stdout.trim();
    expect(git(path, 'rev-parse', 'HEAD')).toBe(originTip);
    expect(existsSync(join(path, 'ahead.txt'))).toBe(false);
  });
});

describe('line-worktree — a creation it cannot make fails loudly', () => {
  /** The failure's whole footprint: a non-zero exit, no path, no worktree on disk. */
  function expectFailedClean(r: Run): void {
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/^line-worktree: /m);
    expect(worktrees()).toEqual([repo]);
    expect(existsSync(join(repo, '.claude', 'worktrees'))).toBe(false);
  }

  it('with the runtime unreachable, it does not guess that no plan is bound', () => {
    bindLineWithCommit();
    const worktreesBefore = worktrees();
    const r = run(request('u1'), toolbin);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/^line-worktree: .*cannot be known/m);
    expect(worktrees()).toEqual(worktreesBefore);
    expect(existsSync(join(repo, '.claude', 'worktrees'))).toBe(false);
  });

  it('with the runtime failing, it does not guess either', () => {
    expectFailedClean(
      run(request('u1'), withRuntime, {
        AGENT_RUNTIME_CONFIG: join(root, 'absent.json'),
      }),
    );
  });

  it.each(['../escape', 'a/../b', '/abs', '-flag', 'trailing/', 'a b', ''])(
    'refuses the worktree name %j',
    (name) => {
      expectFailedClean(run(request(name)));
    },
  );

  it('refuses a cwd that is no git repository', () => {
    const elsewhere = join(root, 'elsewhere');
    mkdirSync(elsewhere);
    const r = run({ ...request('u1'), cwd: elsewhere });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/not inside a git repository/);
  });
});
