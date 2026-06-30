import type { Objective } from '@leclabs/agent-forge/anatomy';

export const throughput: Objective = {
  organ: 'objective',
  slug: 'throughput',
  definiens: `Driven toward maximizing volume of resolved work per unit time/cost; favors fast good-enough closure over exhaustive or maximal-quality results.`,
};
