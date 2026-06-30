import type { SelfEvaluation } from '@leclabs/agent-forge/anatomy';

export const humanReview: SelfEvaluation = {
  organ: 'self-evaluation',
  slug: 'human-review',
  definiens: `route the output to a person for approval before it stands; the agent gates on explicit human sign-off rather than any automated verdict.`,
};
