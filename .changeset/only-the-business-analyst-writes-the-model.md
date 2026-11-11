---
'@cratylus/schema': minor
'@cratylus/canon': minor
'@cratylus/forge': minor
'cratylus': minor
---

Only the business analyst writes the domain model. On omp, `cratylus install` places `extensions/cratylus-reach.ts`, which refuses a write to `design/model/` by a subagent of any other agent (omp's own agents included) and by a main session started with `omp --agent` as any other agent of cratylus; the refusal says to raise a meaning question to the business analyst. The product owner's own session is never judged. `write`, `edit` and `ast_edit` are judged by the paths they name; `bash` and `eval` by the text of their input, whether they read or write, so a path a call builds at run time passes; the tools that read are never judged.

`@cratylus/schema` adds `ProtectedPath` and the optional `Agent.writes`. `@cratylus/canon` adds `PROTECTED_PATHS`, gives the business analyst the action scope `write-domain-model`, and copies its protected path onto the business analyst and every persona over it as `writes`. `@cratylus/forge` adds `OMP_REACH_MODULE` and `ompReachExtensions`, and omp's `launchSurface` emits the reach module beside the dispatch isolation module.
