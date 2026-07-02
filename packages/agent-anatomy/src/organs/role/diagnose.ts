import type { Role } from '@leclabs/agent-forge/anatomy';

export const diagnose: Role = {
  organ: 'role',
  slug: 'diagnose',
  definiens: `own locating the root cause of an observed defect/failure/anomaly + explaining the mechanism; not shipping the remedy.`,
};
