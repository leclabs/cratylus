# S3 · memory-execution-spec

**Deps: R1, V2, V3.**

**Objective.** Author the execution spec for the memory system's _architectural_ remedy — the part
that is not a deterministic bug fix. This is the deliverable the memory-consolidation praxis existed
to produce.

## Inputs

`plans/close-out/ready/R1-findings.md` · the returns of V2 and V3 · `packages/agent-memory/src`
(4458 LOC, 18 modules) · `packages/agent-canon/src/skills/dream/skill.ts` ·
`packages/agent-memory/src/{route,record,verb-port,audit}.ts`

## Standing constraint from the operator

**Reorganization and bug-fixing, not a redesign.** Mechanism maximized; inference reserved for where
it is genuinely needed. A proposal that rewrites the store **or the fold engine** is out of contract
— say so and propose the smaller thing.

## Deployment constraints — every proposal is judged against these

Restored from the retired S3, where they were load-bearing and were dropped in the merge. Without
them a verdict like "adopt Zep/Graphiti" reads as admissible when it is not.

- **local-first** · file-backed markdown stores · **no network** · **no embedding service assumed**
- must run inside a Stop/skill hook · portable across hosts
- any new dependency must be named, with its licence and weight, and justified against the above

**This bites R1's actual verdict.** R1 recommends lifting Graphiti's cheap-to-expensive resolution
ladder — exact normalized match → **cosine similarity** → LLM for survivors. The middle rung assumes
an embedding service. S3 must either drop that rung, name a local embedding path and price it, or
show the outer two rungs suffice. Do not carry the ladder in wholesale.

## The five decisions this spec must take

1. **Write-time signal — yes or no**, per R1's verdict. If yes: what field, what values, who fills
   it, and what happens when it is wrong or absent. `tags` is barred from routing (`record.ts:26`)
   — either that contract changes explicitly, with the reason, or a new field is derived. A new
   public field name is a **cratylism act**; if one is needed, say so and mark it gated rather than
   coining it here.
2. **The deterministic / inference split**, as a table: every routing decision, and which side it
   falls on. My standing failure mode is fleeing to mechanism — do not mechanize a judgment that is
   genuinely semantic; equally, do not defer to inference what a string test settles.
3. **The admission test for `PROCEDURAL`**. This is the bloat fix and it is the highest-value item in
   the shard. `nico/PROCEDURAL.md` is 102 lines against a 13-line `SEMANTIC.md`. The existing
   projection-dedup bar ("already projected ⇒ not stored") is prose an agent applies to itself. Can
   it be mechanized — even partially — using `audit.ts:177 scanLine()`?
4. **Duplicate detection.** What key, at what stage, and what happens on a hit — reject, merge, or
   flag.
5. **The `agent-memory` ↔ `agent-canon` skill seam**, which the operator called clunky. Name the
   clunk concretely before proposing anything; V2 already exposed one instance (a verb whose
   contract was stated three different ways in three files).

Plus: **migration** for any store-shape change, and whether existing records are rewritten or left.

## Constraints

- The spec re-shards into `plans/close-out/pending/` — MECE, each with `⟨intent, inputs, constraints,
deps, outputs, accept⟩`, and each acceptance **must fail on the pre-state** (`∀t : ¬accept(t)(pre(t))`).
- Ground every claim in a citation. This plan's whole method has been code-over-doc; a spec authored
  from the plan docs would invert it.
- If R1's verdict contradicts the operator's hypothesis, **say so plainly and follow the evidence**.
  It was explicitly offered as a hypothesis, not a conclusion.

## Outputs

`plans/close-out/SPEC.md` · new shard files under `plans/close-out/pending/` · an updated PLAN.md
slice table (`advance ⊨ mirror`)

## Acceptance

1. `SPEC.md` exists and takes all five decisions, plus migration, each with its reason.
2. Every decision cites either R1 or a `path:line`.
3. At least one new shard file exists under `pending/`, and every one has all six spec fields.
4. Each new shard's acceptance is falsifiable and stated to fail on the pre-state.
5. The PLAN.md slice table and `R` are updated to include them.
