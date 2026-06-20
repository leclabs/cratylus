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
| **μ** projector-block-refs | extend koine's composer to resolve `[[lexicon#^block-ref]]` block-references during projection (the new primitive-addressing) — **Mav**                                                                                                                                                               | pending | A0     | 1             |
| **α1** concept-contract    | the `concept` data type `⟨gloss, anchor?, factorization?⟩`; home σ\*\_R vocab (`dec_R`, `≅_R`, length, `C_R`) here, not borrowed                                                                                                                                                                      | done    | thesis | 1             |
| **α2** anchor=σ\*\_R       | formalize `canonical_anchor = σ*_R` in the CSF reference; retire `signum_aptissimum`                                                                                                                                                                                                                  | done    | thesis | 1             |
| **β** machine-atoms        | one vertical slice **per atom**: blind-name (σ\*\_LLM of the atom's concept) → reconcile its process cell to the σ\*\_R/CSF ops + program to the concept-contract → validate → redeploy. Atoms: `conceptualize`(+fold `probe`) · `signify` · `materialize` · `exemplify` · `validate`(mint true name) | pending | α1, α2 | **5**         |
| **γ1** corpus-audit        | dogfood corrected machine over the **whole-repo content** (not just `ideas/`; the concept/fragment is the unit, not the file): blind-signify each fragment → σ\*\_LLM → `{keep / re-anchor / coalesce / re-cut / re-home}` worklist                                                                   | pending | β      | **N batches** |
| **γ2** corpus-apply        | execute worklist: re-anchor to σ\*\_LLM, coalesce, re-cut, **home primitives as lexicon blocks + composites into `mind/{kind}/{organ}/`**, rewire refs to `[[lexicon#^anchor]]` (whole-repo sweep), regen glossary, round-trip + reconstruct gate, redeploy fleet                                     | pending | γ1, μ  | join          |
| **δ** layman-door          | `elicit`(σ\*\_human) → CSF → recompose domain skills → compose agents-as-persons; demo one toy domain                                                                                                                                                                                                 | pending | β, γ2  | 1             |

**Surface invariant (carried into A5/β-validate):** atoms are developer/agent-internal (R=LLM); `elicit`
is the layman door (R=human). Producers are pure reads; namer/realizer/validator commit.

## Frontier — precomputed (4 landed; A0 gate-0 awaiting Operator sign-off)

**ε ✓ · ζ ✓ · α1 ✓ · α2 ✓ landed** (2026-06-20):

- **ε** — praxis now carries `self-sufficient-task` + `fan-out-the-frontier` (`a647309`).
- **ζ** — verbatim-organ silent-density-collapse hole closed by a positive body-presence gate + regression (`9fea5f5`); the disposition fires (no menu on repro).
- **α1** — `[[concept-contract]]` cell: `⟨gloss, anchor?, factorization?⟩`, the CSF narrow waist; homes the interface, cites the σ\*\_R field-math (`ac68749`).
- **α2** — `canonical_anchor = σ\*\_R` formalized in the CSF reference; reader-blind `signum_aptissimum` retired (redefined as σ\*\_R's strong-reader-limit instance, one home in `precise-circumscription`) (`2bb406f`).

**A0 charter delivered** (`826212b`) — **GATE-0, awaiting Operator sign-off**, the live blocker for the
whole remaining spine. Two reserved irreducible calls (the charter's §4.4 / §4.3): (1) the **`glossary`
source-home name collision** (today's generated `GLOSSARY.md` vs. a new primitive-block source home);
(2) ratifying the **composite-layer `{kind}/{organ}` directory reversal** — it supersedes
`structure-by-anchor-only` / `[[projection-is-not-the-source]]`, a constitution-premise change.

**Blocked on that sign-off:** **μ** (Mav, koine block-refs; dep A0) · **β** (5-wide machine-atoms;
gate-0 stops machine work until the criteria lock) · **γ1** (after β) · **γ2** (joins +μ) · **δ** (after
β+γ2). A3-reconcile-csf stays `pending/` — its canonical_anchor piece is subsumed by α2; the rest
(reconcile each process cell to the CSF ops, program to the concept-contract) folds into **β**.

> Mirror note: **ε · ζ → `completed/`**; **A0 `charter.md`** delivered (sign-off pending). `pending/`
> holds the pre-cut backlog (A1–A5, B1, B2, C1) that folds into slices **α / β / γ / δ**, re-cut into
> impl-spec form on promotion (just-in-time). `/praxis sync` reconciles.
