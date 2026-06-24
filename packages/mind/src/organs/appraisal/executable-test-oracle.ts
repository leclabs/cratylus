import type { Appraisal } from '@leclabs/koine/anatomy';

export const executableTestOracle: Appraisal = {
  organ: 'appraisal',
  slug: 'executable-test-oracle',
  definiens: `Output run against an executable ground truth — unit/integration tests, type-checker, linter, compiler, schema validator, assertions — pass/fail decided by machine execution, not opinion.`,
};
