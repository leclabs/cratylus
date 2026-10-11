---
'@cratylus/canon': minor
'@cratylus/forge': minor
'@cratylus/schema': minor
---

Canon ships the `past-objective` guard (`pastObjective`), bound to `tool.use.pre`, whose judge answers `{"pastObjective": boolean, "reason": string}`. The architect's `optimize` stopping rule is held by it (`guarded(optimize, pastObjective)`), so a tool call made after the conversation shows the objective of the operator's current request met, which takes a further step instead of reporting the outcome, is refused with the tell `procedure past objective`.

`@cratylus/schema`'s `GuardJudge` gains the optional `conversation`: a judge that sets it also reads the session's conversation so far. On omp the session module gives such a judge the session branch since its last compaction, as visible text (the operator's messages, the agent's replies and its delegates' `task` reports, never thinking, calls or guard notices, at most its last 12,000 characters), ahead of the act.
