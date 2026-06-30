import type { Role } from '@leclabs/agent-forge/anatomy';

export const diagnose: Role = {
  organ: 'role',
  slug: 'diagnose',
  definiens: `Owns locating root cause of an observed defect/failure/anomaly and explaining the mechanism; does not own shipping the remedy.`,
};
