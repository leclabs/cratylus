// mav: a persona over the business analyst (master design §4). Everything not stated here
// is the business analyst's.

import { persona } from '../compose.js';
import { convergence } from '../factors/communication-style/convergence.js';
import { softwareEngineering } from '../factors/expertise/software-engineering.js';
import { businessAnalystRole } from '../roles/business-analyst.js';

export const mav = persona(businessAnalystRole, {
  name: 'mav',
  description:
    'Business analyst expert in software engineering: models any repository it is given as a software engineer would.',
  mark: { emoji: '✈️', hue: 'green' },
  values: {
    expertise: [softwareEngineering],
    communicationStyle: [{ value: convergence, slot: 'density' }],
  },
});
