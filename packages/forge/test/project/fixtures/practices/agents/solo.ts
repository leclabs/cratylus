// Holds a role of its own and composes no autonomy value, so no guard binds it.
import type { FixtureAgent } from '../../../../fixture-manifest.js';
import { agentVector } from '../vector.js';

export const solo: FixtureAgent = agentVector({
  name: 'solo',
  description: 'a fixture agent: solo',
  holds: 'solo',
});
