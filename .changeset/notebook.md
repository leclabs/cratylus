---
"@cratylus/runtime": minor
---

The runtime gains the notebook: notes held as records, folded at read time

A note is an entity in the record store's `notebook` domain. Its payload is its kind, topic, body
and the plans or units it blocks. It has no name, and its identity is the store's minted one, never
a sequence number. `capture` writes a note's first version with no admission bar, refusing only a
malformed shape (a field missing or of the wrong type) and never judging content. `supersede`
writes a whole-state version over the note's one current head. `retract` writes a retraction that
becomes its head. `notebook` computes the live notes and reports every diverged note with all its
heads, never picking one, and a supersession refuses a diverged note. Kinds are opaque to the
runtime. `owedRulings` names each plan or unit that a live note blocks, together with the notes
blocking it. Retracting a note closes its owed ruling. The module is internal and is exported
through neither the `.` barrel nor a subpath.
