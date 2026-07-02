# plans — polis plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear. A retired plan leaves **no note here** —
net-current only: its dir is removed and `git log -- plans/<name>/` is the record ([[plan-retirement]] ·
[[doc-mirrors-runtime-truth]]).

## Active

| Plan                 | Concern                                                                                                                                                                                                                                                            | Lead                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `run-the-business`   | The standing plan — live backlog + standalone tasks; perpetual (never retires). Pending: `explicit-omit-to-inherit`, `p4-stance-protocol-tail`, `generic-extraction` (deferred).                                                                                   | Mav + Nico (per task) |
| `scoped-memory`      | Scope-route memory so an agent's own `SELF`/`MEMORY` stay free of project/plan pollution; episodic capture + dream drain by scope. Pending: `produce-execution-spec` (plan-the-plan).                                                                              | Nico                  |
| `reader-llm-default` | Enforce reader=LLM as the default across all LLM-read artifacts (source · SOULs · skills · instructions · plans · memory · consumer-generated · agent↔agent); signifier-carries-load; kill the reader=human drift. Root-cause → gate → fan-out-with-nico-as-judge. | Nico (+ Mav gate)     |
