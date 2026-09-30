// A second agent given the oversized skill, so the warning is once per skill and not per agent.
import type { FixtureAgent } from '../../../fixture-manifest.js';

export const onlyhuge: FixtureAgent = {
  name: 'onlyhuge',
  description: 'a fixture agent given skills',
  archetype:
    'A fixture agent used to exercise the output cap of the launch hook.',
  skills: ['huge'],
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
