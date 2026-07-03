/**
 * The pinned organ-vector → config-IR projection (E4.S8 / E6.S3): once an
 * agent is elevated, the 24-organ vector is its single source of truth and
 * every config-IR `Agent` is a PROJECTION of it — computed here, never a
 * hand-kept parallel copy. Adapters then carry the projected body to each
 * target through the normal compile path (per-target projections, R=LLM
 * register preserved).
 */

import {
  type Fragment,
  ORGAN_NAMES,
  type Agent as OrganVector,
  markToColor,
  personaToDescription,
} from '../../anatomy/index.js';
import { ORGAN_FIELD } from '../exemplify/organ-fields.js';
import type { Agent as IRAgent } from '../ir/types.js';

/**
 * Project a 24-organ vector to the config-IR `Agent` shape. Deterministic
 * (pinned): one `organ ≜ slug — definiens` line per selected fragment, in
 * anatomy declaration order; `null` organs are omitted (harness-inherit);
 * `description` from the persona organ; `color` from the provenance mark.
 */
export function projectVector(vector: OrganVector): IRAgent {
  const lines: string[] = [];
  for (const organ of ORGAN_NAMES) {
    const value = vector[ORGAN_FIELD[organ]];
    if (value === null || value === undefined) continue;
    const fragments = (
      Array.isArray(value) ? value : [value]
    ) as readonly Fragment[];
    for (const f of fragments) {
      lines.push(`${organ} ≜ ${f.slug} — ${f.definiens}`);
    }
  }
  const agent: IRAgent = {
    name: vector.name,
    body: `${lines.join('\n')}\n`,
  };
  if (vector.persona) {
    agent.description = personaToDescription(vector.persona);
  }
  if (vector.provenance?.mark) {
    agent.color = markToColor(vector.provenance.mark);
  }
  return agent;
}
