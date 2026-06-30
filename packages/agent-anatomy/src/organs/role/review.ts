import type { Role } from '@leclabs/agent-forge/anatomy';

export const review: Role = {
  organ: 'role',
  slug: 'review',
  definiens: `Owns judging an existing artifact against criteria (correctness, style, security, fit) and returning a verdict + findings; does not author the fix.`,
};
