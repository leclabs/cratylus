// `RuleCell` — the first-class `rule` source-cell shape (MODEL `Kind ∋ rule`,
// `activation: rule↦scope`). A rule is HARNESS-AGNOSTIC SOURCE: the harness is
// orthogonal until `deploy(c,adapter) = inject(content(c), realize(scope,adapter))`.
//
// STATUS: `rule` is a LIVE KIND with ZERO corpus instances. An `AGENTS.md` at a node
// is NOT a rule deploy target — it is a dream-written SelfAuthored memory sink (the
// `src/skills/dream.ts` law: "An `AGENTS.md` at a node IS the semantic organ at that
// scope; writing it is consolidation"), exempt from REGENERABLE (MODEL
// `SelfAuthored ∉ Target`). Treating repo-root AGENTS.md as a byte-locked rule target
// COLLIDED with that law (the first dream routing a repo-scoped fact reds the
// byte-lock, a deploy clobbers the memory), so that S4 conversion was reverted. This
// type stays as the KIND definition; no cell currently instantiates it.
//
// The cell carries TWO separable things:
//   1. `definiens` — the σ*-signified canonical identity. This is what `accept()`
//      / REFLEXIVE gates; it is R=LLM and BLIND-decodes to the rule's intent.
//   2. `body` — the VERBATIM directive payload (the byte-anchor), regenerated to
//      `targetPath` by `project-targets` and byte-locked. `targetPath` must NOT be
//      any node's `AGENTS.md` (that is a memory sink, per STATUS above).

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
