import type {
  Dimension,
  Agent as DimensionVector,
} from '../../anatomy/index.js';

/** Dimension literal → the `Agent` (dimension-vector) field carrying it. The one
 *  runtime home for the kebab→camel key bridge between the anatomy's dimension
 *  names and the vector interface's fields. */
export const DIMENSION_FIELD: Record<
  Dimension,
  Exclude<keyof DimensionVector, 'name'>
> = {
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
