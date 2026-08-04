import type {
  DimensionManifest,
  Agent as DimensionVector,
  Enforcing,
  Value,
} from '@leclabs/agent-schema';
import {
  dimensionValueOf,
  enforcing,
  kebabToCamel,
} from '@leclabs/agent-schema';

/**
 * Dimension name → the `Agent` field carrying it, DERIVED from a catalog by the
 * same kebab→camel rule the type level uses.
 *
 * This was 22 hand-written pairs, and its own doc-comment argued against a second
 * hand-kept list of dimensions while being exactly that. There is no list here
 * now, and no resident catalog to default to: a caller states WHICH catalog it
 * reads, and a dimension added to that catalog appears in this map the same moment.
 */
export function dimensionFieldsOf(
  manifest: DimensionManifest,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.keys(manifest).map((d) => [d, kebabToCamel(d)]),
  );
}

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
  manifest: DimensionManifest,
): Enforcing<string>[] {
  const out: Enforcing<string>[] = [];
  for (const field of Object.values(dimensionFieldsOf(manifest))) {
    const v = dimensionValueOf(agent, field);
    if (v === null || v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      const value = item as Value<string>;
      if (enforcing(value)) out.push(value);
    }
  }
  return out;
}
