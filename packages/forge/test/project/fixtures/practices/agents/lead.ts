// Holds `steward`, dispatches `builder`, is given `brief` (which composes `base`), and composes an autonomy value — so the `guard` hook binds it.
import type { FixtureAgent } from '../../../../fixture-manifest.js';
import { agentVector } from '../vector.js';

export const lead: FixtureAgent = agentVector({
  name: 'lead',
  description: 'a fixture agent: lead',
  holds: 'steward',
  dispatches: ['builder'],
  skills: ['brief'],
  autonomy: ['fixture-autonomy'],
});
