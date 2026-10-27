import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  type TemporaryRepository,
  runConcepts,
  successful,
  temporaryRepository,
} from '../concept-journal/fixture.js';

type Warning = {
  passage: {
    kind: string;
    context?: string;
    name?: string;
    id?: string;
    file?: string;
    number?: number;
  };
  words: string;
  rule: string;
};
let repository: TemporaryRepository;
const context = 'workflow';
function concepts(...args: string[]) {
  const result = runConcepts(repository.root, ...args);
  successful(result, `concepts ${args.join(' ')}`);
  return result.json;
}
function define(name: string, wording: string) {
  return concepts(
    'define',
    name,
    '--context',
    context,
    '--wording',
    wording,
    '--reason',
    'State the meaning.',
  );
}
const decisionArgs = [
  'decide',
  'readiness',
  '--context',
  context,
  '--title',
  'Readiness',
  '--situation',
  'The work must be ready.',
  '--decision',
  'run pnpm test before pushing',
  '--consequences',
  'The work is checked.',
  '--status',
  'open',
];
beforeEach(() => {
  repository = temporaryRepository();
  const home = join(repository.sandbox, 'home');
  mkdirSync(home);
  vi.stubEnv('HOME', home);
  concepts('context', context, '--subject', 'The practice of checking work.');
});
afterEach(() => {
  vi.unstubAllEnvs();
  repository.dispose();
});

it('inspection locates leakage in concepts and visible examples, never a decision', () => {
  // Binds “a concept that names a file location”, “an example that requires a
  // named library” and “each ... warning naming its passage”; a decision
  // records realization and is never inspected.
  define('plan', 'The plan is kept in design/journal/.');
  concepts(...decisionArgs);
  const file = 'design/examples/workflow/readiness.md';
  mkdirSync(join(repository.root, 'design/examples/workflow'), {
    recursive: true,
  });
  writeFileSync(
    join(repository.root, file),
    '# Examples · readiness\n\nContext: workflow.\n\n1. **Given** work, **when** it is checked, **then** it is validated with zod.\n',
  );
  const answer = concepts('leakage', '--context', context) as {
    warnings: Warning[];
  };
  for (const [passage, words] of [
    [{ kind: 'concept', context, name: 'plan' }, 'design/journal/'],
    [{ kind: 'example', file, number: 1 }, 'zod'],
  ] as const) {
    expect(answer.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          passage: expect.objectContaining(passage),
          words: expect.stringContaining(words),
        }),
      ]),
    );
  }
  expect(answer.warnings.map((w) => w.passage.kind)).not.toContain('decision');
});

it.each(['define', 'decide'] as const)(
  '%s records leakage and shows its warning without refusing it',
  (verb) => {
    // Binds “it is recorded”, “the warning is shown to whoever recorded it” and “nothing is refused”.
    const answer = (
      verb === 'define'
        ? define('plan', 'The plan is kept in design/journal/.')
        : concepts(...decisionArgs)
    ) as { warnings?: Warning[] };
    // Read back before checking warnings, so the red result cannot hide a refused append.
    if (verb === 'define') {
      expect(concepts('design', '--context', context)).toMatchObject({
        contexts: expect.arrayContaining([
          expect.objectContaining({
            name: context,
            concepts: expect.arrayContaining([
              expect.objectContaining({
                name: 'plan',
                wording: 'The plan is kept in design/journal/.',
              }),
            ]),
          }),
        ]),
      });
    } else {
      expect(concepts('decisions', '--context', context)).toMatchObject({
        decisions: expect.arrayContaining([
          expect.objectContaining({
            id: 'readiness',
            decision: 'run pnpm test before pushing',
          }),
        ]),
      });
    }
    // A concept's leak is shown; a decision records realization, never warned.
    if (verb === 'define')
      expect(answer.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            words: expect.stringContaining('design/journal/'),
          }),
        ]),
      );
    else expect(answer).not.toHaveProperty('warnings');
  },
);

it('listed tool names are exempt only in the context that owns them', () => {
  // Architect's re-illustration of 2026-10-10: bind “own concepts are named
  // with words the leakage rules list”, “raises no warning” and “the same
  // words in a context that has no such concept are warned about”.
  // omp and git are both listed tool names, not merely ordinary vocabulary.
  const names = ['omp', 'git'];
  concepts(
    'context',
    'delivery',
    '--subject',
    'How the work reaches its harness.',
  );
  for (const name of names) {
    concepts(
      'define',
      name,
      '--context',
      'delivery',
      '--wording',
      'A means by which the work reaches its destination.',
      '--reason',
      'Name a delivery concept.',
    );
  }
  const wording = 'The work reaches omp and git.';
  for (const scope of ['delivery', context]) {
    const appended = concepts(
      'define',
      'reach',
      '--context',
      scope,
      '--wording',
      wording,
      '--reason',
      'State what the work reaches.',
    ) as { warnings?: Warning[] };
    const inspected = concepts('leakage', '--context', scope) as {
      warnings: Warning[];
    };
    const passage = { kind: 'concept', context: scope, name: 'reach' };
    const warnings = inspected.warnings.filter(
      (warning) =>
        warning.passage.kind === passage.kind &&
        warning.passage.context === passage.context &&
        warning.passage.name === passage.name,
    );
    for (const name of names) {
      if (scope === 'delivery') {
        // Only the exempt spans are fixed; unrelated warnings are not forbidden.
        expect
          .soft(
            (appended.warnings ?? []).some(({ words }) => words.includes(name)),
          )
          .toBe(false);
        expect
          .soft(warnings.some(({ words }) => words.includes(name)))
          .toBe(false);
      } else {
        expect
          .soft(appended.warnings)
          .toEqual(
            expect.arrayContaining([
              expect.objectContaining({ words: expect.stringContaining(name) }),
            ]),
          );
        expect.soft(warnings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              passage: expect.objectContaining(passage),
              words: expect.stringContaining(name),
            }),
          ]),
        );
      }
    }
  }
});
