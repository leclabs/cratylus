---
"@cratylus/runtime": minor
---

The runtime gains the notebook: notes held as records, folded at read time

A note is an entity in the record store's `notebook` domain. Its payload is its kind, topic, body
and the plans or units it blocks. It has no name, and its identity is the store's minted one, never
a sequence number. Anyone may capture, revise, retract or reconcile a note. `capture` writes a
note's first version with no admission bar, refusing only a malformed shape (a field missing or of
the wrong type) and never judging content. `revise` writes a whole-state version over the note's
one head, and `retract` writes a retraction that becomes its head. `notebook` computes the live
notes and reports every diverged note with all its heads, never picking one. `revise` and `retract`
refuse a diverged note and point to `reconcile`, which writes one whole-state version superseding
every head. A note's kind is a label the runtime never interprets. `owedRulings` names each plan or
unit that a live note blocks, or that any head of a diverged note blocks, together with the notes
blocking it. A note stops owing a ruling when it is retracted, revised to block nothing, or
reconciled to block nothing. The module is internal and is exported through neither the `.` barrel
nor a subpath.
