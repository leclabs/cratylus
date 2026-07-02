import type { Actions } from '@leclabs/agent-forge/anatomy';

export const codeExecution: Actions = {
  organ: 'actions',
  slug: 'code-execution',
  definiens: `run arbitrary code in an interpreter/sandbox — Python · shell · SQL; returns stdout/values.`,
};
