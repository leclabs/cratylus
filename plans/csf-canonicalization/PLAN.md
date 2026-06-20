# csf-canonicalization → σ\*\_R reprocessing

**Intent.** Make the substrate actually compute **σ\*\_R(C)**. Correct the canonicalization machine so
"canonical anchor" = **σ\*\_R** (reader-parameterized, not reader-blind), dogfood it to re-anchor every
cell to its **σ\*\_LLM**, and build the layman (**σ*\_human → stored as σ*\_LLM**) self-extension door.

**Why (corrected).** The prior target `canonical_anchor = signum_aptissimum` was **reader-blind** — a
"signum aptissimum" with no R is undefined, the exact latent ambiguity that let anchors drift (blind
audit: ~8/10 sampled filenames non-canonical; two reinvented standard terms). `σ*_R` names the machine
polis already half-built: **projection-at-a-reader-profile = computing σ\*\_R(C)** (cells = C, profile = R,
render = σ*\_R(C)). Re-anchoring is σ*\_LLM; the operator door is σ*\_human. See [[prompt-engineering]] (the
identity), [[signifier-star-r]] (the operator σ*\_R + laws), and
[[llm-native-source-human-render-at-boundary]] (internals = σ\*\_LLM; human prose = a boundary render).

**Reference (corrected CSF op chain).**
`resolve → semanticPartition → depalimpsest → distill(primitive ∨ deepestFaithfulComposite)
→ canonical_anchor(= σ*_R) → coalescence(merge same-anchor units) → CSF`
— `σ*_R` supersedes `signum_aptissimum`; **R is named per use**: corpus = LLM, layman door = human→LLM.

**Corpus scope.** The corpus is the **entire `~/workspaces/polis/` content** — `ideas/` cells, every
`AGENTS.md`/`CLAUDE.md`, `docs/`, `packages/koine` source, `plans/`, `README`, all of it. **Filenames are
not corpus boundaries** — structure is by anchor and a fragment's current home is incidental
([[projection-is-not-the-source]]). σ\*\_LLM canonicalization ranges over every fragment of meaning wherever
it sits, and may **re-home** a fragment, not merely rename it (the unit is the concept, not the file).

**Target structure.** Two homes, by kind:

- **Primitives** (`concept · principle · process · utility · structure · classification`) home in the
  **lexicon** as block-referenceable entries — addressed `[[lexicon#^anchor]]`, **not as files**. This
  is what "filenames are not boundaries" concretely means: a primitive is a glossary _block_, not a file.
- **Composites** (`agent · skill · …`) land in `mind/{kind}/{organ}/{fragment}` (by composite kind, then
  the MECE agent-anatomy **organ**), composing primitives via `[[lexicon#^anchor]]` block-refs.

Fragments typed by **koine IR**. ⚠️ This **reverses** today's `structure-by-anchor-only` /
one-cell-one-file rule (`ideas/AGENTS.md`; [[projection-is-not-the-source]]) — a **premise locked in A0**,
not a mechanical move. **Projector impact:** koine must resolve `[[lexicon#^block-ref]]` block-references
during composition (slice **μ**).

---

## Doctrine (this plan — dogfoods the pending /praxis update)

1. **Every task is an implementation spec.** Self-sufficient: `objective · preconditions · operations (exact) · artifacts (paths) · acceptance (blind test)` (+ `out-of-scope` only for a genuine, creep-preventing exclusion — never reflexive). The executing agent re-derives nothing — the task file is the contract it runs.
2. **Precomputed parallelizable vertical slices + fan-out.** The frontier is a **set** dispatched concurrently, not a single next step. Slices are **vertical** (end-to-end per concern), cut so they do not collide ([[shard-by-orthogonal-concern]]); each carries its fan-out width.

---

## Slices

