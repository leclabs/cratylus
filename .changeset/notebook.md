---
"@cratylus/runtime": minor
---

The runtime gains the notebook: notes held as records, folded at read time

A note is an entity in the record store's `notebook` domain. Its payload is its title, kind, topic,
body and the plans or units it blocks. Its title is its name, and its identity is the store's
minted one, never a sequence number. One live note per title: a live note holds its title, a
diverged note holds every title its heads carry, and a withdrawn note holds none. One title held
by two notes is incoherence, which only a merge produces, and `notebook` reports it. `capture`,
`revise` and `reconcile` refuse only a write that introduces a duplicate, meaning one whose notes
were not already bound together in a standing duplicate. A write that shrinks a duplicate or
leaves it standing proceeds, so a merge-produced collision can be repaired one retitle at a time.
Anyone may capture, revise, retract or reconcile a note. `capture` has no admission bar and refuses
only a malformed shape (a field missing or of the wrong type) or an introduced duplicate. It never
judges content. `revise` writes a whole-state version over every head of the note, and `retract`
writes a retraction that becomes its head. Heads that carry the same payload have converged and
read as one live note. `notebook` computes the live notes, reports every diverged note with all its
heads without ever picking one, and reports duplicate titles. `revise` and `retract` refuse a
diverged note and point to `reconcile`, which writes one whole-state version superseding every
head. A note's kind is a label the runtime never interprets. `owedRulings` names each plan or unit
that a live note blocks, or that any head of a diverged note blocks, together with the notes
blocking it. The module is internal and is exported through neither the `.` barrel nor a subpath.
