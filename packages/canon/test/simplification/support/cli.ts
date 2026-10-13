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

/** `cratylus <args>` that must succeed, its stdout. */
export function ok(cwd: string, args: readonly string[], agent?: string) {
  const r = cratylus(cwd, args, { agent });
  if (r.status !== 0)
    throw new Error(`cratylus ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
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

/** The names a fixture cut is built from. */
export const LANTERN = {
  context: 'harbour',
  concept: 'mooring',
  cut: 'lantern',
  branch: 'feature/lantern',
  architect: 'keeper',
  examples: 'design/examples/harbour/lantern.md',
  check: 'checks/lantern.test.ts',
  helper: 'checks/berth-helper.ts',
} as const;

/**
 * A git repository whose context `harbour` defines the concept `mooring`, and
 * whose cut `lantern`, opened on `feature/lantern` (checked out) with `keeper` as
 * its architect, names `mooring` in its examples. With `frozenCheck`, the check
 * `checks/lantern.test.ts`, which imports `checks/berth-helper.ts`, is committed
 * and frozen with the cut.
 */
export function lanternRepository(
  opts: { frozenCheck?: boolean } = {},
): string {
  const repo = join(scratchDir('simplification-'), 'repo');
  mkdirSync(repo);
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.name', 'fixture');
  git(repo, 'config', 'user.email', 'fixture@example.com');
  git(repo, 'config', 'commit.gpgsign', 'false');
  git(repo, 'config', 'core.hooksPath', '/dev/null');
  const L = LANTERN;
  ok(repo, ['concepts', 'context', L.context, '--subject', 'Harbour.']);
  ok(repo, [
    'concepts',
    'define',
    L.concept,
    '--context',
    L.context,
    '--wording',
    'A berth kept for a boat.',
    '--reason',
    'First.',
  ]);
  mkdirSync(join(repo, dirname(L.examples)), { recursive: true });
  writeFileSync(
    join(repo, L.examples),
    `# Examples · ${L.cut}\n\nContext: ${L.context}. Concepts: ${L.concept}.\n\n1. (${L.concept}) **Given** a boat, **when** it berths, **then** it is moored.\n`,
  );
  if (opts.frozenCheck) {
    mkdirSync(join(repo, 'checks'));
    writeFileSync(join(repo, L.helper), 'export const berth = 1;\n');
    writeFileSync(
      join(repo, L.check),
      `import { berth } from './berth-helper.js';\nit('${L.context}/1', () => expect(berth).toBe(1));\n`,
    );
  }
  git(repo, 'add', '-A');
  git(repo, 'commit', '-qm', 'the design');
  git(repo, 'checkout', '-qb', L.branch);
  ok(repo, [
    'workPackage',
    'open',
    '--cut',
    L.cut,
    '--branch',
    L.branch,
    '--architect',
    `${L.context}=${L.architect}`,
  ]);
  if (opts.frozenCheck)
    ok(repo, ['workPackage', 'freeze', '--cut', L.cut, '--check', L.check]);
  return repo;
}

/** The journal entries of `repo`, file name → text. */
export function journalOf(repo: string): Record<string, string> {
  const dir = join(repo, 'design/journal');
  return Object.fromEntries(
    readdirSync(dir).map((f) => [f, readFileSync(join(dir, f), 'utf8')]),
  );
}

/** Every file under `dir` of `repo`, as one text, or '' when there is none. */
export function allTextUnder(repo: string, dir: string): string {
  const at = join(repo, dir);
  let names: string[];
  try {
    names = readdirSync(at, { recursive: true, encoding: 'utf8' });
  } catch {
    return '';
  }
  return names
    .map((n) => {
      try {
        return readFileSync(join(at, n), 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');
}
