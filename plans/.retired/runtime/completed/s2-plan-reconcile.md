# S2 · plan-reconcile

**Objective.** Reconcile the superseded/​reshaped shards in the two affected plans so no executor builds the dead design. This is a DOC/de-palimpsest concern — no source edits. skills-refactor **T4** (dep-free-bundle) is SUPERSEDED by this plan's thin-shim architecture (S6+S8); **T5** re-cuts. event-tap **E2** is RESHAPED — its mechanism absorbs into S5, its skill-cell into an S8 thin-shim. E3 stays orthogonal (untouched).

**Static inputs (pinned):**

- `plans/skills-refactor/PLAN.md` + `plans/skills-refactor/pending/{t4-compose-build.md, t5-integrate.md}`.
- `plans/event-tap/PLAN.md` + `plans/event-tap/{ready/t1-derive-verbs.md, ready/t2-assets-bridge.md, pending/t3-mechanism.md, pending/t4-skill-cell.md, pending/t5-integrate-deploy.md}`.
- `plans/runtime/PLAN.md` — this plan's slice map (the supersession target).

**Constraints.**

- DOC-ONLY: touch only `plans/**`. No source, no test edits.
- De-palimpsest, not delete-history: mark superseded shards with a single net-current pointer to the superseding slice (`SUPERSEDED-BY runtime/S6+S8`); do NOT bulk-delete a committed plan (git holds the trail) — retire per `partition-then-prune` (a committed plan is git-restorable ⇒ may `git rm` the dead shard; but PREFER a supersession marker so the reasoning survives).
- Preserve what SURVIVES: skills-refactor T1/T2/T3 stay completed (they landed). event-tap T1/T2 (derive-verbs, assets-bridge) may survive as inputs to S5 — assess and note, don't destroy.
- Do NOT touch the `.owner` of another plan or resume it — reconcile the DOCS only.

**Dependencies.** none (wave 0 root; doc concern).

**Outputs.** Updated `plans/skills-refactor/PLAN.md` (T4/T5 marked superseded/re-cut with the pointer) + `plans/event-tap/PLAN.md` (reshape note). A short `plans/runtime/SUPERSESSION.md` (or a PLAN.md §) enumerating: which shards die, which survive, which absorb where.

**Completion criteria (falsifier).** A cold reader opening skills-refactor or event-tap sees the net-current status (superseded/reshaped) with a pointer to runtime, NO orphaned "build the dep-free bundle" instruction remaining actionable, and the SURVIVING shards (skills-refactor T1/T2/T3; event-tap T1/T2) intact. Return REJECTED if any source file changed, if a committed plan's durable history was destroyed without a supersession trail, or if the reconciliation left an actionable instruction to build T4's dep-free bundle.
