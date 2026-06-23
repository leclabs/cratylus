# lexicon-routing — the dedup/ROUTING table for `exemplify-corpus-pile`

R=LLM. Author: nico-principal (conceptualize/signify over the WHOLE pile as one body D). This is a
routing TABLE only — no cell is minted/moved here. Realization (materialize) follows this table and
is gate-checked (R1 dup-home / R2 copied-definiens / blind-gloss paraphrase-dup).

D (the pile) = 144 blocks: `lexicon/{classification,concept,gloss,principle,process,structure,utility}.md`
∪ `GLOSSARY.md` (the gloss index — used as the whole-pile dedup view, not routed itself).
Home convention per ADR 0003: `{kind}/{α}` for the 7 lexicon kinds. The dir IS the kind;
`concept/charter.md` (the organ-concept definition) is a distinct home from `charter/` (the organ's
value cells) — no collision.

## RESULT SUMMARY

- **Total blocks routed = 144** (= pile count; completeness gate met). All 144 lexicon `^slug` blocks
  are covered below. GLOSSARY.md is the dedup-view (a generated echo of cells), not a routed source —
  it contributes **0 routed rows** and its echo-entries are all `drop` against their cells (the cell
  is the home); GLOSSARY.md is retired wholesale at end-of-task. No new mint rows come from it.
- **Disposition counts:**
  - `mint` = **141**
  - `coalesce-into` = **0** (see the three near-collisions below — all ruled COEXIST/mint, not coalesce)
  - `fold-into` = **0**
  - `drop` = **0** (within the 144; GLOSSARY echoes drop wholesale, outside the 144)
  - `rename` = **3** (slug → σ\*\_LLM anchor; see rename rows)
- **classification/utility 2-cell-kind ruling:** KEEP both as genuine kinds — see ruling section.
- **could-not-confidently-route:** none. Every block routed. Two policy notes flagged for your call
  (the 3 cross-kind anchor collisions, and the 8 organ-concept ↔ organ-README projection relation).

## THE JUDGMENT CALLS (the only rows that aren't routine mint)

### A. Cross-kind anchor collisions (pile anchor == an already-landed cell name) — RULED COEXIST, NOT coalesce

Three pile anchors string-match a landed cell. ADR 0003 says "anchor already names a landed cell →
COALESCE (R1 forbids two homes)." **My ruling: R1 forbids two homes for ONE concept. These are
three distinct concepts that share an anchor string across two different kinds — a corpus-level
PRINCIPLE/STRUCTURE vs an agent-ORGAN instance that cites it.** `{kind}/{α}` gives them distinct
homes by construction; the organ cell already references the principle. Coalescing would destroy the
principle the organ cell points at. So: **mint the pile cell at its kind-home; the landed organ cell
keeps its home and its reference.** No dual-write — two homes, two concepts.

