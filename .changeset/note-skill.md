---
"@cratylus/canon": minor
---

Add the `note` skill: the notebook's intents, routed to the `note` capability

The cell declares `runtime: { capability: 'note' }`, so projection emits its
`scripts/note.mjs` shim, and it scripts the landed verbs exactly: `show`,
`capture`, `revise`, `retract` and `reconcile`, each write with `--author`,
`--reason` and `--cause`. It is the one home of the three kinds (idea, question,
decision), which the runtime carries as labels it never interprets. A note is
addressed by its title, one live note per title, and a change is a revise,
never an edit in place. Anyone may write a note and capture has no admission bar.
Any live note naming a plan or a unit (`u of plan p`) is an owed ruling whatever
its kind, and a note a merge left in competing versions blocks whatever any of
them blocks until it is reconciled.
