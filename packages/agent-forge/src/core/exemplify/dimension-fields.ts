import type {
  Dimension,
  Agent as DimensionVector,
  Enforcing,
  Value,
} from '../../anatomy/index.js';
import { enforcing } from '../../anatomy/index.js';

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

/**
 * Every enforcing value an agent composes, across every dimension.
 *
 * Iterates `DIMENSION_FIELD` rather than listing fields, so a new dimension is
 * covered the day it is declared. Lives beside that map because it IS that map's
 * only non-trivial consumer, and a second hand-kept list of dimensions would be
 * another thing to go stale — the defect the binding exists to remove.
 *
 * The one home for "what does this agent enforce?": the projection asks it to
 * derive scope, and the claude adapter asks it to emit that agent's hooks. Two
 * callers, one answer, so the SOUL and the mechanism cannot disagree.
 */
export function enforcingValuesOf(
  agent: DimensionVector,
): Enforcing<Dimension>[] {
  const out: Enforcing<Dimension>[] = [];
  for (const field of Object.values(DIMENSION_FIELD)) {
    const v = (agent as unknown as Record<string, unknown>)[field];
    if (v === null || v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      const value = item as Value<Dimension>;
      if (enforcing(value)) out.push(value);
    }
  }
  return out;
}
