import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import {
  runConcepts,
  successful,
  temporaryRepository,
} from '../../../../packages/cli/test/concept-journal/fixture.js';

it('held-out 3: only the quoted tool name is warned about, not the context’s meaning', () => {
  // Binds “names a tool in quoting what the operator said”, “the tool name is
  // warned about” and “the rest is not”. git is the tool named in this fixture.
  const repository = temporaryRepository();
  const home = join(repository.sandbox, 'home');
  mkdirSync(home);
  vi.stubEnv('HOME', home);
  const concepts = (...args: string[]) => {
    const result = runConcepts(repository.root, ...args);
    successful(result, `concepts ${args.join(' ')}`);
    return result.json;
  };
  try {
    concepts(
      'context',
      'workflow',
      '--subject',
      'The practice of checking work.',
    );
    for (const [name, wording] of [
      ['plan', 'The work intended.'],
      ['check', 'A judgment of whether an example holds.'],
      ['recording', 'An account of work that happened.'],
      ['example', 'A concrete case of what must hold.'],
    ]) {
      concepts(
        'define',
        name!,
        '--context',
        'workflow',
        '--wording',
        wording!,
        '--reason',
        'State the meaning.',
      );
    }
    const tool = 'git';
    const situation = `The operator said "keep the plan in ${tool}".`;
    const decision = 'A check accepts a recording that satisfies its example.';
    const consequences = 'The plan states what must hold.';
    concepts(
      'decide',
      'keeping-the-plan',
      '--context',
      'workflow',
      '--title',
      'Keeping the plan',
      '--situation',
      situation,
      '--decision',
      decision,
      '--consequences',
      consequences,
      '--status',
      'open',
    );
    const answer = concepts('leakage', '--context', 'workflow') as {
      warnings: {
        passage: { kind: string; context?: string; id?: string };
        words: string;
      }[];
    };
    const warnings = answer.warnings.filter(
      ({ passage }) =>
        passage.kind === 'decision' &&
        passage.context === 'workflow' &&
        passage.id === 'keeping-the-plan',
    );
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ words: expect.stringContaining(tool) }),
      ]),
    );
    for (const warning of warnings) {
      // Exact span, not a rule name or message: the example excludes warning
      // about any text outside the tool name, even elsewhere in the quotation.
      expect(warning.words).toBe(tool);
      expect(situation).toContain(warning.words);
      expect(decision).not.toContain(warning.words);
      expect(consequences).not.toContain(warning.words);
    }
  } finally {
    vi.unstubAllEnvs();
    repository.dispose();
  }
});
