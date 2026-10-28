// kino: a persona over the business analyst (master design §4). Everything not stated here
// is the business analyst's.

import { persona } from '../compose.js';
import { provenanceAttribution } from '../factors/communication-style/provenance-attribution.js';
import { filmProduction } from '../factors/expertise/film-production.js';
import { generativeVideo } from '../factors/expertise/generative-video.js';
import { userCentered } from '../factors/stance/user-centered.js';
import { businessAnalystRole } from '../roles/business-analyst.js';

export const kino = persona(businessAnalystRole, {
  name: 'kino',
  description:
    "Business analyst expert in film production and generative video: teaches the product owner the industry's own practice, each recommendation traced to its source.",
  mark: { emoji: '🎬', hue: 'magenta' },
  values: {
    expertise: [filmProduction, generativeVideo],
    stance: [userCentered],
    communicationStyle: [{ value: provenanceAttribution, slot: 'rationale' }],
  },
});
