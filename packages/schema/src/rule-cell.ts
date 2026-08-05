// `RuleCell` — the generic `rule` source-cell shape (MODEL `Kind ∋ rule`,
// `activation: rule↦scope`). A rule is HARNESS-AGNOSTIC SOURCE: the harness is
// orthogonal until `deploy(c,adapter) = inject(content(c), realize(scope,adapter))`.
//
// The cell carries TWO separable things:
//   1. `residue` — the σ*-signified canonical identity (`body = ⟨α, residue⟩`), the
//      REFLEXIVE/`accept()` target. R=LLM; BLIND-decodes to the rule's intent.
//   2. `content` — the VERBATIM directive payload (the byte-anchor), regenerated
//      to `targetPath` by the consuming corpus and byte-locked.
//
// ── `definiens` vs `residue`: TWO OBJECTS, NOT TWO NAMES ────────────────────────
//
// This field was called `definiens` while its sibling `HookCell` called the same
// thing `residue`, and a test existed only to write `definiens: c.residue` across
// the seam. MODEL already separates the two, and the separation is what settles the
// direction:
//
//   `MODEL.md:50` — PARSIMONIOUS: body(c) = ⟨α(c), residue(c)⟩ ∧ residue(c) = D(c) ∖ fired(α(c))
//
// `D` and `residue` are DIFFERENT OBJECTS, related by a subtraction:
//
//   definiens ≜ D(c)             the raw post-`≜` text, BEFORE fired(α) is subtracted
//   residue   ≜ D(c) ∖ fired(α)  a payload that has ALREADY PAID that subtraction
//
// THE DISAMBIGUATION RULE. A field is `residue` iff PARSIMONIOUS quantifies over it —
// it is the cell's σ*-signified identity, authored to carry only what its anchor does
// not already fire. A field is `definiens` iff it is the UN-ADJUDICATED input a split
// produced — raw text handed to a witness that has yet to decide what the anchor
// fires. Both signs are live and correct; they name opposite sides of one subtraction.
//
// TWO SITES CORRECTLY KEEP `definiens`, and neither is this one:
//   · the ρ-class `dimension-definiens` (`canon/test/reader-density.test.ts`) — the
//     post-`≜` text a dimension value's body splits into, pre-subtraction by
//     construction; `splitBody` is the splitter.
//   · `AcceptCell.definiens` (`forge/src/validate/accept.ts`) — the witness INPUT,
//     the thing `parsimonious()` reads in order to decide. Renaming it would make
//     that leg read as checking that a residue is a residue.
//
// ── `body` vs `content`: A COALESCE, NOT A MINT ────────────────────────────────
//
// The verbatim payload field was called `body`, and `body` is TAKEN: MODEL binds it
// to the WHOLE cell — `Enforcing.body` with `bodyOf()`/`anchorOf()` (`src/index.ts`)
// realize `body(c) = ⟨α(c), residue(c)⟩`. A rule's projected bytes are not that
// pair; they are one part of it, so `body` here fired the wrong prior first.
//
// Nothing was minted to replace it. `HookWorker.content` one file over already
// names this concept under the same gloss — verbatim bytes, the source of truth for
// `targetPath` — and `HarnessProjection` returns `{filename, content}` for the same
// sense. The sign was DISCOVERED by coalescing onto the established local idiom.
//
// THE STRUCTURAL PROOF. With `definiens`→`residue` landed, a rule and a hook carry
// the SAME TRIPLE, differing only in how they pack it:
//
//   RuleCell    ⊇ ⟨residue, content, targetPath⟩   packed in one cell
//   HookCell    ⊇ ⟨residue, …⟩                     identity on the cell,
//   HookWorker  ⊇ ⟨content, targetPath⟩            payload per worker
//
// A rule is the degenerate hook: one worker, no template, no executable bit. Under
// `body` that isomorphism was invisible; under `content` it reads off the fields.
//
// Doctrine-free TYPE KERNEL: the concrete rule instances live in the consuming
// corpus, not here.

/** A `rule` source cell (source grain), carrying its verbatim directive content. */
export interface RuleCell {
  readonly kind: 'rule';
  /** Stable id (usually `= slug`). */
  readonly id: string;
  /** α(c) — the assigned anchor (the SIGN). */
  readonly slug: string;
  /** σ*-signified canonical identity (`body = ⟨α, residue⟩`) — the `accept()` target. */
  readonly residue: string;
  /** The directory scope the rule activates at (repo-relative; `''` = repo root). */
  readonly scope: string;
  /** Repo-relative committed instruction file regenerated from `content` (byte-locked). */
  readonly targetPath: string;
  /** Verbatim directive bytes — the source of truth for `targetPath`. */
  readonly content: string;
  /** Anchors this cell references (for the CANONICAL orphan-ref witness). */
  readonly refs?: readonly string[];
}
