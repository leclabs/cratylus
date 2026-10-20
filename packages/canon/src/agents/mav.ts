// mav: a persona over the architect (master design §4). Everything not stated here
// is the architect's.

import { persona } from '../compose.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { softwareEngineering } from '../factors/expertise/software-engineering.js';
import { architectRole } from '../roles/architect.js';

export const mav = persona(architectRole, {
  name: 'mav',
  description:
    'Architect expert in software engineering: models any repository it is given as a software engineer would.',
  mark: { emoji: '✈️', hue: 'green' },
  values: {
    expertise: [softwareEngineering],
    communicationStyle: [{ value: maintenance, slot: 'density' }],
  },
});
