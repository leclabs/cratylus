// Is given `absent`, a skill no cell of the plugin set carries.
import type { FixtureAgent } from '../../../../fixture-manifest.js';
import { agentVector } from '../vector.js';

export const seeker: FixtureAgent = agentVector({
  name: 'seeker',
  description: 'a fixture agent: seeker',
  holds: 'seeker',
  skills: ['absent'],
});
