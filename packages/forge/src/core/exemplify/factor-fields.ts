import type {
  Enforcing,
  Entry,
  FactorManifest,
  Agent as FactorVector,
} from '@cratylus/schema';
import { enforcing, factorValueOf, kebabToCamel } from '@cratylus/schema';

/**
 * Factor name → the `Agent` field carrying it, DERIVED from a catalog by the
 * same kebab→camel rule the type level uses — for every factor that occupies a
 * field, i.e. every one whose arity is not `attribute` (an attribute rides the
 * entries of the others and has no field of its own).
 *
 * There is no list here, and no resident catalog to default to: a caller states
 * WHICH catalog it reads, and a factor added to that catalog appears in this map
 * the same moment.
 */
export function factorFieldsOf(
  manifest: FactorManifest,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(manifest)
      .filter(([, meta]) => meta.arity !== 'attribute')
      .map(([d]) => [d, kebabToCamel(d)]),
  );
}

/**
 * Every enforcing value an agent composes, across every factor, read off the
 * VALUE of each entry it holds.
 *
 * Iterates the catalog's fields rather than listing fields, so a new factor is
 * covered the day it is declared. Lives beside that map because it IS that map's
 * only non-trivial consumer, and a second hand-kept list of factors would be
 * another thing to go stale — the defect the binding exists to remove.
 *
 * The one home for "what does this agent enforce?": the projection asks it to
 * derive scope, and the claude adapter asks it to emit that agent's hooks. Two
 * callers, one answer, so the Target and the mechanism cannot disagree.
 */
export function enforcingValuesOf(
  agent: FactorVector,
  manifest: FactorManifest,
): Enforcing<string>[] {
  const out: Enforcing<string>[] = [];
  for (const field of Object.values(factorFieldsOf(manifest))) {
    const held = factorValueOf(agent, field);
    if (!Array.isArray(held)) continue;
    for (const { value } of held as readonly Entry[]) {
      if (enforcing(value)) out.push(value);
    }
  }
  return out;
}
