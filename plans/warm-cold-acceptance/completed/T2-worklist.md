# T2 — corpus work-list (the SWEEP fan-out input)

_Runtime enumeration of `packages/agent-anatomy/src/` (the sole source). Counts are authoritative
(a from-memory layout undercounted 159→146 — exactly the failure T2 forbids). Emitted for T3._

## Shippable-composable taxonomy (what deploys as read-cold context)

| class                | home                                       | count                    | ships as                                      |
| -------------------- | ------------------------------------------ | ------------------------ | --------------------------------------------- |
| organ value-fragment | `src/organs/<organ>/<value>.ts`            | **159** across 24 organs | definiens lines composed into SOULs           |
| skill cell           | `src/skills/<name>.ts`                     | **15**                   | deployed `/`-invocable skills                 |
| agent vector         | `src/agents/<name>.ts`                     | **12**                   | composed SOULs (selection, not new definiens) |
| special home         | `ideas/memory.md`                          | 1                        | the memory organ's md home                    |
| governance           | `AGENTS.md` · `CLAUDE.md` (repo + package) | ~6                       | project-instruction context                   |

**Excluded (justified):** `src/toolkit/*` (cell/codegen/project/hooks/make-base — projection MACHINERY,
TS code, not context fragments) · `graphify-out/` (generated) · `test/` (not shipped). A spot-check
composable (`organs/objective/parsimony.ts`) maps to exactly one shard (S-objective) — collectively exhaustive.

## Shards `[ { shard_id, concern, fragment_refs } ]`

MECE by **artifact-class → organ**. A fragment lives in exactly one class dir, and within organ-values
in exactly one organ dir ⇒ disjoint. Organs are the anatomy's orthogonal axes by construction.

### Organ-value shards (24 — one per organ; `fragment_refs = src/organs/<organ>/*.ts`)

| shard_id                 | organ                  |   n | shard_id              | organ               |   n |
| ------------------------ | ---------------------- | --: | --------------------- | ------------------- | --: |
| S-actions                | actions                |   8 | S-model               | model               |   1 |
| S-audience-adaptation    | audience-adaptation    |   3 | S-objective           | objective           |   9 |
| S-autonomy               | autonomy               |   3 | S-output-format       | output-format       |   7 |
| S-capabilities           | capabilities           |  10 | S-persona             | persona             |  12 |
| S-engineering-principles | engineering-principles |   9 | S-provenance          | provenance          |  11 |
| S-formality              | formality              |   3 | S-reasoning-strategy  | reasoning-strategy  |   5 |
| S-framing                | framing                |  11 | S-role                | role                |  13 |
| S-guardrails             | guardrails             |   8 | S-satisficing         | satisficing         |   2 |
| S-heuristics             | heuristics             |   5 | S-self-evaluation     | self-evaluation     |   7 |
| S-learning               | learning               |   7 | S-situation-awareness | situation-awareness |   3 |
| S-memory                 | memory                 |   5 | S-transparency        | transparency        |   7 |
| S-modalities             | modalities             |   4 | S-trigger             | trigger             |   6 |

### Non-organ shards

| shard_id  | concern                                                                                                                                                               | fragment_refs                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| S-skills  | skill-cell self-sufficiency + competing-home among adjacent families (signify/probe/elicit; conceptualize/materialize)                                                | `src/skills/*.ts` (15)                              |
| S-agents  | agent-vector COMPOSITION coherence — the projected SOUL cold-decodes to the intended individual; selected fragments cohere (a composition gate, not a definiens gate) | `src/agents/*.ts` (12)                              |
| S-special | the memory special home + repo/package governance docs                                                                                                                | `ideas/memory.md` · `**/AGENTS.md` · `**/CLAUDE.md` |

## Per-shard gate (T3 applies to each fragment)

- **m1 self-sufficiency**: `R_cold(f)` (via `bin/cold-oracle.sh`) ≡ warm-intent? divergence ⇒ carry meaning inline.
- **m2 competing-home**: on divergence, hunt `∃ n ⊆ K` (repo-WIDE, not shard-local — bleeds are cross-organ,
  witnessed provenance↔autonomy) contradicting/duplicating f; DELETE the second home (DRY/MECE).
- **correction direction**: realign project→cold-truth, never bend f→corpus.
- **pre-satisfied (from Ts):** `S-provenance/nico-archetype-cyan` ✓ · `S-engineering-principles/cold-decode-oracle` ✓
  (adopted, oracle-passed) — T3 SKIPS these two, gates the rest.

## Coverage / MECE arguments

- **Exhaustive:** 159+15+12+1+~6 = every `.ts`/`.md` the forge projects; the excluded set is machinery/generated
  (proven non-shippable — no SOUL/skill projection consumes it).
- **Disjoint:** class dirs are non-overlapping; organ dirs partition organ-values; no fragment is double-listed.
- **Orthogonal (not incidental):** the cut is by anatomy organ / artifact kind (semantic concern), never by
  file size or directory happenstance — adjacent-fragment m2 risk concentrates within an organ, so the axis
  also maximizes gate signal.

## T3 fan-out note

27 shards is MECE-maximal (widest fan-out). Execution MAY batch several small organ-shards per worker for
economy — that is a dispatch detail, NOT a partition change (the gate stays per-fragment, the assignment
stays one-shard-per-fragment). Each worker invokes `bin/cold-oracle.sh` (process-isolated) so worker warmth
never contaminates the decode.
