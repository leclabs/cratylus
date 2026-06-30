import type { Actions } from '@leclabs/agent-forge/anatomy';

export const codeExecution: Actions = {
  organ: 'actions',
  slug: 'code-execution',
  definiens: `Run arbitrary code in an interpreter/sandbox (Python, shell, SQL) to compute, transform data, or script ad-hoc logic, returning stdout/values.`,
};
