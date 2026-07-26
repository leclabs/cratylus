// A minimal agent vector for the projection fixture plugin. Every dimension is
// `null` (explicit omit-to-inherit) except the two σ* fields the SOUL always
// carries — the fixture exercises the PROJECTION SEAM, not the anatomy.

import type { Agent } from '../../../../src/anatomy/index.js';

export const probe: Agent = {
  name: 'probe',
  description: 'a fixture agent',
  autonomy: null,
  archetype: 'A fixture agent used to exercise the projection seam.',
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
  guardrails: null,
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
