// Black-box reconstitution fixtures. Every command starts the built CLI in a new process.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';
import {
  type TemporaryRepository,
  git,
  repositoryRoot,
  temporaryRepository,
} from '../../concept-journal/fixture.js';
export { git };
export interface OverviewFixture extends TemporaryRepository {
  home: string;
}
export function fixture(): OverviewFixture {
  const repository = temporaryRepository();
  const home = join(repository.sandbox, 'home');
  mkdirSync(home);
  return { ...repository, home };
}
export function write(f: OverviewFixture, path: string, text: string): void {
  const destination = join(f.root, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, text);
}
export function run(f: OverviewFixture, ...args: string[]) {
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
export const subject = 'Making a film from recorded performances.';
export const relation =
  'Film production asks scheduling for available shooting dates.';
export const meanings = {
  production: 'The making of a film through its shoots.',
  shoot: 'A recording occasion made up of takes.',
  take: 'One uninterrupted recorded performance.',
};
/** One context's design state, as `concepts state` gives it. */
export interface State {
  name: string;
  subject: string;
  relation: string;
  concepts: string[];
  competing: unknown[];
}
export function command<T = unknown>(f: OverviewFixture, ...args: string[]): T {
  const result = run(f, ...args);
  expect(
    result.code,
    `Required capability operation ${args.join(' ')}\n${result.stdout}${result.stderr}`,
  ).toBe(0);
  return JSON.parse(result.stdout) as T;
}
export function concept(
  f: OverviewFixture,
  name: string,
  wording: string,
  builtFrom: string[] = [],
  verb = 'define',
) {
  return command(
    f,
    'concepts',
    verb,
    name,
    '--context',
    'film-production',
    '--wording',
    wording,
    '--reason',
    `${verb} ${name} for the film.`,
    ...builtFrom.flatMap((part) => ['--built-from', part]),
  );
}
export function seed(f: OverviewFixture) {
  command(
    f,
    'concepts',
    'context',
    'film-production',
    '--subject',
    subject,
    '--relation',
    relation,
  );
  // Record parts first: an implementation that dumps journal order must fail.
  concept(f, 'take', meanings.take);
  concept(f, 'shoot', meanings.shoot, ['take']);
  concept(f, 'production', meanings.production, ['shoot']);
  decision(f);
}
export function decision(f: OverviewFixture) {
  return command(
    f,
    'concepts',
    'decide',
    'colour',
    '--context',
    'film-production',
    '--title',
    'Choose the colour treatment',
    '--situation',
    'Colour treatment is unsettled.',
    '--decision',
    'Consider monochrome.',
    '--consequences',
    'The treatment remains to be agreed.',
    '--status',
    'open',
  );
}
export function state(f: OverviewFixture): State {
  const answer = command<{ contexts: State[] }>(
    f,
    'concepts',
    'state',
    '--context',
    'film-production',
  );
  expect(
    answer.contexts,
    'the requested context, not cratylus contexts',
  ).toHaveLength(1);
  return answer.contexts[0]!;
}
/** The ids of the film's open decisions, as `concepts decisions` gives them. */
export function open(f: OverviewFixture): string[] {
  return command<{ decisions: { id: string }[] }>(
    f,
    'concepts',
    'decisions',
    '--context',
    'film-production',
    '--open',
  ).decisions.map((d) => d.id);
}