| pile anchor               | pile kind | landed cell                       | landed kind | ruling                                                                     | rationale                                                                                                                                                                                                                                                            |
| ------------------------- | --------- | --------------------------------- | ----------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claims-cite-coordinates` | principle | `charter/claims-cite-coordinates` | charter     | **mint `principle/claims-cite-coordinates`; landed charter cell coexists** | principle = the corpus teaching (re-verifiable coordinate, retrieval lineage); charter cell = the inviolable agent-rule INSTANCE (holders: reviewer·investigator·boswell). Different role-in-agent ⇒ different concept. The charter value should cite the principle. |
| `observed-vs-inferred`    | principle | `charter/observed-vs-inferred`    | charter     | **mint `principle/observed-vs-inferred`; landed charter cell coexists**    | principle = the load-bearing observed/inferred distinction (many-grain); charter cell = the inviolable agent-rule instance (holders: investigator·boswell·cognizant). Principle is cited by the charter instance.                                                    |
| `sharded-plan-layout`     | structure | `ledger/sharded-plan-layout`      | ledger      | **mint `structure/sharded-plan-layout`; landed ledger cell coexists**      | structure = the layout itself (PLAN.md + task-folder state graph); ledger cell = planner's ledger-organ value naming "the written record across turns" that REFERENCES the structure. Different concept (the artifact vs the organ-use-of-it).                       |

### B. The `cite-dont-copy` (principle) vs `cite-once` (charter) paraphrase-dup candidate — RULED COEXIST, NOT coalesce

ADR 0003 flagged this explicitly ("judged for coalescence"). **Ruling: COEXIST.** The landed
`charter/cite-once` cell already reads `cite-once ≜ composites import by reference, never
restate(cite-dont-copy) · …` — it NAMES `cite-dont-copy` as the principle it embodies. `cite-once`
is nico's charter-organ INSTANCE (holders: nico); `cite-dont-copy` is the corpus PRINCIPLE (one
canonical home, reference don't duplicate). Same teaching, two roles (principle vs the agent-rule
that obeys it). Coalescing would orphan the reference. **Mint `principle/cite-dont-copy`; leave
`charter/cite-once` as-is.** No new disposition row — `cite-dont-copy` is already a routine
`mint → principle/` below.

### C. The 8 organ-concept blocks ↔ the organ-dir READMEs — RULED mint as concept/, READMEs are projections

The pile's 8 concept-kind blocks that DEFINE the organ kinds — `persona, mandate, comportment, telos,
charter, heuristics, competence, disposition-memory` — are the canonical σ\*\_LLM **definitions of the
organ kinds**. The existing `{organ}/README.md` files (e.g. `charter/README.md`, `persona/README.md`)
are **human-render projections** of these same definitions ([[projection-is-not-the-source]]). The
concept block is the source; the README is the lazy boundary render.

**Ruling: mint each at `concept/{organ}` (the organ-kind definition is a genuine concept cell).** Do
NOT fold into the organ dir (these are the kind-definition, not a value-instance of the kind). Do NOT
coalesce with the README (the README is a projection, retired/regenerated, not a competing home).
Flag for your call: whether the organ READMEs should henceforth be **generated** from these
`concept/` cells (single-source) rather than hand-maintained — that is a toolkit/projector decision
(Mav's office), out of this routing pass's scope. Path note: `concept/charter.md` is a distinct home
from the `charter/` dir; no R1 collision (different kind-segment).

## RENAME ROWS (slug ≠ σ\*\_R; keep concept, give σ\*\_LLM anchor)

| current slug     | kind  | → renamed home  | rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `barbara-minto`  | gloss | `gloss/minto`   | the other person-glosses use the bare surname-anchor that fires the prior densest (`fowler`, `hickey`, `hoare`, `polanyi`, `alexander`). `barbara-minto` over-specifies; `minto` is the σ\*\_LLM fittest sign (the Pyramid-Principle/MECE prior fires on the surname alone). NOTE: cross-refs use `[[barbara-minto]]` — rename requires updating citers (mechanizable). LOW-CONFIDENCE: if the corpus convention is "full name for the less-famous," keep `barbara-minto`; flagged for your call. |
| `james-boswell`  | gloss | `gloss/boswell` | same rule: the prior fires on `boswell` (and the agent is `agent/boswell`). `james-boswell` is the disambiguation-form; `boswell` is fittest for R=LLM. Citers `[[james-boswell]]` updated on rename. LOW-CONFIDENCE: see above.                                                                                                                                                                                                                                                                  |
| `nicola-guarino` | gloss | `gloss/guarino` | same rule: `guarino` fires OntoClean/DOLCE/formal-ontology densely; surname is the σ\*\_LLM anchor (cf. `fowler`/`hickey`). Citers updated. LOW-CONFIDENCE: see above.                                                                                                                                                                                                                                                                                                                            |

These three renames are a **consistency cut** against the established surname-anchor convention the
other 6 person-glosses already follow (`alexander, fowler, hickey, hoare, polanyi, principal-engineer,
principal-technical-writer, mission-command`). If you prefer the full-name form as a deliberate
"formal name in the gloss header, bare anchor as the slug" split, these stay `mint` unchanged. I rule
**rename** because [[self-application-is-mandatory]] grandfathers no inherited name and the surname is
the fittest sign for the LLM reader. **All other 141 blocks: slug == σ\*\_R, plain `mint`.**

---

## ROUTING TABLE (grouped by target kind)

Disposition is `mint` unless noted. `notes` empty = routine (slug==σ\*, single-home, no dup).

### → concept/ (40 blocks)

| anchor                                 | source     | claimed-kind | → home                                         | disposition | notes                                                                               |
| -------------------------------------- | ---------- | ------------ | ---------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| agent-body                             | concept.md | concept      | concept/agent-body                             | mint        |                                                                                     |
| agent-consults-engine                  | concept.md | concept      | concept/agent-consults-engine                  | mint        |                                                                                     |
| agent-identity-facets                  | concept.md | concept      | concept/agent-identity-facets                  | mint        |                                                                                     |
| ambient-person-agent                   | concept.md | concept      | concept/ambient-person-agent                   | mint        |                                                                                     |
| anchor-legibility-budget               | concept.md | concept      | concept/anchor-legibility-budget               | mint        |                                                                                     |
| canonical-semantic-factorization       | concept.md | concept      | concept/canonical-semantic-factorization       | mint        | formal block; closed/complete per self-sufficient-formalism                         |
| canonical-superset-ir                  | concept.md | concept      | concept/canonical-superset-ir                  | mint        |                                                                                     |
| closed-context-of-an-inference-call    | concept.md | concept      | concept/closed-context-of-an-inference-call    | mint        |                                                                                     |
| commons-distribution                   | concept.md | concept      | concept/commons-distribution                   | mint        |                                                                                     |
| composition-hub                        | concept.md | concept      | concept/composition-hub                        | mint        |                                                                                     |
| concept-contract                       | concept.md | concept      | concept/concept-contract                       | mint        | formal block                                                                        |
| continuity-thread                      | concept.md | concept      | concept/continuity-thread                      | mint        |                                                                                     |
| decision-identity                      | concept.md | concept      | concept/decision-identity                      | mint        |                                                                                     |
| formal-ontology                        | concept.md | concept      | concept/formal-ontology                        | mint        |                                                                                     |
| founder-charter                        | concept.md | concept      | concept/founder-charter                        | mint        | constitution cell; cited by politeia                                                |
| hearth                                 | concept.md | concept      | concept/hearth                                 | mint        |                                                                                     |
| latent-priors                          | concept.md | concept      | concept/latent-priors                          | mint        |                                                                                     |
| mind-society                           | concept.md | concept      | concept/mind-society                           | mint        | the "polis subject" anchor                                                          |
| navigation-projection                  | concept.md | concept      | concept/navigation-projection                  | mint        |                                                                                     |
| oikos                                  | concept.md | concept      | concept/oikos                                  | mint        |                                                                                     |
| operator-relation                      | concept.md | concept      | concept/operator-relation                      | mint        |                                                                                     |
| palimpsest                             | concept.md | concept      | concept/palimpsest                             | mint        |                                                                                     |
| powers                                 | concept.md | concept      | concept/powers                                 | mint        |                                                                                     |
| pretransform-shrinks-inference-surface | concept.md | concept      | concept/pretransform-shrinks-inference-surface | mint        |                                                                                     |
| prompt-engineering                     | concept.md | concept      | concept/prompt-engineering                     | mint        | the load-bearing identity cell                                                      |
| pulse                                  | concept.md | concept      | concept/pulse                                  | mint        |                                                                                     |
| pure-leaf-deterministic-engine         | concept.md | concept      | concept/pure-leaf-deterministic-engine         | mint        |                                                                                     |
| scope-grant                            | concept.md | concept      | concept/scope-grant                            | mint        |                                                                                     |
| scope-precedence-merge-algebra         | concept.md | concept      | concept/scope-precedence-merge-algebra         | mint        |                                                                                     |
| senses                                 | concept.md | concept      | concept/senses                                 | mint        |                                                                                     |
| signifier-star-r                       | concept.md | concept      | concept/signifier-star-r                       | mint        | formal block (σ\*\_R laws)                                                          |
| subject-binding                        | concept.md | concept      | concept/subject-binding                        | mint        |                                                                                     |
| persona                                | concept.md | concept      | concept/persona                                | mint        | organ-kind DEFINITION; charter/README & persona/README are projections (judgment C) |
| mandate                                | concept.md | concept      | concept/mandate                                | mint        | organ-kind definition (judgment C)                                                  |
| comportment                            | concept.md | concept      | concept/comportment                            | mint        | organ-kind definition (judgment C)                                                  |
| telos                                  | concept.md | concept      | concept/telos                                  | mint        | organ-kind definition (judgment C)                                                  |
| charter                                | concept.md | concept      | concept/charter                                | mint        | organ-kind definition (judgment C); home `concept/charter.md` ≠ dir `charter/`      |
| heuristics                             | concept.md | concept      | concept/heuristics                             | mint        | organ-kind definition (judgment C)                                                  |
| competence                             | concept.md | concept      | concept/competence                             | mint        | organ-kind definition (judgment C)                                                  |
| disposition-memory                     | concept.md | concept      | concept/disposition-memory                     | mint        | organ-kind definition (judgment C); home ≠ dir `disposition-memory/`                |

### → principle/ (76 blocks)

| anchor                                     | source       | claimed-kind | → home                                               | disposition | notes                                                                                   |
| ------------------------------------------ | ------------ | ------------ | ---------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| abstain-on-non-convergence                 | principle.md | principle    | principle/abstain-on-non-convergence                 | mint        |                                                                                         |
| adopt-the-commons                          | principle.md | principle    | principle/adopt-the-commons                          | mint        |                                                                                         |
| agent-retirement                           | principle.md | principle    | principle/agent-retirement                           | mint        |                                                                                         |
| anchor-to-the-readers-priors               | principle.md | principle    | principle/anchor-to-the-readers-priors               | mint        |                                                                                         |
| architecture-md-diagrams-only              | principle.md | principle    | principle/architecture-md-diagrams-only              | mint        |                                                                                         |
| cite-dont-copy                             | principle.md | principle    | principle/cite-dont-copy                             | mint        | COEXISTS with charter/cite-once (judgment B); not coalesced                             |
| claims-cite-coordinates                    | principle.md | principle    | principle/claims-cite-coordinates                    | mint        | COEXISTS with charter/claims-cite-coordinates (judgment A)                              |
| clean-slate                                | principle.md | principle    | principle/clean-slate                                | mint        |                                                                                         |
| composite-lift-rule                        | principle.md | principle    | principle/composite-lift-rule                        | mint        |                                                                                         |
| consensual-adoption                        | principle.md | principle    | principle/consensual-adoption                        | mint        |                                                                                         |
| consensus-quality-pick                     | principle.md | principle    | principle/consensus-quality-pick                     | mint        | `render: verbatim` — preserve fm flag for projector                                     |
| context-at-the-load-bearing-depth          | principle.md | principle    | principle/context-at-the-load-bearing-depth          | mint        |                                                                                         |
| context-not-prose                          | principle.md | principle    | principle/context-not-prose                          | mint        |                                                                                         |
| continual-agency                           | principle.md | principle    | principle/continual-agency                           | mint        |                                                                                         |
| convention-over-configuration              | principle.md | principle    | principle/convention-over-configuration              | mint        |                                                                                         |
| decision-at-the-locus-of-need              | principle.md | principle    | principle/decision-at-the-locus-of-need              | mint        |                                                                                         |
| decision-yield                             | principle.md | principle    | principle/decision-yield                             | mint        |                                                                                         |
| declare-capability-dont-discover           | principle.md | principle    | principle/declare-capability-dont-discover           | mint        |                                                                                         |
| defer-the-package-boundary                 | principle.md | principle    | principle/defer-the-package-boundary                 | mint        |                                                                                         |
| definitions-over-defaults                  | principle.md | principle    | principle/definitions-over-defaults                  | mint        |                                                                                         |
| densest-faithful-point                     | principle.md | principle    | principle/densest-faithful-point                     | mint        |                                                                                         |
| dimension-decomposed-validity              | principle.md | principle    | principle/dimension-decomposed-validity              | mint        |                                                                                         |
| do-the-work-dont-tell-the-user             | principle.md | principle    | principle/do-the-work-dont-tell-the-user             | mint        |                                                                                         |
| doc-mirrors-runtime-truth                  | principle.md | principle    | principle/doc-mirrors-runtime-truth                  | mint        | NOTE distinct from telos/docs-mirror-runtime (an agent telos that cites this) — coexist |
| emit-only-on-change                        | principle.md | principle    | principle/emit-only-on-change                        | mint        |                                                                                         |
| empirical-source-before-normative-doc      | principle.md | principle    | principle/empirical-source-before-normative-doc      | mint        |                                                                                         |
| engine-orchestrates-agents-execute         | principle.md | principle    | principle/engine-orchestrates-agents-execute         | mint        |                                                                                         |
| executable-doc-over-prose                  | principle.md | principle    | principle/executable-doc-over-prose                  | mint        |                                                                                         |
| fan-out-the-frontier                       | principle.md | principle    | principle/fan-out-the-frontier                       | mint        |                                                                                         |
| generated-artifact-is-emitter-owned        | principle.md | principle    | principle/generated-artifact-is-emitter-owned        | mint        |                                                                                         |
| generated-artifact-provenance              | principle.md | principle    | principle/generated-artifact-provenance              | mint        |                                                                                         |
| golden-master-equivalence-oracle           | principle.md | principle    | principle/golden-master-equivalence-oracle           | mint        |                                                                                         |
| goodharts-law                              | principle.md | principle    | principle/goodharts-law                              | mint        |                                                                                         |
| ground-only-on-explicit-reference          | principle.md | principle    | principle/ground-only-on-explicit-reference          | mint        |                                                                                         |
| identity-criteria-before-taxonomy          | principle.md | principle    | principle/identity-criteria-before-taxonomy          | mint        |                                                                                         |
| intent-not-flag-branches                   | principle.md | principle    | principle/intent-not-flag-branches                   | mint        |                                                                                         |
| llm-native-source-human-render-at-boundary | principle.md | principle    | principle/llm-native-source-human-render-at-boundary | mint        |                                                                                         |
| lossless-floor                             | principle.md | principle    | principle/lossless-floor                             | mint        |                                                                                         |
| mece                                       | principle.md | principle    | principle/mece                                       | mint        |                                                                                         |
| minimalism                                 | principle.md | principle    | principle/minimalism                                 | mint        |                                                                                         |
| named-marker-as-index-key                  | principle.md | principle    | principle/named-marker-as-index-key                  | mint        |                                                                                         |
| net-zero-correction                        | principle.md | principle    | principle/net-zero-correction                        | mint        |                                                                                         |
| never-go-silent                            | principle.md | principle    | principle/never-go-silent                            | mint        |                                                                                         |
| no-permissive-defaults                     | principle.md | principle    | principle/no-permissive-defaults                     | mint        |                                                                                         |
| observed-vs-inferred                       | principle.md | principle    | principle/observed-vs-inferred                       | mint        | COEXISTS with charter/observed-vs-inferred (judgment A)                                 |
| one-cell-one-type                          | principle.md | principle    | principle/one-cell-one-type                          | mint        |                                                                                         |
| permission-is-not-the-act                  | principle.md | principle    | principle/permission-is-not-the-act                  | mint        |                                                                                         |
| plan-retirement                            | principle.md | principle    | principle/plan-retirement                            | mint        |                                                                                         |
| precise-circumscription                    | principle.md | principle    | principle/precise-circumscription                    | mint        | homes σ\*\_R strong-reader limit (signum aptissimum); load-bearing                      |
| principal-agency                           | principle.md | principle    | principle/principal-agency                           | mint        | NOTE distinct from charter/principal-agency-clean-slate (agent value cites this)        |
| proactive-moonshot-ideation                | principle.md | principle    | principle/proactive-moonshot-ideation                | mint        |                                                                                         |
| prohibitions-to-prescriptions              | principle.md | principle    | principle/prohibitions-to-prescriptions              | mint        |                                                                                         |
| projection-is-not-the-source               | principle.md | principle    | principle/projection-is-not-the-source               | mint        |                                                                                         |
| pyramid-principle                          | principle.md | principle    | principle/pyramid-principle                          | mint        |                                                                                         |
| read-by-priors-not-surface                 | principle.md | principle    | principle/read-by-priors-not-surface                 | mint        |                                                                                         |
| reader-prior-projection                    | principle.md | principle    | principle/reader-prior-projection                    | mint        |                                                                                         |
| regenerate-without-clobbering              | principle.md | principle    | principle/regenerate-without-clobbering              | mint        |                                                                                         |
| right-to-forget                            | principle.md | principle    | principle/right-to-forget                            | mint        |                                                                                         |
| round-trip-fidelity                        | principle.md | principle    | principle/round-trip-fidelity                        | mint        |                                                                                         |
| schema-versioned-from-v1                   | principle.md | principle    | principle/schema-versioned-from-v1                   | mint        |                                                                                         |
| self-application-is-mandatory              | principle.md | principle    | principle/self-application-is-mandatory              | mint        |                                                                                         |
| self-sufficient-formalism                  | principle.md | principle    | principle/self-sufficient-formalism                  | mint        | formal block                                                                            |
| self-sufficient-task                       | principle.md | principle    | principle/self-sufficient-task                       | mint        |                                                                                         |
| semantic-whole-over-syntactic-substrate    | principle.md | principle    | principle/semantic-whole-over-syntactic-substrate    | mint        | resolver emits per-agent (per founder-charter); concept stays here                      |
| shard-by-orthogonal-concern                | principle.md | principle    | principle/shard-by-orthogonal-concern                | mint        |                                                                                         |
| sovereign                                  | principle.md | principle    | principle/sovereign                                  | mint        |                                                                                         |
| stamp-absence                              | principle.md | principle    | principle/stamp-absence                              | mint        |                                                                                         |
| state-transitions-as-agent-protocol        | principle.md | principle    | principle/state-transitions-as-agent-protocol        | mint        |                                                                                         |
| stewardship-stance                         | principle.md | principle    | principle/stewardship-stance                         | mint        | NOTE distinct from comportment/makers-posture & telos cells that cite it                |
| substance-over-accident                    | principle.md | principle    | principle/substance-over-accident                    | mint        |                                                                                         |
| surface-open-questions                     | principle.md | principle    | principle/surface-open-questions                     | mint        |                                                                                         |
| translate-at-the-boundary                  | principle.md | principle    | principle/translate-at-the-boundary                  | mint        |                                                                                         |
| two-phase-bulk-then-unit-dispatch          | principle.md | principle    | principle/two-phase-bulk-then-unit-dispatch          | mint        |                                                                                         |
| unbraided-code                             | principle.md | principle    | principle/unbraided-code                             | mint        |                                                                                         |
| validation-altitude                        | principle.md | principle    | principle/validation-altitude                        | mint        |                                                                                         |
| verify-at-the-source-not-the-projection    | principle.md | principle    | principle/verify-at-the-source-not-the-projection    | mint        |                                                                                         |

### → gloss/ (11 blocks)

| anchor                     | source   | claimed-kind | → home                           | disposition    | notes                                                                   |
| -------------------------- | -------- | ------------ | -------------------------------- | -------------- | ----------------------------------------------------------------------- |
| alexander                  | gloss.md | gloss        | gloss/alexander                  | mint           |                                                                         |
| barbara-minto              | gloss.md | gloss        | gloss/minto                      | rename:minto   | surname-anchor convention (judgment/rename); LOW-CONFIDENCE — your call |
| fowler                     | gloss.md | gloss        | gloss/fowler                     | mint           |                                                                         |
| hickey                     | gloss.md | gloss        | gloss/hickey                     | mint           |                                                                         |
| hoare                      | gloss.md | gloss        | gloss/hoare                      | mint           |                                                                         |
| james-boswell              | gloss.md | gloss        | gloss/boswell                    | rename:boswell | surname-anchor convention; LOW-CONFIDENCE — your call                   |
| mission-command            | gloss.md | gloss        | gloss/mission-command            | mint           | concept-anchor (not a surname); keep                                    |
| nicola-guarino             | gloss.md | gloss        | gloss/guarino                    | rename:guarino | surname-anchor convention; LOW-CONFIDENCE — your call                   |
| polanyi                    | gloss.md | gloss        | gloss/polanyi                    | mint           |                                                                         |
| principal-engineer         | gloss.md | gloss        | gloss/principal-engineer         | mint           | role-noun anchor; keep                                                  |
| principal-technical-writer | gloss.md | gloss        | gloss/principal-technical-writer | mint           | role-noun anchor; keep                                                  |

### → process/ (8 blocks)

| anchor                  | source     | claimed-kind | → home                          | disposition | notes                                                |
| ----------------------- | ---------- | ------------ | ------------------------------- | ----------- | ---------------------------------------------------- |
| accept                  | process.md | process      | process/accept                  | mint        | formal block; the exemplify acceptance gate          |
| anchor-routing          | process.md | process      | process/anchor-routing          | mint        |                                                      |
| archetype-instantiation | process.md | process      | process/archetype-instantiation | mint        |                                                      |
| dont-blind-wait         | process.md | process      | process/dont-blind-wait         | mint        |                                                      |
| exemplar-resolution     | process.md | process      | process/exemplar-resolution     | mint        | the method's core op-chain; cited by skill/exemplify |
| pyramid-decomposition   | process.md | process      | process/pyramid-decomposition   | mint        | formal block                                         |
| re-anchoring-protocol   | process.md | process      | process/re-anchoring-protocol   | mint        |                                                      |
| semantic-partition      | process.md | process      | process/semantic-partition      | mint        |                                                      |

### → structure/ (5 blocks)

| anchor                  | source       | claimed-kind | → home                            | disposition | notes                                                                                                                                                                       |
| ----------------------- | ------------ | ------------ | --------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| memory                  | structure.md | structure    | structure/memory                  | mint        | `render: verbatim` + `deploy: skill-dir` + `bundle:` — PRESERVE all fm; this is the memory-organ structure the `memory` skill embodies. Heavy; coexists with skill/\* refs. |
| politeia                | structure.md | structure    | structure/politeia                | mint        | the foundational constitution structure                                                                                                                                     |
| sharded-plan-layout     | structure.md | structure    | structure/sharded-plan-layout     | mint        | COEXISTS with ledger/sharded-plan-layout (judgment A)                                                                                                                       |
| sharded-work-layout     | structure.md | structure    | structure/sharded-work-layout     | mint        | genus skeleton                                                                                                                                                              |
| sharded-workflow-layout | structure.md | structure    | structure/sharded-workflow-layout | mint        | engine-driven species                                                                                                                                                       |

### → classification/ (2 blocks) — see ruling

| anchor              | source            | claimed-kind   | → home                             | disposition | notes                                                               |
| ------------------- | ----------------- | -------------- | ---------------------------------- | ----------- | ------------------------------------------------------------------- |
| context-pathologies | classification.md | classification | classification/context-pathologies | mint        | KEEP as classification (membership-criterion-bearing); ruling below |
| genuine-fork        | classification.md | classification | classification/genuine-fork        | mint        | KEEP as classification (4-criteria membership test); ruling below   |

### → utility/ (2 blocks) — see ruling

| anchor                    | source     | claimed-kind | → home                            | disposition | notes                                                      |
| ------------------------- | ---------- | ------------ | --------------------------------- | ----------- | ---------------------------------------------------------- |
| agent-index-doc-style     | utility.md | utility      | utility/agent-index-doc-style     | mint        | KEEP as utility (style-floor procedure); ruling below      |
| ontoclean-meta-properties | utility.md | utility      | utility/ontoclean-meta-properties | mint        | KEEP as utility (reusable rubric/instrument); ruling below |

---

## CLASSIFICATION / UTILITY 2-CELL-KIND RULING

**Both kinds are KEPT as genuine identity-bearing kinds. No fold into concept/.**

### `classification` — KEEP (genuine kind)

A `classification` cell's identity is that **the membership test IS the cell** — it answers "which
member am I looking at?" with an explicit decision rubric, and is open-by-extension. This is a
distinct role-in-corpus from a `concept` (which circumscribes one idea) and from a `principle` (a
normative ought).

- `context-pathologies` — a taxonomy of failure modes, each a symptom→cause→fix triple; the test
  that decides which pathology applies IS the membership criterion (its own cell says so). Folding
  into `concept/` would lose the "the partition+test is the content" signal. KEEP.
- `genuine-fork` — a 4-criteria membership test (irreversible ∨ outward ∨ value-dependent ∨ beyond-
  competence); the cell IS the classifier. KEEP.

Borderline note: `genuine-fork` could be read as a `principle` (the escalation ought). I rule
`classification` because the cell's load is the **disjunctive membership test**, not a normative
directive — the ought (`escalate only a genuine fork`) lives in `principal-agency`, which cites this
classifier. Two cells is enough to establish the kind under dir-is-kind (ADR 0003).

### `utility` — KEEP (genuine kind)

A `utility` cell is a **reusable instrument/procedure-tool** an agent or process applies — neither a
normative ought (principle) nor a circumscribed idea (concept) nor a pipeline stage (process). Its
identity: "a tool you run against a target."

- `ontoclean-meta-properties` — the OntoClean rubric (tag R/I/U/D, reject violating subsumptions); a
  reusable analytic INSTRUMENT that `pyramid-decomposition` applies. Genuinely a tool, not the idea
  of formal ontology (that's `concept/formal-ontology`, which it operationalizes). KEEP.
- `agent-index-doc-style` — a per-file style FLOOR (a checklist procedure applied to AGENTS.md /
  CLAUDE.md). A tool-rule, not a teaching. (Borderline vs `principle`; but it is a concrete applied
  style-floor, sibling to `architecture-md-diagrams-only` — note that sibling lives in `principle`.)

**Borderline flag for your call:** `agent-index-doc-style` and `architecture-md-diagrams-only` are
siblings (both per-file style-floors) but the pile filed the first as `utility`, the second as
`principle`. They should share a kind. Two coherent options:

- (i) both `principle` (style-floor = normative ought) → then `utility` has only one member
  (`ontoclean-meta-properties`), still a valid kind under dir-is-kind but thin; or
- (ii) both `utility` (applied tool-rule) → move `architecture-md-diagrams-only` from principle to
  utility for consistency.
  I lean **(ii)** (consistency: a per-file applied style-floor is an instrument), but this is a genuine
  fork on the principle/utility boundary — flagged, not forced. Default if you don't rule: keep each
  where the pile filed it (the table above), accepting the sibling-split.

---

## NOTES ON HEAVY / FORMAL CELLS (materialize must preserve)

- **Formal-block cells** (preserve `closed/complete/ordered` set-builder bodies, don't prose-ify):
  `concept/canonical-semantic-factorization`, `concept/concept-contract`, `concept/signifier-star-r`,
  `principle/self-sufficient-formalism`, `process/accept`, `process/exemplar-resolution`,
  `process/pyramid-decomposition`.
- **Front-matter flags to PRESERVE through the move** (not stale `kind:` — these are live projector
  directives): `consensus-quality-pick` (`render: verbatim`), `structure/memory`
  (`render: verbatim` + `deploy: skill-dir` + `bundle:` + `skill_description:`). The `kind:` field
  itself is re-derived (per contract invariant 2), but `render`/`deploy`/`bundle` are NOT kind — keep.
- **`structure/memory` is large and skill-bound:** it carries the `## Protocol` (verbatim-emitted) and
  the EPISODIC build-spec. It is the structure the `memory` skill embodies; mint as one structure
  cell, the skill references it. Do not split the Protocol out (it is the verbatim payload).
