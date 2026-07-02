import type { Role } from '@leclabs/agent-forge/anatomy';

export const review: Role = {
  organ: 'role',
  slug: 'review',
  definiens: `own judging an existing artifact against criteria (correctness · style · security · fit) → verdict + findings; never authors the fix.`,
};
