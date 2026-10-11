// Black-box execution fixtures. Every command starts the built CLI in a new process.
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';
import {
  type TemporaryRepository,
  git,
  repositoryRoot,
  temporaryRepository,
} from '../concept-journal/fixture.js';

export { git };
export const cut = 'delivery';
export interface Example {
  number: number;
  concepts: string[];
  text: string;
}
export interface Package {
  name: string;
  outputs: string[];
  concepts: string[];
  dependsOn: string[];
  needs: string[];
  state: 'submitted' | 'dispatched' | 'returned';
}
export interface Levels {
  levels: { level: number; packages: Pick<Package, 'name' | 'state'>[] }[];
}
export interface Submission extends Levels {
  cut: string;
  package: Package;
  cycles: string[][];
}
export interface Inventory {
  concepts: { name: string; context: string; servedBy: string[] }[];
  unserved: string[];
  examples: {
    ref: string;
    context: string;
    number: number;
    concepts: string[];
    package: string | null;
  }[];
  unowned: string[];
}
export interface Assignment {
  package: string;
  outputs: string[];
  concepts: string[];
  dependsOn: string[];
  needs: string[];
  examples: (Example & { ref: string; context: string })[];
}
export interface Commit {
  sha: string;
  message: string;
  paths: string[];
}
export interface History {
  commits: Commit[];
}
export interface Round {
  round: number;
  wholeCheckRuns: number;
  failures: string[];
  resolved: string[];
  noProgress: boolean;
}
export interface Check {
  round: number;
  rounds: Round[];
  wholeCheckRuns: number;
}
export interface Efficiency {
  agentRuns: { total: number; byRole: Record<string, number> };
  rounds: number;
  wholeCheckRuns: number;
  tokens: number | null;
  noProgressRounds: number[];
}
export interface ExecutionFixture extends TemporaryRepository {
  home: string;
}
export function fixture(): ExecutionFixture {
  const repository = temporaryRepository();
  const home = join(repository.sandbox, 'home');
  mkdirSync(home);
  return { ...repository, home };
}
export function write(f: ExecutionFixture, path: string, text: string): void {
  const destination = join(f.root, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, text);
}
export function examples(f: ExecutionFixture, entries: Example[]): void {
  write(
    f,
    `design/examples/booking/${cut}.md`,
    `${entries
      .map(
        (entry) =>
          `${entry.number}. (${entry.concepts.join(', ')}) ${entry.text}`,
      )
      .join('\n\n')}\n`,
  );
  command(
    f,
    'open',
    '--branch',
    'feature/delivery',
    '--meaning-holder',
    'booking=operator',
  );
}
export function example(number: number, ...concepts: string[]): Example {
  return {
    number,
    concepts,
    text: `**Given** ${concepts.join(' and ')}, **when** delivery is requested, **then** case ${number} holds.`,
  };
}
export function run(f: ExecutionFixture, ...args: string[]) {
  const result = spawnSync(
    process.execPath,
    [join(repositoryRoot, 'packages/cli/dist/cratylus.js'), ...args],
    {
      cwd: f.root,
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        ...process.env,
        HOME: f.home,
        XDG_CONFIG_HOME: join(f.home, '.config'),
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_TERMINAL_PROMPT: '0',
      },
    },
  );
  if (result.error) throw result.error;
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}
export function command<T>(
  f: ExecutionFixture,
  verb: string,
  ...args: string[]
): T {
  const result = run(f, 'workPackage', verb, '--cut', cut, ...args);
  expect(
    result.code,
    `workPackage ${verb}\n${result.stderr}${result.stdout}`,
  ).toBe(0);
  return JSON.parse(result.stdout) as T;
}
export function log(f: ExecutionFixture): string | null {
  const directory = join(f.root, 'design/ledger');
  return existsSync(directory)
    ? JSON.stringify(
        readdirSync(directory)
          .sort()
          .map((name) => [name, readFileSync(join(directory, name), 'utf8')]),
      )
    : null;
}
export function refuse(
  f: ExecutionFixture,
  verb: string,
  ...args: string[]
): string {
  const before = log(f);
  const result = run(f, 'workPackage', verb, '--cut', cut, ...args);
  const message = `${result.stderr}\n${result.stdout}`;
  // Architect ruling 2026-10-10 (0043): only the named things are fixed,
  // not the exit code, output stream, prefix or number of message lines.
  expect(result.code, message).not.toBeNull();
  expect(result.code, message).not.toBe(0);
  expect(log(f), 'Refusals append nothing').toBe(before);
  return message;
}
export function submit(
  f: ExecutionFixture,
  name: string,
  concepts: string[],
  outputs = [`${name}.txt`],
  dependsOn: string[] = [],
  needs: string[] = [],
): Submission {
  return command(
    f,
    'submit',
    name,
    ...outputs.flatMap((value) => ['--output', value]),
    ...concepts.flatMap((value) => ['--concept', value]),
    ...dependsOn.flatMap((value) => ['--depends-on', value]),
    ...needs.flatMap((value) => ['--needs', value]),
  );
}
export function levelNames(
  answer: Levels,
): { level: number; packages: string[] }[] {
  return answer.levels.map(({ level, packages }) => ({
    level,
    packages: packages.map((p) => p.name).sort(),
  }));
}
// Incidental setup for commit/count examples; dispatch refusals are tested at
// the actual task handoff in rebound.test.ts (0083), never via an agent verb.
export function harnessEvent(
  f: ExecutionFixture,
  kind: 'dispatched' | 'returned',
  role: string,
  runId: string,
  workPackage?: string,
  tokens?: number,
): void {
  const event = {
    kind,
    transition: `${runId}-${kind}`,
    cut,
    role,
    run: runId,
    ...(workPackage === undefined ? {} : { workPackage }),
    ...(tokens === undefined ? {} : { tokens }),
  };
  const result = run(f, 'lifecycle', JSON.stringify(event));
  expect(
    result.code,
    `harness ${kind} capability\n${result.stderr}${result.stdout}`,
  ).toBe(0);
}
