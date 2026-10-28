// nico: a persona over the business analyst (master design §4). Everything not stated here
// is the business analyst's.

import { persona } from '../compose.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { terminology } from '../factors/expertise/terminology.js';
import { parsimony } from '../factors/objective/parsimony.js';
import { analytical } from '../factors/stance/analytical.js';
import { zeroTrust } from '../factors/stance/zero-trust.js';
import { businessAnalystRole } from '../roles/business-analyst.js';

export const nico = persona(businessAnalystRole, {
  name: 'nico',
  description:
    'Business analyst expert in terminology: gives each concept of whatever project it is given its Cratylic name, with a precising definition only for the symmetric difference that remains.',
  mark: { emoji: '📐', hue: 'cyan' },
  values: {
    objective: [{ value: parsimony, slot: 'drive' }],
    expertise: [terminology],
    stance: [analytical, zeroTrust],
    communicationStyle: [{ value: maintenance, slot: 'density' }],
  },
});
