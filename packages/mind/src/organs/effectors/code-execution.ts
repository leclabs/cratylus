import type { Effectors } from '@leclabs/koine/anatomy';

export const codeExecution: Effectors = {
  organ: 'effectors',
  slug: 'code-execution',
  definiens: `Run arbitrary code in an interpreter/sandbox (Python, shell, SQL) to compute, transform data, or script ad-hoc logic, returning stdout/values.`,
};
