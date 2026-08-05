// fixture-register — the corpus half of `conform` for the E6 stories.
//
// `conform` (register = ρ = LLM) is judged against a CORPUS's human-register
// doctrine, injected as `Policy.register`: the engine holds no marker lexicon and
// no thresholds, because a lexicon is a claim about one natural language and the
// two floors are a calibration swept from one corpus's prose. Each E6 story plays
// the operating agent, so it supplies this exactly as canon's `canonPolicy` does.

import type { RegisterPolicy } from '../../../src/core/exemplify/index.js';

export const FIXTURE_REGISTER: RegisterPolicy = {
  humanMarkers: [
    /\bplease\b/gi,
    /\bthanks?\b/gi,
    /\bthank you\b/gi,
    /\bhi there\b/gi,
    /\bwelcome\b/gi,
    /\bfeel free\b/gi,
    /\bdid we mention\b/gi,
    /\bwe (?:would|really|care|repeat|prefer|like|appreciate)\b/gi,
    /\bremember to\b/gi,
    /\bso, /gi,
    /\bagain: /gi,
    /\ba lot\b/gi,
    /!(?=\s|$)/g,
  ],
  humanHitFloor: 3,
  humanDensityFloor: 0.02,
};
