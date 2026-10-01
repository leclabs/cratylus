// Dispatches `ghost-role`, which only `phantom` holds.
import type { FixtureAgent } from '../../../../fixture-manifest.js';
import { agentVector } from '../vector.js';

export const orphan: FixtureAgent = agentVector({
  name: 'orphan',
  description: 'a fixture agent: orphan',
  holds: 'orphan',
  dispatches: ['ghost-role'],
});
