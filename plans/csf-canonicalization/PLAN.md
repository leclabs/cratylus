# csf-canonicalization

**Intent.** Make the substrate actually CSF. Fix the CSF machinery, dogfood it on the corpus to
re-anchor every cell to its signum aptissimum, then build the layman self-extension product layer.

**Why.** Blind audit (10-cell sample) shows ~8/10 current filenames are non-canonical — sentences and
descriptions filed as anchors; two reinvented standard terms the world already hands a strong reader
(`self-application-is-mandatory`→`dogfooding`, `metric-is-a-guide-not-a-target`→`Goodhart's-law`).
Non-canonical anchors break both objectives: composability-without-duplication (one concept can hide
under two sentences) and operator-legibility (a sentence is not a name).

**Reference (operator's CSF formalization).**
`resolve → semanticPartition → depalimpsest → distill(primitive ∨ deepestFaithfulComposite)
→ canonical_anchor(=signum_aptissimum) → coalescence(merge same-anchor units) → CSF`

**Ontology lock.** Agents _embody dispositions_ + _use skills_. Skills are _composited from canonical
anchors_ (primitives + composites), formalized as set-notation where it buys accuracy. A skill's
canonical anchor is legible to whoever asked **because it is canonical** (one level of naming).

## Tasks

| Task                                                            | Phase        | State     | Depends      |
| --------------------------------------------------------------- | ------------ | --------- | ------------ |
| A0 charter: objectives, user stories, blind-validation strategy | 0 charter    | **ready** | —            |
| A1 blind-test every atom name → canonical anchor                | A machine    | pending   | A0           |
| A2 define the `concept` contract (the interface)                | A machine    | pending   | A0           |
| A3 reconcile process cells to the reference CSF formalization   | A machine    | pending   | A1, A2       |
| A4 fold `probe` into `conceptualize` (verify blind)             | A machine    | pending   | A1           |
| A5 correctly-named validate + two-audience surface              | A machine    | pending   | A1, A3       |
| B1 full-corpus blind canonical-anchor audit (dogfood)           | B self-apply | pending   | A3           |
| B2 re-anchor, coalesce, re-cut, gate, redeploy                  | B self-apply | pending   | B1           |
| C1 layman self-extension flow                                   | C product    | pending   | A, B         |
| C2 fix the disposition-projection defect                        | C product    | pending   | — (parallel) |

Frontier: **A0** — the charter gates all execution; objectives + user stories + blind-validation
strategy must be agreed before Phase A starts.
