// policy.ts — the corpus POLICY the doctrine-agnostic ENGINE consumes by
// INJECTION. The engine declares this SHAPE; a corpus (canon) supplies the DATA —
// its palimpsest table, its operator lexicon, its language. NOTHING here is ever
// populated inside the engine: planting a specific palimpsest token, an operator
// glyph, an English phrasing, or a repo path in a doctrine-agnostic module would
// fuse algorithm to one corpus's doctrine, the exact coupling this split removes.
//
// The policy-consuming gates:
//   • CANONICAL   (`./accept.ts` `canonical`)      reads `palimpsestTokens`.
//   • RESIDUE     (`./residue.ts`)                 reads `operators` + `residueOperators`.
//   • COLD-ORACLE (`./oracle.ts` `nonceControl`)   reads `noPriorMarkers`.
//   • CONFORM     (`../core/exemplify/register.ts`) reads `register`.
// Each takes a single `Policy` — one corpus bundle, threaded to each gate.

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
 * The corpus's human-register doctrine, read by the `conform` classifier
 * (`../core/exemplify/register.ts`). BOTH halves are corpus data: `humanMarkers`
 * is a lexicon in the corpus's own language, and the two floors are a CALIBRATION
 * against a particular corpus's prose — a different corpus sweeps different
 * numbers. The engine owns only the predicate that reads them.
 */
export interface RegisterPolicy {
  /** Human-register markers: politeness, narrative filler, courtesy address. */
  readonly humanMarkers: readonly RegExp[];
  /** Absolute marker count at or above which a body reads human. */
  readonly humanHitFloor: number;
  /** Markers-per-word at or above which ≥1 hit already reads human. */
  readonly humanDensityFloor: number;
}

/**
 * The injected corpus policy. `palimpsestTokens` — retired framing tokens a clean
 * cell must not carry (CANONICAL). `operators` — the operator lexicon whose glyph
 * KEYS the σ* residue grammar admits (RESIDUE). `residueOperators` — the
 * value-algebra operators admitted inside a residue span (RESIDUE, the bracketing
 * subset the grammar handles structurally). `noPriorMarkers` — the generic-prior
 * "no established meaning" signals a cold reader emits IN THE CORPUS'S OWN
 * LANGUAGE (COLD-ORACLE); an English lexicon is a corpus datum, not an algorithm.
 * `register` — the human-register lexicon + its calibrated floors (CONFORM).
 */
export interface Policy {
  readonly palimpsestTokens: TokenTable;
  readonly operators: Readonly<Record<string, PolicyOperatorEntry>>;
  readonly residueOperators: readonly string[];
  readonly noPriorMarkers: readonly RegExp[];
  readonly register: RegisterPolicy;
}
