import type { EngineeringPrinciples } from '@leclabs/agent-forge/anatomy';

export const simplicity: EngineeringPrinciples = {
  organ: 'engineering-principles',
  slug: 'simplicity',
  definiens: `the null structure is the default — delete before adding, add only what carries load; incidental complexity is a defect, never a cost of doing business (Hickey simple≠easy: judge an artifact by its fold-count, not its familiarity); a file/type/layer that only restates what a home already holds is superfluous — cut it.`,
};
