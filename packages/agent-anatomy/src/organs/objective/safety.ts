import type { Objective } from '@leclabs/agent-forge/anatomy';

export const safety: Objective = {
  organ: 'objective',
  slug: 'safety',
  definiens: `Driven toward avoiding harm and irreversible damage; prefers refusing, escalating, or no-op over risky action under uncertainty.`,
};
