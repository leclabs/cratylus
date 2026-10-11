import { expect } from 'vitest';
import {
  type ExecutionFixture,
  fixture,
  git,
  run,
  write,
} from '../../execution/fixture.js';
export { fixture, git, run, write };
export type { ExecutionFixture };
export const subject = 'Making a film from recorded performances.';
export const relation =
  'Film production asks scheduling for available shooting dates.';
export const meanings = {
  production: 'The making of a film through its shoots.',
  shoot: 'A recording occasion made up of takes.',
  take: 'One uninterrupted recorded performance.',
};
export interface Overview {
  context: string;
  subject: string;
  relation: string;
  concepts: { name: string; meaning: string; builtFrom: string[] }[];
  cycles: string[][];
  openDecisions: { id: string; title: string }[];
  cutsInFlight: { cut: string; phase: string; branch: string }[];
  account: string;
}
export function command<T = unknown>(
  f: ExecutionFixture,
  ...args: string[]
): T {
  const result = run(f, ...args);
  expect(
    result.code,
    `Required capability operation ${args.join(' ')}\n${result.stdout}${result.stderr}`,
  ).toBe(0);
  return JSON.parse(result.stdout) as T;
}
export function concept(
  f: ExecutionFixture,
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
export function seed(f: ExecutionFixture) {
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
export function decision(f: ExecutionFixture) {
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
export function openCut(f: ExecutionFixture, cut = 'film') {
  write(
    f,
    `design/examples/film-production/${cut}.md`,
    '1. (production) Given a film, when made, then its shoots are recorded.\n',
  );
  command(
    f,
    'workPackage',
    'open',
    '--cut',
    cut,
    '--branch',
    'feature/film',
    '--architect',
    'film-production=creative',
  );
  command(
    f,
    'workPackage',
    'submit',
    'shoot',
    '--cut',
    cut,
    '--output',
    'film.txt',
    '--concept',
    'production',
  );
}
export function dispatch(f: ExecutionFixture, cut = 'film') {
  command(
    f,
    'lifecycle',
    JSON.stringify({
      kind: 'dispatched',
      transition: `${cut}-dispatch`,
      cut,
      workPackage: 'shoot',
      role: 'builder',
      run: `${cut}-builder`,
    }),
  );
}
export function overview(f: ExecutionFixture): Overview {
  const answer = command<{ contexts: Overview[] }>(
    f,
    'concepts',
    'overview',
    '--context',
    'film-production',
  );
  expect(
    answer.contexts,
    'the requested context, not cratylus contexts',
  ).toHaveLength(1);
  return answer.contexts[0]!;
}
export function ordered(account: string, texts: string[], binds: string) {
  let previous = -1;
  for (const text of texts) {
    const index = account
      .toLowerCase()
      .indexOf(text.toLowerCase(), previous + 1);
    expect(index, `${binds}: ${text}`).toBeGreaterThan(previous);
    previous = index;
  }
}
