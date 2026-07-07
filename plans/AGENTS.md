# plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear. A retired plan leaves **no note here** —
net-current only: its dir is removed and `git log -- plans/<name>/` is the record ([[plan-retirement]] ·
[[doc-mirrors-runtime-truth]]).

## Active

| Plan                    | Concern                                                                                                                                                                                                                                                                                                                                                                                        | Lead                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `run-the-business`      | The standing plan — live backlog + standalone tasks; perpetual (never retires).                                                                                                                                                                                                                                                                                                                | Mav + Nico (per task) |
| `forge-anatomy-debraid` | De-braid agent-anatomy ↔ agent-forge: anatomy must consume forge's `Skill`/`Agent` IR (stop reimplementing the toolkit); adapter → thin generic-IR→harness map; skill cell drops stored `body`, `formalBlock`(σ\*) sole payload, `description`(σ_human\*). **BOOTSTRAP** — diagnosed + context-captured; detailed sharding awaits a fresh session. Broken WIP `00d19f5`; last green `7fd1c43`. | Nico (+ Mav)          |
