// A RULE is a working convention an agent follows in whatever project it works in,
// stated once with why it holds. A RULESET is one standard convention's rules, under
// the convention's own name and as the convention itself states them: a project that
// wants a variant states it in its own files.
//
// Both are harness-agnostic data. A corpus offers its rulesets on its plugin; an
// install chooses rules from them, and a harness adapter renders each chosen rule to
// the file its harness loads in every session.

/** One rule: the convention, and why it holds. */
export interface Rule {
  /**
   * The rule's name, unique across the plugin set's rulesets: the name a harness
   * loads it under, and an install chooses it by.
   */
  readonly name: string;
  /** The one line an install shows when offering the rule, and a harness lists it by. */
  readonly description: string;
  /** The convention, stated positively, as the convention itself states it. */
  readonly convention: string;
  /** Why the convention holds. */
  readonly why: string;
}

/** One standard convention's rules, offered whole, rule by rule, or not at all. */
export interface Ruleset {
  /** The convention's own name. Unique in the plugin set. */
  readonly name: string;
  /** The one line an install shows when offering the ruleset. */
  readonly description: string;
  /** The convention's rules, in the order the convention states them. */
  readonly rules: readonly Rule[];
}
