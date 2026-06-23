# 0001 — organ classification (T1+T2+T3)

R=LLM. Source: 48 blind agents, 2 independent rounds (raw: `audit-raw-r1r2.json`). Two rounds substantively
consistent — every class "divergence" was hybrid-vs-open/closed (degree, not kind) and resolved on read.
Confidence HIGH → no extra probe round (item-3 trigger not met).

## CLOSED organs (model-native enum; keep canon, purge stray bespoke)

| organ          | canonical enum (reference)                                                                  | corpus action       |
| -------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| `address`      | autonomy ladder — in/on/out-of-the-loop (Sheridan-Verplank LOA 1978; Parasuraman 2000)      | keep (3) ✓          |
| `persona`      | 12 brand archetypes (Mark & Pearson, Jungian)                                               | keep (12) ✓         |
| `gestalt`      | situation awareness — perception/comprehension/projection (Endsley 1995)                    | keep (3) ✓          |
| `resolve`      | maximize vs satisfice (Simon 1956)                                                          | keep (2) ✓          |
| `sensors`      | input modalities — text/image/audio/video                                                   | keep (4) ✓          |
| `ledger`       | memory types — working/episodic/semantic/procedural/long-term (Atkinson-Shiffrin; Tulving)  | keep (5) ✓          |
| `deliberation` | reasoning strategies — CoT/ToT/ReAct/reflexion/plan-and-solve (prompting literature)        | keep (5) ✓          |
| `comportment`  | formality register — casual/neutral/formal                                                  | keep (3) ✓          |
| `register-fit` | Communication Accommodation Theory — convergence/divergence/maintenance (Giles)             | keep (3) ✓          |
| `heuristics`   | fast-and-frugal — anchoring/availability/recognition/satisficing/take-the-best (Gigerenzer) | **purge 2 bespoke** |

`heuristics` bespoke to purge: `decomplect-before-composing`, `stewardship-over-relay`.

## OPEN organs (generalized opinionated set; purge bespoke per-agent cells → T4/T5)

| organ                | shape / backbone (reference)                                                         | bespoke to purge (examples)                                        |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `charter`            | HHH backbone (Askell 2021) + optional constitutional principles                      | keep `hhh`; generalize the extension set                           |
| `appraisal`          | self-eval methods — self-critique / LLM-as-judge / test-oracle / verifier            | round-trip + bias-toward-fail-error + check-doc + check-leaked     |
| `competence`         | skill/craft set (open, domain-specific)                                              | 11 bespoke (e2e-delivery-toolchain, in-frame-impl, …)              |
| `construal`          | framing lens — construal-level / interpretive-frame (Trope-Liberman CLT)             | conceptualization + 5 `frame-as-*`                                 |
| `disclosure`         | transparency level — opaque / rationale / reasoning-trace / uncertainty / provenance | show-your-work + 5 `surface-*`                                     |
| `disposition-memory` | learning mode — static / in-context / reflective / continual                         | continual-learning (single) → generalize                           |
| `effectors`          | action repertoire — retrieve / tool-call / code-exec / file-ops / delegate / comms   | 4 bespoke (run-\*, write-arch-docs, emit-introspection-dump)       |
| `enaction`           | output form — text / structured / code / visual / action                             | emit + 3 bespoke (emit-context-dump, emit-doc-edit, emit-verdict)  |
| `instructions`       | engineering principles — DRY/KISS/SOLID/first-principles/… (open, large)             | mostly keep; drop bespoke `shard-by-orthogonal-concern` if non-std |
| `mandate`            | role remit — scope/authority/goal (open, role-specific)                              | 11 mostly bespoke                                                  |
| `percept`            | input type — user-message / tool-result / event / introspection                      | prompt + 3 bespoke                                                 |
| `provenance`         | lineage mark — base-model / training-data / fork-template / archetypal / authorship  | signature + per-agent archetype cells                              |
| `substrate`          | runtime type — frontier-API / open-weight / local / managed                          | claude (single) → generalize                                       |
| `telos`              | goal/purpose — utility-max / SDT autonomy-competence-relatedness / archetypal-desire | 11 mostly bespoke                                                  |

## Notes

- CLOSED enums are kept opinionated-minimal (do NOT bloat to the full academic enum; the recognized core is
  enough). Only purge what is bespoke.
- The hard part is T5 agent-rewiring: each of 11 agents currently selects bespoke values → must re-select the
  nearest generalized survivor (an agent SHARING a value is the point, not a bug).
- All emitted fragments render for LLM-as-reader (`σ*_LLM`).
