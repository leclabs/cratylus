---
'@cratylus/runtime': minor
'@cratylus/canon': minor
'@cratylus/forge': minor
'cratylus': minor
---

The runtime ships a third capability, `workPackage`: `cratylus workPackage <verb> --cut <context>/<name>` slices a cut into work packages and hands them out. `submit` and `update` record a package's outputs, concepts, dependencies and needed outputs, refusing an output another package owns, a concept the cut's visible examples do not name, an unknown dependency and a needed output no dependency owns. `levels` computes the dependency graph's levels with `@dagrejs/graphlib` and names the packages of any cycle instead. `dispatch` hands out the lowest unfinished level a whole level at a time and refuses when nothing is ready, when a concept is unserved or when any example has no owner, naming it; `finish` marks a package finished. `inventory` and `assignment` give every visible example its one owner. `commit` reads a builder's paths literally, never as globs, commits them only when every file they would commit lies within its package's outputs, and keeps them in the package's `history`. `check` records a whole-check run as its own round and flags a round that resolves none of the previous run's failures; `run` records an agent run with its role and tokens; `efficiency` reads the figures, and `record` appends them to the concept journal. Each cut's log lives under the repository's git common directory, shared by its worktrees and never tracked.

The capability explains itself as `work package` (`cratylus workPackage --explain`), so omp offers it as the tool `work_package` through the cratylus extension, its reading verbs alone to a read-only agent.

The concept journal gains the entry kind `efficiency`, and `cratylus concepts state` gives each context an `efficiency` field: each of its cuts with the figures last recorded for it and when, explained in the `reading` legend.

`@cratylus/canon`'s `RUNTIME_CAPABILITIES` gains `workPackage`.
