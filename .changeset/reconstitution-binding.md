---
'@cratylus/forge': minor
'@cratylus/runtime': minor
'@cratylus/canon': patch
'cratylus': minor
---

Typed handoffs bound on omp. Each agent declaration carries its deliverable schema as omp's own `output` and its assignment schema under `assignment`; no declaration lists `tools`, and the body ends with the agent's per-turn persistence protocol. The cratylus extension drops the read-only journal gate: every agent is offered every verb. On every `task` call, in any session, each item whose agent declares an assignment is checked with the schema package's own `checkAssignment` against its fenced `assignment` block, and a misfit refuses the whole call, naming the agent and each missing or ill-typed field. A lead's cut brief also needs the cut's record and its branch checked out; a builder's dispatch is refused when its package is not ready, a concept is unserved or a visible example unowned (ruling 0083). Items whose agent declares an `output` run with `schemaMode: "strict"`. A session launched with `--agent` as such an agent checks its launch prompt the same way. The extension appends the harness's own events through `cratylus lifecycle`: `dispatched`, `returned` (with tokens when reported), `verdict` from an assayer's deliverable and `reported` from a lead's, each transition derived from the task call and item ids.

Guards. Projection discovers a plugin's guard cells (`guards` dir) and binds each to the agents composing a value `realizedBy` it; on omp the guard lands in the session module and judges only a main session launched as one of those agents, through the session's own model (`completeSimple`). The architect's `hand-back` guard refuses a turn end whose reply hands an owned decision back to the operator. The projection result reports `guards`, and install names them.

Capability fidelity. `HarnessAdapter` gains `nativeCapabilities`. Projection chooses for each runtime capability the harness's own facility, else the extension tool, else prose generated from the capability's own explanation (staged as `capabilities/<capability>.md` and carried by every agent), and reports the form as `capabilities`. `@cratylus/runtime` exports `WORK_PACKAGE`, `explain` and `Explanation` for it.

A builder's assignment `examples` may be empty: a package sharing outputs owns no example.
