// A fixture agent for the stance-manifest legs: it differs from its sibling in ONE
// thing, whether it composes the value the fixture guard binds.

import type { FixtureAgent } from '../../../fixture-manifest.js';

export const bound: FixtureAgent = {
  name: 'bound',
  description: 'a fixture agent',
  archetype: 'A fixture agent used to exercise composition-scoped enrollment.',
  autonomy: ['mission-command'],
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
  guardrails: ['fixture-guardrail'],
  engineeringPrinciples: null,
  heuristics: null,
  capabilities: null,
  learning: null,
  situationAwareness: null,
  actions: null,
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: null,
  reasoningStrategy: null,
  satisficing: null,
  outputFormat: null,
  selfEvaluation: null,
};
