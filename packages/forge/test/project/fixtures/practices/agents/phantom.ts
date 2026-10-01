// The only holder of `ghost-role`.
import type { FixtureAgent } from '../../../../fixture-manifest.js';
import { agentVector } from '../vector.js';

export const phantom: FixtureAgent = agentVector({
  name: 'phantom',
  description: 'a fixture agent: phantom',
  holds: 'ghost-role',
});
