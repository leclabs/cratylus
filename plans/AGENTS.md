# plans — polis plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear. A retired plan leaves **no note here** —
net-current only: its dir is removed and `git log -- plans/<name>/` is the record ([[plan-retirement]] ·
[[doc-mirrors-runtime-truth]]).

## Active

| Plan                | Concern                                                                                                                                                                                       | Lead                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `run-the-business`  | The standing plan — live backlog + standalone tasks; perpetual (never retires). Backlog currently empty.                                                                                      | Mav + Nico (per task) |
| `interop-hardening` | Pressure-test + harden the library's capability surface: harness landscape + standards research → full user-story library → story-coverage tests (failing = the gap) → implementation shards. | Nico (lead) + Mav     |