| Slice                      | Vertical (end-to-end)                                                                                                                                                                                                                                                                                 | State   | Deps   | Fan-out       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ | ------------- |
| **A0** charter             | objectives · user-stories · blind-validation strategy, **in σ\*\_R terms**                                                                                                                                                                                                                            | done    | —      | 1             |
| **ε** praxis-update        | embed `task-is-an-implementation-spec` + `parallelizable-vertical-slice`→fan-out into [[praxis]] (+ supporting cells); regen render; verify                                                                                                                                                           | done    | —      | 1             |
| **ζ** disposition-defect   | `recommendation-style-consensus-quality-pick` did not fire in `principal-ic`; root-cause (projection density-collapse vs embodiment gap — apply session's homeless-concept / taxonomic-supply finding) → machinery fix → regression                                                                   | done    | —      | 1             |
| **μ** projector-block-refs | extend koine's composer to resolve `[[lexicon#^block-ref]]` block-references during projection (the new primitive-addressing) — **Mav**                                                                                                                                                               | done    | A0     | 1             |
| **α1** concept-contract    | the `concept` data type `⟨gloss, anchor?, factorization?⟩`; home σ\*\_R vocab (`dec_R`, `≅_R`, length, `C_R`) here, not borrowed                                                                                                                                                                      | done    | thesis | 1             |
| **α2** anchor=σ\*\_R       | formalize `canonical_anchor = σ*_R` in the CSF reference; retire `signum_aptissimum`                                                                                                                                                                                                                  | done    | thesis | 1             |
| **β** machine-atoms        | one vertical slice **per atom**: blind-name (σ\*\_LLM of the atom's concept) → reconcile its process cell to the σ\*\_R/CSF ops + program to the concept-contract → validate → redeploy. Atoms: `conceptualize`(+fold `probe`) · `signify` · `materialize` · `exemplify` · `validate`(mint true name) | done    | α1, α2 | **5**         |
| **γ1** corpus-audit        | dogfood corrected machine over the **whole-repo content** (not just `ideas/`; the concept/fragment is the unit, not the file): blind-signify each fragment → σ\*\_LLM → `{keep / re-anchor / coalesce / re-cut / re-home}` worklist                                                                   | done    | β      | **N batches** |
| **γ2** corpus-apply        | execute worklist: re-anchor to σ\*\_LLM, coalesce, re-cut, **home primitives as lexicon blocks + composites into `mind/{kind}/{organ}/`**, rewire refs to `[[lexicon#^anchor]]` (whole-repo sweep), regen glossary, round-trip + reconstruct gate, redeploy fleet                                     | pending | γ1, μ  | join          |
| **δ** layman-door          | `elicit`(σ\*\_human) → CSF → recompose domain skills → compose agents-as-persons; demo one toy domain                                                                                                                                                                                                 | pending | β, γ2  | 1             |

**Surface invariant (carried into A5/β-validate):** atoms are developer/agent-internal (R=LLM); `elicit`
is the layman door (R=human). Producers are pure reads; namer/realizer/validator commit.

## Frontier — precomputed (A0 gate signed off; 6 slices landed; γ1 is the live frontier)

**A0 gate-0 SIGNED OFF** (Operator, 2026-06-20, `0d289c9`): the `{kind}/{organ}` directory reversal is
ratified and the primitive source-home is named **`lexicon`** (`[[lexicon#^anchor]]`; `GLOSSARY.md`
projects from it). **ε ✓ · ζ ✓ · α1 ✓ · α2 ✓ · β ✓ · μ ✓ landed** (2026-06-20):

- **ε** — praxis carries `self-sufficient-task` + `fan-out-the-frontier` (`a647309`).
- **ζ** — verbatim-organ silent-density-collapse hole closed by a positive body-presence gate + regression (`9fea5f5`); the disposition fires (no menu on repro).
- **α1** — `[[concept-contract]]` cell: `⟨gloss, anchor?, factorization?⟩`, the CSF narrow waist (`ac68749`).
- **α2** — `canonical_anchor = σ\*\_R` formalized; reader-blind `signum_aptissimum` retired to its strong-reader-limit instance (`2bb406f`).
- **β** — CSF atoms reconciled to the σ\*\_R op-chain, each programmed to `[[concept-contract]]`; the unnamed gate minted as **`accept`**; `probe` kept standalone on evidence (`6715b0b`). Subsumes A1/A3/A4/A5.
- **μ** — the projector resolves `[[lexicon#^block-ref]]` end-to-end (parse → extract → compose → render at both readers → validate, R1 totality + dangling detection); 17/17 toolkit tests green (`1a7e15a`). **NB:** the plan said "koine's composer," but the projection machinery is the mind toolkit (`compose/` + `cells.py`) — corrected in flight.

**Live frontier — γ1** (corpus audit; dep β ✓). **γ2** unblocked-after-γ1 (dep μ ✓ also met) — the
whole-repo re-home + **fleet redeploy**, highest blast-radius slice. **δ** after β+γ2.

> Mirror note: **ε · ζ · α1(A2) · A1 · A3 · A4 · A5 → `completed/`**; **A0 `charter.md`** signed off.
> `pending/` now holds **B1 (→γ1) · B2 (→γ2) · C1 (→δ)** — re-cut into impl-spec form on promotion.
> `/praxis sync` reconciles.
