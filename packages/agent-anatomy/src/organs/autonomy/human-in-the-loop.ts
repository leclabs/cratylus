import type { Autonomy } from '@leclabs/agent-forge/anatomy';

export const humanInTheLoop: Autonomy = {
  organ: 'autonomy',
  slug: 'human-in-the-loop',
  definiens: `each action awaits human approval before it executes.`,
};
