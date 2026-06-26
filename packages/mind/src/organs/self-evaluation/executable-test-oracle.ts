import type { SelfEvaluation } from '@leclabs/koine/anatomy';

export const executableTestOracle: SelfEvaluation = {
  organ: 'self-evaluation',
  slug: 'executable-test-oracle',
  definiens: `Output run against an executable ground truth — unit/integration tests, type-checker, linter, compiler, schema validator, assertions — pass/fail decided by machine execution, not opinion.`,
};
