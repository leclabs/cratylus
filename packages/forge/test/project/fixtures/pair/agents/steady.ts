// A fixture agent for the omit-agents cases: `steady` installs by default, `offered` declares
// `optional`, so an install offers it without preselecting it.

import type { FixtureAgent } from '../../../../fixture-manifest.js';

export const steady: FixtureAgent = {
  name: 'steady',
  description: 'a fixture agent',
  autonomy: null,
  archetype: 'A fixture agent used to exercise omit-agents.',
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
