// ─────────────────────────────────────────────────────────────────────────────
// The design capability PORT — the concept lattice, met in the design's own verbs.
//
// PURE INTERFACE — no implementation. `capabilities/design/` realizes it over the
// design records. Every input names a concept by its anchor, and every output is
// the design's view, rendered text: a caller never sees a record, an envelope, a
// head or a file. Where a merge left one anchor held by more than one concept,
// the view prints each holder's identity beside it as `anchor (identity <id>)`,
// and that printed form is the one input that addresses one holder; it is
// accepted nowhere else.
//
// What the verbs refuse is the domain's law, and a refusal is thrown with a
// message naming the verb that would succeed.
// ─────────────────────────────────────────────────────────────────────────────

/** What an invocation says about the record it writes: who wrote it, why, and
 *  what caused it. The time is the moment of the write. */
export interface Invocation {
  readonly author: string;
  readonly reason: string;
  readonly cause: string;
}

/** A concept as a definition gives it: its anchor, gloss and factors by anchor. */
export interface ConceptInput {
  readonly anchor: string;
  readonly gloss: string;
  readonly factors: readonly string[];
}

/** A whole-state version given as a change: each field given replaces the
 *  concept's, and each field left out carries over from it. */
export type ConceptChange = Partial<ConceptInput>;

/**
 * The design's verbs. `show` renders the whole lattice or, given an anchor, one
 * concept in full; `trace` renders how a concept came to be, what it stands on
 * and what stands on it. Every write returns the view of what it wrote.
 */
export interface DesignHost {
  show(anchor?: string): string;
  define(concept: ConceptInput, by: Invocation): string;
  /** A new version of the concept, over its current one; amending a withdrawn
   *  concept reinstates it. */
  amend(anchor: string, change: ConceptChange, by: Invocation): string;
  retract(anchor: string, by: Invocation): string;
  /** One version over every version of a diverged concept. A field its versions
   *  agree on carries over; one they disagree on must be given. */
  reconcile(anchor: string, change: ConceptChange, by: Invocation): string;
  trace(anchor: string): string;
}
