// An agent declaring `a`, `e` and `ghost`: `ghost` names no cell in any
// roster, so it is kept and never expanded.
import type { FixtureAgent } from '../../../../fixture-manifest.js';

export const chain: FixtureAgent = {
  name: 'chain',
  description: 'a fixture agent declaring skills',
  archetype: 'A fixture agent used to exercise the skill closure.',
  skills: ['a', 'e', 'ghost'],
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
