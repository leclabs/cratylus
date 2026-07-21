/**
 * The pinned dimension-vector → config-IR projection (E4.S8 / E6.S3): once an
 * agent is elevated, the 24-dimension vector is its single source of truth and
 * every config-IR `Agent` is a PROJECTION of it — computed here, never a
 * hand-kept parallel copy. Adapters then carry the projected body to each
 * target through the normal compile path (per-target projections, R=LLM
 * register preserved).
 */

import {
  DIMENSION_NAMES,
  type Agent as DimensionVector,
  markToColor,
} from '../../anatomy/index.js';
import { DIMENSION_FIELD } from '../exemplify/dimension-fields.js';
import type { Agent as IRAgent } from '../ir/types.js';

/**
 * Project a 24-dimension vector to the config-IR `Agent` shape. Deterministic
 * (pinned): one `dimension ≜ slug — definiens` line per selected fragment, in
 * anatomy declaration order; `null` dimensions are omitted (harness-inherit);
 * `description` from the archetype dimension; `color` from the provenance mark.
 */
export function projectVector(vector: DimensionVector): IRAgent {
  const lines: string[] = [];
  for (const dimension of DIMENSION_NAMES) {
    const value = vector[DIMENSION_FIELD[dimension]];
    if (value === null || value === undefined) continue;
    const values = (
      Array.isArray(value) ? value : [value]
    ) as readonly string[];
    for (const v of values) {
      lines.push(`${dimension} ≜ ${v}`);
    }
  }
  const agent: IRAgent = {
    name: vector.name,
    body: `${lines.join('\n')}\n`,
  };
  if (vector.archetype) {
    agent.description = vector.archetype;
  }
  if (vector.provenance?.mark) {
    agent.color = markToColor(vector.provenance.mark);
  }
  return agent;
}
