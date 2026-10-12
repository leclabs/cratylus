---
'@cratylus/forge': minor
'@cratylus/runtime': minor
'@cratylus/canon': patch
'cratylus': minor
---

Typed handoffs bound on omp. Each agent declaration carries its deliverable schema as omp's own `output` and its assignment schema under `assignment`; no declaration lists `tools`, and the body ends with the agent's per-turn persistence protocol. Every agent is offered every verb of every capability. Every turn carries the assignment form of each agent that takes a typed one, and on every `task` call, in any session, each such item is checked with the schema package's own `checkAssignment` against its fenced `assignment` block; a misfit is warned of, naming the agent and each missing or ill-typed field, and the dispatch goes ahead. A session launched with `--agent` as such an agent checks its first prompt the same way. The extension appends the harness's own events through `cratylus lifecycle`: `dispatched`, `returned` (with tokens when reported), `verdict` from an assayer's deliverable and `reported` from a lead's, each transition derived from the task call and item ids.

Capability fidelity. `HarnessAdapter` gains `nativeCapabilities`. Projection chooses for each runtime capability the harness's own facility, else the extension tool, else prose generated from the capability's own explanation (staged as `capabilities/<capability>.md` and carried by every agent), and reports the form as `capabilities`. `@cratylus/runtime` exports `WORK_PACKAGE`, `explain` and `Explanation` for it.

A builder's assignment `examples` may be empty: a package sharing outputs owns no example.
