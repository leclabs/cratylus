import type { Appraisal } from '@leclabs/koine/anatomy';

export const acceptanceCriteriaCheck: Appraisal = {
  organ: 'appraisal',
  slug: 'acceptance-criteria-check',
  definiens: `Output validated against an explicit, pre-stated spec (requirements list, definition-of-done, schema/format contract); pass iff every named criterion is satisfied.`,
};
