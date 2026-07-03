# plans — polis plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear. A retired plan leaves **no note here** —
net-current only: its dir is removed and `git log -- plans/<name>/` is the record ([[plan-retirement]] ·
[[doc-mirrors-runtime-truth]]).

## Active

| Plan                | Concern                                                                                                                                                                                                                          | Lead                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `run-the-business`  | The standing plan — live backlog + standalone tasks; perpetual (never retires). Backlog currently empty.                                                                                                                         | Mav + Nico (per task) |
| `interop-hardening` | **✓ COMPLETE 2026-07-03** (tracked 229→0, roster 11→16, pushed `e20b088`) — capability surface hardened; 16 adapters truth-fixed. Dir retained for review; retire (`git log -- plans/interop-hardening/` is the record) at will. | Nico (lead) + Mav     |
