// ─────────────────────────────────────────────────────────────────────────────
// THE REPAIR RULE — which violations a write introduces.
//
// A domain's law broken across entities is incoherence, which only a merge
// produces, because a write that breaks a law on the current branch is refused.
// After a merge the law is already broken, so refusing every write that leaves it
// broken would refuse the very writes that repair it. The rule, one home for every
// domain: a write is refused only when it INTRODUCES a violation, one whose
// entities were not already bound together in a standing violation of the same
// law. A write that shrinks a violation, or leaves it standing, is allowed, so
// every incoherence can be repaired by ordinary writes, one at a time.
//
// The store knows no law and no domain. Each domain computes its own violations
// before and after a write, expresses each as a kind and the entities it binds,
// and keeps its own refusal wording; this module only decides which are new.
// ─────────────────────────────────────────────────────────────────────────────

/** One broken law: which law (`kind`), and the entities it binds together. */
export interface Violation {
  readonly kind: string;
  readonly entities: readonly string[];
}

/**
 * The violations of `after` a write introduces over `standing`, the violations
 * before it: each whose entities are not a subset of the entities of some
 * standing violation of the same kind. Returned as given, in `after`'s order.
 */
export function introduced<V extends Violation>(
  standing: readonly Violation[],
  after: readonly V[],
): V[] {
  return after.filter(
    (v) =>
      !standing.some(
        (s) =>
          s.kind === v.kind && v.entities.every((e) => s.entities.includes(e)),
      ),
  );
}
