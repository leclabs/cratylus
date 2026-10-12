---
'@cratylus/runtime': minor
'cratylus': minor
---

The freeze holds at the record (decisions 0128, 0129). A hidden, harness-facing `cratylus freeze-gate`, never a capability verb nor an agent tool, runs as git's `reference-transaction` hook: in the `prepared` state it refuses any branch update that brings in a change to a frozen example, held-out example text, frozen check, file a frozen check uses, or a journal entry superseding or retiring a concept a cut not integrated realizes, unless `CRATYLUS_AGENT` names that cut's architect. The refusal names the branch, the cut, its architect and the paths, and the branch stays where it was. Every route that moves a branch meets it, `--no-verify`, amends, merges, cherry-picks, rebases and `update-ref` included. When the ledger is present and what is frozen cannot be read, every branch update is refused, saying why; other states, other refs and a repository with no ledger pass silently. This repository wires it through `.husky/reference-transaction`, and `prepare` adds the hook entry husky's list lacks.

`cratylus workPackage frozen` now shows, per cut, `uses`: the files its frozen checks' relative imports reach, transitively, that no work package of the cut outputs; and `unchecked`: its visible examples, as `<context>/<n>`, that no file under a frozen check names. A held-out check is frozen only once a `freeze` names it: the judgment folder is no longer frozen with the cut's first freeze (decision 0125).
