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

it('example 8: inspection locates leakage in concepts, decisions and visible examples', () => {
  // Binds “a concept that names a file location”, “a decision that names a command”,
  // “an example that requires a named library” and “each ... warning naming its passage”.
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
    [{ kind: 'decision', context, id: 'readiness' }, 'pnpm test'],
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
});

it.each(['define', 'decide'] as const)(
  'example 9: %s records leakage and shows its warning without refusing it',
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
    expect(answer.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          words: expect.stringContaining(
            verb === 'define' ? 'design/journal/' : 'pnpm test',
          ),
        }),
      ]),
    );
  },
);

it('example 10: a context’s own words raise no warning on append or inspection', () => {
  // Binds the given sentence and “a context’s own words are never leakage”.
  define('check', 'A judgment of whether an example holds.');
  define('recording', 'An account of work that happened.');
  define('example', 'A concrete case of what must hold.');
  const answer = define(
    'acceptance',
    'a check accepts a recording that satisfies its example',
  ) as { warnings?: Warning[] };
  expect(answer.warnings ?? []).toHaveLength(0);
  const inspected = concepts('leakage', '--context', context) as {
    warnings: Warning[];
  };
  expect(
    inspected.warnings.some(
      ({ passage }) =>
        passage.kind === 'concept' &&
        passage.context === context &&
        passage.name === 'acceptance',
    ),
  ).toBe(false);
});
