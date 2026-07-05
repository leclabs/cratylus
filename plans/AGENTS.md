# plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear. A retired plan leaves **no note here** —
net-current only: its dir is removed and `git log -- plans/<name>/` is the record ([[plan-retirement]] ·
[[doc-mirrors-runtime-truth]]).

## Active

| Plan                | Concern                                                                                                                        | Lead                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `run-the-business`  | The standing plan — live backlog + standalone tasks; perpetual (never retires).                                                | Mav + Nico (per task) |
| `canon-conformance` | Bring tracked `.ts` source to `∀c: accept(c)` vs the root model (VISION/MODEL/ENGINE/CANON); runtime = regenerated projection. | Nico + Mav            |
