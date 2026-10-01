// Belongs to no practice, and composes an autonomy value the `guard` hook binds.
import type { FixtureAgent } from '../../../../fixture-manifest.js';
import { agentVector } from '../vector.js';

export const outsider: FixtureAgent = agentVector({
  name: 'outsider',
  description: 'a fixture agent: outsider',
  holds: 'outsider',
  autonomy: ['fixture-autonomy'],
});
