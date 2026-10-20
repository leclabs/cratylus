// An agent declaring `a`, `e` and `ghost`: `ghost` names no skill in any
// roster, so it is kept and never expanded.
import type { FixtureAgent } from '../../../../fixture-manifest.js';

export const chain: FixtureAgent = {
  name: 'chain',
  description: 'a fixture agent declaring skills',
  mark: null,
  key: null,
  skills: ['a', 'e', 'ghost'],
  autonomy: [],
  role: [],
  formality: [],
  audienceAdaptation: [],
  transparency: [],
  objective: [],
  guardrails: [],
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
