---
"@cratylus/runtime": minor
"@cratylus/forge": minor
"@cratylus/canon": minor
"cratylus": minor
---

Cratylus keeps no record of the work. What is in flight and how it ended is seen in the project's version control and the lead's outcomes; what it cost is what the harness records and the outcome reports. The concept journal is the project's one record of its own, and it holds the design alone.

Removed: the work package capability (`cratylus workPackage`, its verbs, its dependency graph, freeze, rounds, whole-check runs, integration and `record`) from `CAPABILITIES`, `RUNTIME_CAPABILITIES` and omp's offered tools, with nothing in its place, so the runtime's capabilities are `concepts` and `versionSkew`, and an installation upgraded from an earlier one no longer offers its tool; the harness-facing `cratylus lifecycle` command and `appendLifecycle`; the completion check (`cratylus completion-check`, its `post-commit` hook and `completionCheck`/`WATCHED`); the example substrate (`@cratylus/runtime/example-substrate`), which nothing live used; the `@dagrejs/graphlib` dependency; and the cut API the runtime barrel exported (`cutView`, `cutsInLedger`, `frozenCuts`, `foldCut`, `readCut` and their types). Nothing is migrated from the files the capability kept, and nothing reads them.

The concept journal's views read only the journal and the example files. The overview no longer tells work in flight (`cutsInFlight` and its line are gone), `define`, `supersede` and `retire` no longer warn of a freeze, and a decision recorded about a cut is read by its own status alone. `concepts state` gives a context's recorded cut `efficiency` only with `--history`.

The reconstitution procedure and the omp session-start and per-turn notes say a session sees the work in flight and how it ended in the project's version control and the lead's outcomes; the lead's outcome states its cost as the harness records it.
