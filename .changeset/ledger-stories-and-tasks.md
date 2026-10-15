---
"@cratylus/runtime": minor
"@cratylus/forge": minor
"@cratylus/canon": minor
"cratylus": minor
---

The ledger now records the project's work by story and task, and the cut machinery is gone.

`cratylus ledger` replaces `cratylus workPackage`, and the capability `ledger` replaces `workPackage` everywhere (`CAPABILITIES`, `RUNTIME_CAPABILITIES`, omp's offered tools). Its verbs are `state` (every story and task in flight, every one ended with how, merged or dropped, each with its agent runs in total and by role, its tokens and its elapsed time from the entries' own timestamps; a task's runs also count toward its story), `story <name> [--context …]`, `task <name> [--story …]` and `end <name> --outcome merged|dropped`. Stories and tasks share one namespace of kebab ids.

`cratylus lifecycle` takes `dispatched` (`call`, `agent`, `role`, `story?`, `task?`) and `returned` (`call`, `agent`, `tokens?`). A dispatch naming a story or task not yet recorded records it in flight; one naming neither, and the return of a dispatch the ledger does not hold, are recorded for nothing and never fail. The `verdict` and `reported` kinds are gone.

The cut-era entries in `design/ledger` stay as history: never in flight, never counted, never reported as unknown. The concept journal still reads from them which cuts were integrated, so the decisions they deprecated stay deprecated.

The concept journal's overview tells the stories and tasks in flight on each context (`workInFlight`, in place of `cutsInFlight`; "No work is in flight."); a story recorded with contexts touches those, one without touches every context. `define`, `supersede` and `retire` no longer warn of a freeze. `concepts state` gives a context's recorded cut `efficiency` only with `--history`.

Removed: the work package capability and its dependency graph, freeze, rounds, whole-check runs, integration and `record`; the completion check (`cratylus completion-check`, its `post-commit` hook and `completionCheck`/`WATCHED`); the example substrate (`@cratylus/runtime/example-substrate`), which nothing live used; and the `@dagrejs/graphlib` dependency. The runtime barrel now exports `workIn`, `foldWork`, `LEDGER`, `OUTCOMES` and the ledger's entry types in place of the cut API (`cutView`, `cutsInLedger`, `frozenCuts`, `foldCut`, `readCut` and their types).
