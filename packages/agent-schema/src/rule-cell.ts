// `RuleCell` — the generic `rule` source-cell shape (MODEL `Kind ∋ rule`,
// `activation: rule↦scope`). A rule is HARNESS-AGNOSTIC SOURCE: the harness is
// orthogonal until `deploy(c,adapter) = inject(content(c), realize(scope,adapter))`.
//
// The cell carries TWO separable things:
//   1. `definiens` — the σ*-signified canonical identity, the REFLEXIVE/`accept()`
//      target. R=LLM; BLIND-decodes to the rule's intent.
//   2. `body` — the VERBATIM directive payload (the byte-anchor), regenerated to
//      `targetPath` by the consuming corpus and byte-locked.
//
// Doctrine-free TYPE KERNEL: the concrete rule instances live in the consuming
// corpus, not here.

/** A `rule` source cell (source grain), carrying its verbatim directive body. */
export interface RuleCell {
  readonly kind: 'rule';
  /** Stable id (usually `= slug`). */
  readonly id: string;
  /** α(c) — the assigned anchor (the SIGN). */
  readonly slug: string;
  /** σ*-signified canonical identity — the `accept()`/REFLEXIVE target. */
  readonly definiens: string;
  /** The directory scope the rule activates at (repo-relative; `''` = repo root). */
  readonly scope: string;
  /** Repo-relative committed instruction file regenerated from `body` (byte-locked). */
  readonly targetPath: string;
  /** Verbatim directive body — the source of truth for `targetPath`. */
  readonly body: string;
  /** Anchors this cell references (for the CANONICAL orphan-ref witness). */
  readonly refs?: readonly string[];
}
