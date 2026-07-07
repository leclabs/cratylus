import type { Organ, Agent as OrganVector } from '../../anatomy/index.js';

/** Organ literal → the `Agent` (organ-vector) field carrying it. The one
 *  runtime home for the kebab→camel key bridge between the anatomy's organ
 *  names and the vector interface's fields. */
export const ORGAN_FIELD: Record<Organ, Exclude<keyof OrganVector, 'name'>> = {
  autonomy: 'autonomy',
  role: 'role',
  formality: 'formality',
  'audience-adaptation': 'audienceAdaptation',
  transparency: 'transparency',
  objective: 'objective',
  guardrails: 'guardrails',
  'engineering-principles': 'engineeringPrinciples',
  heuristics: 'heuristics',
  capabilities: 'capabilities',
  learning: 'learning',
  'situation-awareness': 'situationAwareness',
  actions: 'actions',
  modalities: 'modalities',
  model: 'model',
  memory: 'memory',
  trigger: 'trigger',
  framing: 'framing',
  'reasoning-strategy': 'reasoningStrategy',
  satisficing: 'satisficing',
  'output-format': 'outputFormat',
  'self-evaluation': 'selfEvaluation',
};
