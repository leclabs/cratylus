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
/** A PATH with the runtime shim and no jq. */
let noJq: string;

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

/** What stands for `cratylus` on a PATH: the real CLI, nothing, or a stub with an answer. */
type Runtime = 'real' | 'absent' | { readonly prints: string };

/** A PATH dir holding exactly the tools the worker uses, the runtime as asked, jq if asked. */
function toolDir(
  name: string,
  { runtime, jq }: { runtime: Runtime; jq: boolean },
): string {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  for (const tool of ['git', 'sed', 'cat', 'mkdir', ...(jq ? ['jq'] : [])]) {
    symlinkSync(resolved(tool), join(dir, tool));
  }
  if (runtime !== 'absent') {
    put(
      join(dir, 'cratylus'),
      runtime === 'real'
        ? `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(cratylusCli)} "$@"\n`
        : `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify(runtime.prints)}\n`,
    );
    chmodSync(join(dir, 'cratylus'), 0o755);
  }
  return dir;
}

/** A PATH whose `cratylus` answers `plan show` with this and nothing else. */
let stubs = 0;
const answering = (prints: string): string =>
  toolDir(`stub-${stubs++}`, { runtime: { prints }, jq: true });

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

  toolbin = toolDir('toolbin', { runtime: 'absent', jq: true });
  withRuntime = toolDir('with-runtime', { runtime: 'real', jq: true });
  noJq = toolDir('no-jq', { runtime: 'real', jq: false });

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

/** The names Claude Code gives a subagent's worktree, which is how the implementer's is told. */
const implementerNames = ['agent-a1b2c3d4', 'agent-a0123456789abcdef'];
/** A background session's, a --worktree session's, and names a hair off the subagent's. */
const otherNames = [
  'bridge-3f9a1c',
  'swift-otter-3f2a',
  'u1',
  'agent-a123456',
  'agent-a12345678',
  'agent-b1234567',
  'agent-aABCDEF0',
];

