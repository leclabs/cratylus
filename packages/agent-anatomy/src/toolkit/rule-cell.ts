// `RuleCell` — the first-class `rule` source-cell shape (MODEL `Kind ∋ rule`,
// `activation: rule↦scope`). A rule is HARNESS-AGNOSTIC SOURCE: the harness is
// orthogonal until `deploy(c,adapter) = inject(content(c), realize(scope,adapter))`.
//
// STATUS: `rule` is a LIVE KIND with ONE corpus instance — `src/rules/repo-preamble.ts`
// (the repo-root `AGENTS.md`). This became possible when the `AGENTS.md@node` dream
// memory-sink route was RETIRED (`src/skills/dream.ts` no longer routes any record to a
// node/plan `AGENTS.md`): a repo-root `AGENTS.md` is no longer SelfAuthored memory, so
// `SelfAuthored ∉ Target` no longer bars it, and it projects as a byte-locked rule
// TARGET (the earlier S4 conversion — reverted when the sink still existed — now holds).
// A per-NODE/per-PLAN `AGENTS.md` is simply gone (no sink); a rule cell targets only a
// curated instruction file (today, the root), never a memory sink.
//
// The cell carries TWO separable things:
//   1. `definiens` — the σ*-signified canonical identity. This is what `accept()`
//      / REFLEXIVE gates; it is R=LLM and BLIND-decodes to the rule's intent.
//   2. `body` — the VERBATIM directive payload (the byte-anchor), regenerated to
//      `targetPath` by `project-targets` and byte-locked.

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
