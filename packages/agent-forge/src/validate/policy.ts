// policy.ts — the corpus POLICY the doctrine-agnostic validate ALGORITHM consumes
// by INJECTION. The engine declares this SHAPE; a corpus (agent-canon) supplies
// the DATA — its palimpsest table, its operator lexicon. NOTHING here is ever
// populated inside the engine: planting a specific palimpsest token, an operator
// glyph, or a repo path in a doctrine-agnostic module would fuse algorithm to one
// corpus's doctrine, the exact coupling this split removes.
//
// The two policy-consuming gates:
//   • CANONICAL (`./accept.ts` `canonical`) reads `palimpsestTokens`.
//   • RESIDUE   (`./residue.ts`)            reads `operators` + `residueOperators`.
// Both take a single `Policy` — one corpus bundle, threaded to each gate.

/** A `[label, matcher]` pair — a corpus-named token class a gate flags by label. */
export type TokenTable = ReadonlyArray<readonly [string, RegExp]>;

/**
 * One operator-lexicon entry the residue grammar reads. Structural subset of the
 * corpus's own operator record (the residue gate needs only the KEY glyphs +
 * `coldVerified` is irrelevant here) — kept as the minimal shape the algorithm
 * consumes so the corpus can pass its richer entries without adaptation.
 */
export interface PolicyOperatorEntry {
  readonly sense: string;
  readonly signature: string;
  readonly coldVerified: boolean;
}

/**
 * The injected corpus policy. `palimpsestTokens` — retired framing tokens a clean
 * cell must not carry (CANONICAL). `operators` — the operator lexicon whose glyph
 * KEYS the σ* residue grammar admits (RESIDUE). `residueOperators` — the
 * value-algebra operators admitted inside a residue span (RESIDUE, the bracketing
 * subset the grammar handles structurally).
 */
export interface Policy {
  readonly palimpsestTokens: TokenTable;
  readonly operators: Readonly<Record<string, PolicyOperatorEntry>>;
  readonly residueOperators: readonly string[];
}
