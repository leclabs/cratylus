import type {
  Anatomy,
  Dimension,
  DimensionFieldName,
  Agent as DimensionVector,
  Enforcing,
  Value,
} from '../../anatomy/index.js';
import { ANATOMY, enforcing, kebabToCamel } from '../../anatomy/index.js';

/**
 * Dimension name → the `Agent` field carrying it, DERIVED from a catalog by the
 * same kebab→camel rule the type level uses.
 *
 * This was 22 hand-written pairs, and its own doc-comment argued against a second
 * hand-kept list of dimensions while being exactly that. There is no list here
 * now: a dimension added to the catalog appears in this map the same moment.
 */
export function dimensionFieldsOf(
  anatomy: Anatomy = ANATOMY,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.keys(anatomy).map((d) => [d, kebabToCamel(d)]),
  );
}

/**
 * The field map of the RESIDENT catalog — the default argument, bound once so a
 * caller who has no catalog to name (and every type-level consumer, which needs
 * the literal-keyed shape) keeps reading one name.
 */
export const DIMENSION_FIELD = dimensionFieldsOf() as {
  readonly [D in Dimension]: DimensionFieldName<D>;
};

/**
 * Every enforcing value an agent composes, across every dimension.
 *
 * Iterates the catalog's fields rather than listing fields, so a new dimension is
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
  anatomy: Anatomy = ANATOMY,
): Enforcing<Dimension>[] {
  const out: Enforcing<Dimension>[] = [];
  for (const field of Object.values(dimensionFieldsOf(anatomy))) {
    const v = (agent as unknown as Record<string, unknown>)[field];
    if (v === null || v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      const value = item as Value<Dimension>;
      if (enforcing(value)) out.push(value);
    }
  }
  return out;
}