/** The worktree the harness would have made: where, on which branch, from what. */
function expectMadeAsHarness(r: Run, name: string, from: string): string {
  expect(r.status, r.stderr).toBe(0);
  const lines = r.stdout.split('\n').filter((l) => l !== '');
  expect(lines).toHaveLength(1);
  const path = lines[0] as string;
  expect(path).toBe(join(repo, '.claude', 'worktrees', name));
  expect(worktrees()).toContain(path);
  expect(git(path, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe(
    `worktree-${name}`,
  );
  expect(git(path, 'rev-parse', 'HEAD')).toBe(from);
  return path;
}

describe("line-worktree — a plan is bound, the implementer's worktree", () => {
  it.each(implementerNames)(
    'cuts %s from the tip of the line, on a branch that is neither main nor the line',
    (name) => {
      const tip = bindLineWithCommit();
      expect(isAncestor(repo, tip)).toBe(false);

      const { stdout, status, stderr } = run(request(name));
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
      expect(readFileSync(join(path, 'line.txt'), 'utf8')).toBe(
        'on the line\n',
      );
    },
  );
});

describe('line-worktree — a plan is bound, every other worktree', () => {
  it.each(otherNames)(
    'makes %s as the harness would, from HEAD and not from the line, without asking the runtime',
    (name) => {
      const tip = bindLineWithCommit();
      // No runtime on PATH: a worktree that is not the implementer's never needs one.
      const path = expectMadeAsHarness(
        run(request(name), toolbin),
        name,
        git(repo, 'rev-parse', 'HEAD'),
      );
      expect(isAncestor(path, tip)).toBe(false);
      expect(existsSync(join(path, 'line.txt'))).toBe(false);
    },
  );

  it('makes a background session’s worktree from HEAD even with the runtime present', () => {
    const tip = bindLineWithCommit();
    const path = expectMadeAsHarness(
      run(request('bridge-0a1b2c3d')),
      'bridge-0a1b2c3d',
      git(repo, 'rev-parse', 'HEAD'),
    );
    expect(isAncestor(path, tip)).toBe(false);
  });
});

describe("line-worktree — no line to cut the implementer's worktree from", () => {
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

  /** An origin whose default branch the session's HEAD has moved past. */
  function originBehindHead(): string {
    const origin = join(root, 'origin.git');
    git(root, 'clone', '-q', '--bare', repo, origin);
    git(repo, 'remote', 'add', 'origin', origin);
    git(repo, 'fetch', '-q', 'origin');
    git(repo, 'remote', 'set-head', 'origin', 'main');
    const originTip = git(repo, 'rev-parse', 'origin/main');
    put(join(repo, 'ahead.txt'), 'ahead\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'ahead of origin');
    expect(git(repo, 'rev-parse', 'HEAD')).not.toBe(originTip);
    return originTip;
  }

  const setBaseRefHead = (): void =>
    put(
      join(repo, '.claude', 'settings.json'),
      `${JSON.stringify({ worktree: { baseRef: 'head' } })}\n`,
    );

  describe.each([...implementerNames, 'bridge-3f9a1c'])('for %s', (name) => {
    it('with no plan bound, cuts from the checkout HEAD where the host sets worktree.baseRef to head, and from nothing on the line', () => {
      const tip = unboundLine();
      setBaseRefHead();

      const path = expectMadeAsHarness(
        run(request(name)),
        name,
        git(repo, 'rev-parse', 'HEAD'),
      );
      expect(isAncestor(path, tip)).toBe(false);
    });

    it("with no plan bound, cuts from origin's default branch where baseRef is not head, as the harness does", () => {
      const originTip = originBehindHead();
      const path = expectMadeAsHarness(run(request(name)), name, originTip);
      expect(existsSync(join(path, 'ahead.txt'))).toBe(false);
    });
  });

  describe.each(implementerNames)('for the implementer %s', (name) => {
    /** Every way the line cannot be had leaves a bound plan's tip uncut-from. */
    function expectNotFromLine(r: Run, tip: string): void {
      const path = expectMadeAsHarness(r, name, git(repo, 'rev-parse', 'HEAD'));
      expect(isAncestor(path, tip)).toBe(false);
      expect(existsSync(join(path, 'line.txt'))).toBe(false);
    }

    it('with cratylus missing from PATH, makes it as the harness would', () => {
      const tip = bindLineWithCommit();
      expectNotFromLine(run(request(name), toolbin), tip);
    });

    it('with jq missing from PATH, makes it as the harness would, reading the request and baseRef without jq', () => {
      const tip = bindLineWithCommit();
      setBaseRefHead();
      const originTip = originBehindHead();
      const r = run(request(name), noJq);
      const path = expectMadeAsHarness(r, name, git(repo, 'rev-parse', 'HEAD'));
      expect(git(path, 'rev-parse', 'HEAD')).not.toBe(originTip);
      expect(isAncestor(path, tip)).toBe(false);
    });

    it('with the runtime failing, makes it as the harness would', () => {
      const tip = bindLineWithCommit();
      expectNotFromLine(
        run(request(name), withRuntime, {
          AGENT_RUNTIME_CONFIG: join(root, 'absent.json'),
        }),
        tip,
      );
    });

    it.each([
      'plan p (bound) with nothing committed yet',
      'plans a, b at 0123abc: 2 units',
      '',
    ])(
      'with plan show answering a first line it does not know (%j), makes it as the harness would',
      (answer) => {
        const tip = bindLineWithCommit();
        expectNotFromLine(run(request(name), answering(answer)), tip);
      },
    );

    it("with the line's commit unknown to the repository, makes it as the harness would", () => {
      const tip = bindLineWithCommit();
      expectNotFromLine(
        run(
          request(name),
          answering('plan p (bound) at 0123456789abcdef: 1 units'),
        ),
        tip,
      );
    });
  });
});

describe('line-worktree — a creation the harness could not make either fails loudly', () => {
  /** The failure's whole footprint: a non-zero exit, no path, no worktree on disk. */
  function expectFailedClean(r: Run): void {
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/^line-worktree: /m);
    expect(worktrees()).toEqual([repo]);
    expect(existsSync(join(repo, '.claude', 'worktrees'))).toBe(false);
  }

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

  it('refuses a name whose path is taken, leaving what is there alone', () => {
    put(join(repo, '.claude', 'worktrees', 'u1', 'keep.txt'), 'mine\n');
    const r = run(request('u1'));
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/already exists/);
    expect(worktrees()).toEqual([repo]);
    expect(
      readFileSync(
        join(repo, '.claude', 'worktrees', 'u1', 'keep.txt'),
        'utf8',
      ),
    ).toBe('mine\n');
  });
});
