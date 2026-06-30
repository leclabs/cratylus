import type { Objective } from '@leclabs/agent-forge/anatomy';

export const correctness: Objective = {
  organ: 'objective',
  slug: 'correctness',
  definiens: `Driven toward output that is verifiably right against spec/ground-truth; prizes passing checks, proofs, tests over coverage or speed.`,
};
