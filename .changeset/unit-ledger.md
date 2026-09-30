---
'@cratylus/runtime': minor
---

A unit carries a ledger of what happens to it while it is worked. Four new `plan` verbs write it: `land` (the commit that holds its work), `assay` (a verdict, `achieved` or `not-achieved` with what was missing, on a commit), `whole` (the line's commit holding the unit) and `broke` (the check that failed). An event is admitted only while the unit's plan is bound and the unit is in flight, and is refused on a proposed or closed plan and on a unit not yet started or already done. `plan show <unit> --plan <p>` prints the ledger, each unit's line in `plan show` carries its latest event, and an event's own output prints the unit's line and its ledger and none of its spec. Revise, advance and reconcile carry the ledger over; a unit written before this change reads as an empty ledger.
