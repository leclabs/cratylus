# γ1 — Full-corpus blind canonical-anchor audit (worklist)

**Method.** 6 parallel blind auditors (slice γ1, 2026-06-20): each signified σ\*\_LLM from the cell
body+delineation with the filename hidden, then revealed and compared. 159 real cells (one phantom:
`architecture-diagrams-only` absent on disk). Machine: `canonical_anchor = σ\*_R`, R = LLM.

**Headline.** ~143/159 **keep** (≈90% canonical) — the corpus is far healthier than the prior "8/10
non-canonical" estimate. Drift concentrates in three patterns: **sentence-as-name**,
**reinvented/overloaded standard-term** (the cell names the better term in its own body), and a few
**mislabeled `gloss:true`** source cells. No coalesce/re-cut surfaced (the `sharded-*` family is a
genuine genus+2-species partition — coalesce hypothesis refuted).

## A. Re-anchor (≈15) — `current → σ\*_LLM` (drift type)

| #   | current                                     | σ\*\_LLM                                   | drift                                             | conf  |
| --- | ------------------------------------------- | ------------------------------------------ | ------------------------------------------------- | ----- |
| 1   | metric-is-a-guide-not-a-target              | **goodharts-law**                          | reinvented-standard (body names it)               | high  |
| 2   | bidirectional-round-trip-fidelity           | **round-trip-fidelity**                    | redundant ("round-trip" ⇒ both ways)              | high  |
| 3   | recommendation-style-consensus-quality-pick | **consensus-quality-pick**                 | sentence-as-name; drop "Recommendation Style —"   | high  |
| 4   | inversion-of-control-orchestration          | **agent-consults-engine**                  | overloaded-standard (GoF/DI points the wrong way) | high  |
| 5   | false-positives-ship-bugs-stamped-absence   | **stamp-absence**                          | rationale-as-name braids two ideas                | high  |
| 6   | calibrated-validation-preserves-agency      | **validation-altitude**                    | sentence-as-name; concept = floor/middle/ceiling  | high  |
| 7   | priors-as-light                             | **read-by-priors-not-surface**             | metaphor-as-name, under-circumscribes cold reader | high  |
| 8   | pretransform-pass-shrinks-inference-surface | **pretransform-shrinks-inference-surface** | sentence-as-name (drop "-pass-")                  | high  |
| 9   | context-anchors-protocol                    | **re-anchoring-protocol**                  | names the artifact not the operation              | high  |
| 10  | claims-cite-verifiable-coordinates          | **claims-cite-coordinates**                | "verifiable" redundant                            | med   |
| 11  | agent-identity-portability                  | **agent-identity-facets**                  | names one property, not the facet model           | med   |
| 12  | grounding-rule                              | **default-to-first-principles** (kin)      | vague/over-broad (names topic not rule)           | med   |
| 13  | household                                   | **oikos**                                  | reinvented-standard (body says oikos throughout)  | med\* |
| 14  | body                                        | **agent-body**                             | bare noun under-circumscribes                     | low\* |
| 15  | mind-society                                | **polis**                                  | the cell IS "the polis subject"                   | low\* |

\* Items 13–15 touch high-traffic civic/organ-family anchors — **Nico's call** (legibility-budget vs
density tension; he owns the constitution vocabulary).

## B. Re-home (3)

| current                 | action                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `anchor` (gloss:true)   | **coalesce into `signifier-star-r`** — it defines σ\*\_R itself, not a human gloss; redundant with the home cell                           |
| `latent-priors` (gloss) | **re-home as a real anchor** (kind: concept) — the reader-substrate σ\*\_R is defined over, a source machine-concept mislabeled as a gloss |
| `principal-ic` (agent)  | organ home **agent/Mandate** (the scope-of-office root mav/reviewer specialize) — a γ2-B {kind}/{organ} placement, not a rename            |

## C. Body-notation fix (1, not an anchor change)

- `exemplar-resolution` — retire the stale `CA/η/μ` pipeline symbols (and `CA ≜ semantic-partition`,
  which now overloads the corrected `CA`); re-formalize the body to the σ\*\_R/CSF op-chain. Anchor keeps.

## D. Composite {kind}/{organ} homes (γ2-B placement map)

All 23 composites **keep** their anchors; organ assignments (per `docs/agent-conceptual-anatomy.md`):

- **agent/Persona:** mav · nico — **agent/Mandate:** principal-ic — **agent/Disclosure:** arch-doc-writer ·
  cognizant — **agent/Ledger:** boswell — **agent/Appraisal:** investigator · principal-engineer-reviewer ·
  tester — **agent/Deliberation:** planner — **agent/Enaction:** developer
- **skill/Construal:** conceptualize · formalize · wake — **skill/Sensors:** elicit · probe —
  **skill/Resolve:** signify · weitermachen — **skill/Enaction:** materialize — **skill/Ledger:** handoff ·
  praxis — **skill/Disposition-Memory:** dream — **skill/Competence:** exemplify

Flagged organ uncertainties (Nico to confirm): principal-ic Mandate-vs-Persona; the elicit/probe Sensors
vs conceptualize/formalize Construal seam; exemplify-as-Competence-umbrella.

## Scope note for γ2 (substrate finding)

γ2 has **two separable halves**: **(A)** apply this re-anchor/re-home worklist (mechanical, round-trip-
gated, git-recoverable); **(B)** the physical restructure — primitives → `lexicon` blocks, composites →
`mind/{kind}/{organ}/`. **(B) requires a toolkit-storage rewrite μ did NOT deliver:** μ resolves a
block-ref in a composite's prose (the READ side), but `corpus_slugs`/`cell_path`/`parse_cell`/`glossary`/
`verify` still assume one-cell-one-`ideas/`-file (the STORE side). Homing a primitive AS a lexicon block
and a composite under `mind/{kind}/{organ}/` is a first-class substrate slice, not a mechanical apply.
