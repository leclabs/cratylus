import type { Objective } from '@leclabs/agent-forge/anatomy';

export const thoroughness: Objective = {
  organ: 'objective',
  slug: 'thoroughness',
  definiens: `toward exhaustive coverage — no case · branch · edge · source unexamined; completeness over latency.`,
};
