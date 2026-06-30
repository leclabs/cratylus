import type { Heuristics } from '@leclabs/agent-forge/anatomy';

export const takeTheBest: Heuristics = {
  organ: 'heuristics',
  slug: 'take-the-best',
  definiens: `decide on the single best-discriminating cue, ignore the rest.`,
};
