// Black-box execution fixtures. Every command starts the built CLI in a new process.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';
import {
  type TemporaryRepository,
  git,
  repositoryRoot,
  temporaryRepository,
} from '../concept-journal/fixture.js';

export { git };
export const cut = 'booking/delivery';
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
  state: 'submitted' | 'dispatched' | 'finished';
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
  concepts: { name: string; servedBy: string[] }[];
  unserved: string[];
  examples: { number: number; concepts: string[]; package: string | null }[];
  unowned: number[];
}
export interface Dispatch {
  level: number;
  packages: {
    name: string;
    outputs: string[];
    concepts: string[];
    examples: number[];
  }[];
  concepts: Inventory['concepts'];
}
export interface Assignment {
  package: string;
  outputs: string[];
  concepts: string[];
  dependsOn: string[];
  needs: string[];
  examples: Example[];
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
    `design/examples/${cut}.md`,
    `${entries
      .map(
        (entry) =>
          `${entry.number}. (${entry.concepts.join(', ')}) ${entry.text}`,
      )
      .join('\n\n')}\n`,
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
  const result = run(f, 'work-package', verb, '--cut', cut, ...args);
  expect(
    result.code,
    `work-package ${verb}\n${result.stderr}${result.stdout}`,
  ).toBe(0);
  return JSON.parse(result.stdout) as T;
}
export function log(f: ExecutionFixture): string | null {
  const common = git(f.root, 'rev-parse', '--git-common-dir').trim();
  const path = join(f.root, common, 'cratylus/work-packages', `${cut}.jsonl`);
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}
export function refuse(
  f: ExecutionFixture,
  verb: string,
  ...args: string[]
): string {
  const before = log(f);
  const result = run(f, 'work-package', verb, '--cut', cut, ...args);
  expect(result.code, result.stderr).toBe(1);
  expect(result.stderr, 'A domain refusal, not an unknown command').toMatch(
    new RegExp(`^work-package ${verb}:`),
  );
  expect(result.stderr.trim().split('\n')).toHaveLength(1);
  expect(result.stdout).toBe('');
  expect(log(f), 'Refusals append nothing').toBe(before);
  return result.stderr;
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
export function dispatch(
  f: ExecutionFixture,
  level: number,
  names: string[],
): Dispatch {
  const answer = command<Dispatch>(f, 'dispatch');
  expect(answer.level).toBe(level);
  expect(answer.packages.map((p) => p.name).sort()).toEqual([...names].sort());
  return answer;
}
