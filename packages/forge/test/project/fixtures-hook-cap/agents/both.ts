// An agent given a skill that fits the launch hook and one that does not.
import type { FixtureAgent } from '../../../fixture-manifest.js';

export const both: FixtureAgent = {
  name: 'both',
  description: 'a fixture agent given skills',
  archetype:
    'A fixture agent used to exercise the output cap of the launch hook.',
  skills: ['small', 'huge'],
  autonomy: null,
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
  guardrails: [],
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
