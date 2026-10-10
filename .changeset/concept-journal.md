---
'@cratylus/runtime': minor
'cratylus': minor
---

Add the `concepts` capability, the concept journal: `cratylus concepts` keeps each bounded context's concepts and decisions as an append-only journal in `design/journal` (one file per entry, merging across branches as the union of their files), appended through `context`, `define`, `supersede`, `retire`, `decide` and `accept`, and read through `state`, `design`, `history` and `decisions`, with competing versions reported until a later version supersedes them all.
