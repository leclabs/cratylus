// Holds `builder`, the role `lead` dispatches. Dispatches none.
import type { FixtureAgent } from '../../../../fixture-manifest.js';
import { agentVector } from '../vector.js';

export const builder: FixtureAgent = agentVector({
  name: 'builder',
  description: 'a fixture agent: builder',
  holds: 'builder',
  skills: ['tool'],
});
