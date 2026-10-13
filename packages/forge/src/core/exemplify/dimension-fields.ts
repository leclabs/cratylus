import type {
  DimensionManifest,
  Agent as DimensionVector,
  Enforcing,
  Entry,
} from '@cratylus/schema';
import { dimensionValueOf, enforcing, kebabToCamel } from '@cratylus/schema';

/**
 * Dimension name → the `Agent` field carrying it, DERIVED from a catalog by the
 * same kebab→camel rule the type level uses — for every dimension that occupies a
 * field, i.e. every one whose arity is not `attribute` (an attribute rides the
 * entries of the others and has no field of its own).
 *
 * There is no list here, and no resident catalog to default to: a caller states
 * WHICH catalog it reads, and a dimension added to that catalog appears in this map
 * the same moment.
 */
export function dimensionFieldsOf(
  manifest: DimensionManifest,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(manifest)
      .filter(([, meta]) => meta.arity !== 'attribute')
      .map(([d]) => [d, kebabToCamel(d)]),
  );
}

/**
 * Every enforcing value an agent composes, across every dimension, read off the
 * VALUE of each entry it holds.
 *
 * Iterates the catalog's fields rather than listing fields, so a new dimension is
 * covered the day it is declared. Lives beside that map because it IS that map's
 * only non-trivial consumer, and a second hand-kept list of dimensions would be
 * another thing to go stale — the defect the binding exists to remove.
 *
 * The one home for "what does this agent enforce?": the projection asks it to
 * derive scope, and the claude adapter asks it to emit that agent's hooks. Two
 * callers, one answer, so the Target and the mechanism cannot disagree.
 */
export function enforcingValuesOf(
  agent: DimensionVector,
  manifest: DimensionManifest,
): Enforcing<string>[] {
  const out: Enforcing<string>[] = [];
  for (const field of Object.values(dimensionFieldsOf(manifest))) {
    const held = dimensionValueOf(agent, field);
    if (!Array.isArray(held)) continue;
    for (const { value } of held as readonly Entry[]) {
      if (enforcing(value)) out.push(value);
    }
  }
  return out;
}
