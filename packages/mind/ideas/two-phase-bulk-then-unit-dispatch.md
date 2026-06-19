---
kind: principle
delineation: Dispatch granularity is not constant across a workflow — run a coarse bulk phase first (one pass fixes a defect across many units via pattern-recognition), then switch to fine per-unit on the residual; the handoff signal is the population-fix-rate plateau, not a budget.
---

# Two-Phase Bulk-Then-Unit Dispatch

- **Phase 1 — bulk.** N units × 1 dimension per pass; the agent reads the defect pattern across the population and applies the pattern-recognized fix to all matching units in one inference. Plateau signal: a pass of the same shape moves few units — the bulk-fit defects are mined out.
- **Phase 2 — unit.** 1 unit × 1 dimension; targeted fix of each unique residual failure. Done: every unit passes its verifier or carries a typed exception ([[false-positives-ship-bugs-stamped-absence]]).

Discipline: **one workflow, two granularities** (Phase 2 reads the population state left in Phase 1's residue); **plateau, not budget**; the bulk→unit boundary is a typed state move ([[state-transitions-as-agent-protocol]]). Per-unit work on a bulk-fit defect is the orchestration-mode mismatch — the cure is the granularity switch, not bigger context.

## See also

- [[shard-by-orthogonal-concern]] — produces the population the bulk phase operates over.
- [[dimension-decomposed-validity]] — the per-dimension axis the unit phase narrows on.
- [[planner]] — the archetype that chooses granularity.
