import { expect, it } from 'vitest';
import {
  command,
  concept,
  fixture,
  ordered,
  overview,
} from '../../../../../packages/cli/test/reconstitution/overview/fixture.js';

it('held-out workflow/4 — independent root precedes recorded cyclic concepts and the account names their cycle', () => {
  const f = fixture();
  try {
    command(
      f,
      'concepts',
      'context',
      'film-production',
      '--subject',
      'Making and revising films.',
    );
    concept(f, 'revision', 'A change called for by review.', ['review']);
    concept(f, 'review', 'An assessment that calls for revision.', [
      'revision',
    ]);
    concept(f, 'production', 'Making a film.');
    const answer = overview(f);
    expect(
      answer.concepts.map((c) => c.name),
      'production first, revision and review in recorded order, each once',
    ).toEqual(['production', 'revision', 'review']);
    expect(
      answer.cycles,
      'names their cycle, never invents a root',
    ).toHaveLength(1);
    expect(
      new Set(answer.cycles[0]),
      'cycle includes both and only the cyclic concepts',
    ).toEqual(new Set(['revision', 'review']));
    expect(
      answer.concepts.find((c) => c.name === 'revision')?.builtFrom,
      'does not break the cycle to invent a root',
    ).toEqual(['review']);
    expect(answer.concepts.find((c) => c.name === 'review')?.builtFrom).toEqual(
      ['revision'],
    );
    ordered(
      answer.account,
      ['production', 'revision', 'review'],
      'whole before cycle-only concepts',
    );
    expect(
      answer.account,
      'never hides the cycle behind an apparently acyclic account',
    ).toMatch(/cycl(?:e|ic)/i);
  } finally {
    f.dispose();
  }
});
