// A minimal agent vector for the projection fixture plugin. Every dimension is
// explicitly empty (`[]`) EXCEPT `guardrails` — the fixture exercises the
// PROJECTION SEAM, not the manifest.
//
// `guardrails` is the one dimension the manifest marks `required`: it is the
// catch-all against attachment failing open. A fixture is exactly the agent such a
// hole would escape through, so it carries a real value rather than an exemption.

import type { FixtureAgent } from '../../../fixture-manifest.js';

export const probe: FixtureAgent = {
  name: 'probe',
  description: 'A fixture agent used to exercise the projection seam.',
  mark: null,
  key: null,
  autonomy: [],
  role: [],
  formality: [],
  audienceAdaptation: [],
  transparency: [],
  objective: [],
  guardrails: [{ value: 'fixture-guardrail', level: 'fixed' }],
  engineeringPrinciples: [],
  heuristics: [],
  capabilities: [],
  learning: [],
  situationAwareness: [],
  actions: [],
  modalities: [],
  model: [],
  memory: [],
  trigger: [],
  framing: [],
  reasoningStrategy: [],
  satisficing: [],
  outputFormat: [],
  selfEvaluation: [],
};
