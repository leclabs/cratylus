// ─────────────────────────────────────────────────────────────────────────────
// THE CAPABILITY INTERFACE — what a capability says of itself when asked to
// explain itself: its name, its purpose and when to reach for it, and for each
// verb the concept it acts on, its purpose, when to reach for it, and that it
// only reads. A verb takes no arguments.
//
// Nothing here is worded. The capability declares its name and when beside its
// verbs; each verb declares its concept, when and effect beside its purpose,
// which its help already prints. This module only reads those declarations out
// as data, so the explanation and the help are one declaration and cannot drift
// apart.
// ─────────────────────────────────────────────────────────────────────────────

import type { Verb, Verbs } from './verbs.js';

/** A verb that explains itself: beyond its purpose, the term of the concept it
 *  acts on, when to reach for it, and that it only reads what its capability
 *  holds. */
export interface ExplainedVerb extends Verb {
  readonly concept: string;
  readonly when: string;
  readonly effect: Effect;
}

/** What a verb does to what its capability holds: it only reads it. */
export type Effect = 'reads';

/** A capability that explains itself: its name, its purpose, when to reach for
 *  it, and its verbs, in the order it declares them. */
export interface CapabilityInterface {
  readonly name: string;
  readonly purpose: string;
  readonly when: string;
  readonly verbs: Verbs<string, ExplainedVerb>;
}

/** One verb, as explained. */
export interface VerbExplanation {
  readonly name: string;
  readonly concept: string;
  readonly purpose: string;
  readonly when: string;
  readonly effect: Effect;
}

/** A capability, as explained. */
export interface Explanation {
  readonly name: string;
  readonly purpose: string;
  readonly when: string;
  readonly verbs: readonly VerbExplanation[];
}

/** Verb `name`, declared as `verb`, as explained. */
export function explainVerb(
  name: string,
  verb: ExplainedVerb,
): VerbExplanation {
  return {
    name,
    concept: verb.concept,
    purpose: verb.purpose,
    when: verb.when,
    effect: verb.effect,
  };
}

/** `capability` as explained, its verbs in the order it declares them. */
export function explain(capability: CapabilityInterface): Explanation {
  return {
    name: capability.name,
    purpose: capability.purpose,
    when: capability.when,
    verbs: Object.entries(capability.verbs).map(([name, verb]) =>
      explainVerb(name, verb),
    ),
  };
}
