// A RULE is stated with why it holds. A RULESET is a named set of rules offered
// together at install, taken whole or rule by rule.
//
// Both are harness-agnostic data. The canon carries its rulesets on its plugin; an
// install places the rules chosen from them, and a harness adapter renders each
// placed rule to the file its harness loads in every session.

/** One rule: its statement, and why it holds. */
export interface Rule {
  /**
   * The rule's name, unique across the plugin set's rulesets: the name a harness
   * loads it under, and an install chooses it by.
   */
  readonly name: string;
  /** The one line an install shows when offering the rule, and a harness lists it by. */
  readonly description: string;
  /** The rule, stated positively. */
  readonly statement: string;
  /** Why the rule holds. */
  readonly why: string;
}

/** A named set of rules offered together at install, taken whole or rule by rule. */
export interface Ruleset {
  /** The ruleset's name. Unique in the plugin set. */
  readonly name: string;
  /** The one line an install shows when offering the ruleset. */
  readonly description: string;
  /** The ruleset's rules, in order. */
  readonly rules: readonly Rule[];
}
