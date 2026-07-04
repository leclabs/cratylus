# AGENTS.md · warm-cold-acceptance (plan-scope memory sink)

_Semantic memory at plan scope. Dream routes plan-scoped items here (open threads · next-steps ·
plan-durable facts); wake's orient reads it. Reconciled as consolidation (dedup · net-current ·
move-not-copy), not appended as a journal._

## Load-bearing frame (do not re-derive)

- **Oracle = source of truth.** `R_cold(f)` = naive isolated-LLM decode (scratch dir OUTSIDE the repo,
  `claude -p "explain:\n\n<f>"`, zero project context). The corpus is the DEFENDANT; when corpus and
  cold-read conflict, the corpus is wrong.
- **A spawned subagent is NOT cold** — it inherits project MEMORY.md + local agent-registry name-aliases.
  Only process-level isolation (separate cwd outside the repo) yields a true cold read. This is the crux;
  every gate uses the isolated harness (T1), never an in-session subagent.
- **Correction direction is one-way:** realign the PROJECT toward cold-truth; NEVER bend a fragment to
  the warm corpus. Bending f→K is the inverted-source-of-truth failure that motivated this plan.
- **Warm priors ADD noise, not only reduce it** — witnessed: a warm reader over-read a clean charter's
  line where the cold reader stayed literal-correct.

## Provenance of this plan

Authored by nico-outside (clean context) on the reasoning that a correct plan here is a corpus-agnostic
oracle-driven PROCEDURE, not a warm-derived edit list — so a cold author is the right author, and reading
the corpus would degrade it. Enumeration (T2) is the only corpus-touching step and it is runtime.

## Open threads / next-steps

- INSTANTIATE: move this staged plan (~/workspaces/blank/warm-cold-acceptance/) into
  ~/workspaces/polis/plans/warm-cold-acceptance/ — sequenced with the live warm face, commit/push GATED
  to the Operator.
- UPSTREAM (related, from the originating session): re-signify nico's own Provenance organ value from
  human prose to the R=LLM charter form — a candidate first sweep-target under T3 (dogfood).
