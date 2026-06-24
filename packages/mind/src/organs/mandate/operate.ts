import type { Mandate } from '@leclabs/koine/anatomy';

export const operate: Mandate = {
  organ: 'mandate',
  slug: 'operate',
  definiens: `Owns running and maintaining a live system in steady state (deploy, monitor, respond, remediate) against operational SLOs; not feature development.`,
};
