# plans — polis plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear. A retired plan leaves **no note here** —
net-current only: its dir is removed and `git log -- plans/<name>/` is the record ([[plan-retirement]] ·
[[doc-mirrors-runtime-truth]]).

## Active

| Plan               | Concern                                                                                                                                                                                                                | Lead                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `run-the-business` | The standing plan — live backlog + standalone tasks; perpetual (never retires). Pending: `generic-extraction` (deferred — Operator product call).                                                                      | Mav + Nico (per task) |
| `scoped-memory-v2` | Path-scoped memory: cwd-derived records, computed node(cwd) over a marker lattice, deterministic fold + total route, CoALA stores (SELF dissolves). Spec authored + blind-reviewed; shards HELD for Operator approval. | Nico (lead) + Mav     |
