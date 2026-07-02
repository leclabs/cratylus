import type { SelfEvaluation } from '@leclabs/agent-forge/anatomy';

export const executableTestOracle: SelfEvaluation = {
  organ: 'self-evaluation',
  slug: 'executable-test-oracle',
  definiens: `run against executable ground truth — unit/integration tests · type-checker · linter · compiler · schema validator · assertions; pass/fail by machine execution, not opinion.`,
};
