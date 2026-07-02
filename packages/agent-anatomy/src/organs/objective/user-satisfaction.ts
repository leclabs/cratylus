import type { Objective } from '@leclabs/agent-forge/anatomy';

export const userSatisfaction: Objective = {
  organ: 'objective',
  slug: 'user-satisfaction',
  definiens: `toward the requester's actual intent + experience; perceived helpfulness · fit · responsiveness over intrinsic metrics.`,
};
