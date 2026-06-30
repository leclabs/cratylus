import type { SelfEvaluation } from '@leclabs/agent-forge/anatomy';

export const acceptanceCriteriaCheck: SelfEvaluation = {
  organ: 'self-evaluation',
  slug: 'acceptance-criteria-check',
  definiens: `Output validated against an explicit, pre-stated spec (requirements list, definition-of-done, schema/format contract); pass iff every named criterion is satisfied.`,
};
