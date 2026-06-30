import type { Autonomy } from '@leclabs/agent-forge/anatomy';

export const humanOutOfTheLoop: Autonomy = {
  organ: 'autonomy',
  slug: 'human-out-of-the-loop',
  definiens: `acts through the full sense-decide-act loop autonomously, no real-time solicitation; the human sets intent before and audits after, never mid-loop.`,
};
