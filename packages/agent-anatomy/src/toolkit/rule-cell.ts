// `RuleCell` — the first-class `rule` source-cell shape (MODEL `Kind ∋ rule`,
// `activation: rule↦scope`). A rule is HARNESS-AGNOSTIC SOURCE: the harness is
// orthogonal until `deploy(c,adapter) = inject(content(c), realize(scope,adapter))`.
//
// The cell carries TWO separable things:
//   1. `definiens` — the σ*-signified canonical identity. This is what `accept()`
//      / REFLEXIVE gates; it is R=LLM and BLIND-decodes to the rule's intent.
//   2. `body` — the VERBATIM directive payload (the byte-anchor). The committed
//      `<scope>/AGENTS.md` at `targetPath` is a DEPLOY-OWNED target regenerated
//      from this body (`pnpm anatomy:project:targets`) and byte-locked by
//      `test/hook-rule-boundary.test.ts` (REGENERABLE). The claude adapter realizes
//      `scope` → a `<dir>/AGENTS.md` the harness loads for that subtree.
//
// The `body` is R=human operator-facing directive prose carried verbatim as the
// projection payload; the reader-density gate (ρ=LLM) scans organ/skill surfaces,
// NOT rule bodies — the canonical-densification of AGENTS.md bodies is a later lane.

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
  /** Repo-relative committed `AGENTS.md` regenerated from `body` (byte-locked). */
  readonly targetPath: string;
  /** Verbatim directive body — the source of truth for `targetPath`. */
  readonly body: string;
  /** Anchors this cell references (for the CANONICAL orphan-ref witness). */
  readonly refs?: readonly string[];
}
