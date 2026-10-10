---
'@cratylus/runtime': minor
'cratylus': minor
---

Add the `concepts` capability, the concept journal: `cratylus concepts` keeps each bounded context's concepts and decisions as an append-only journal in `design/journal` (one file per entry, merging across branches as the union of their files), appended through `context`, `define`, `supersede`, `retire`, `decide` and `accept`, and read through `state`, `design`, `history` and `decisions`. What merged branches recorded is kept, never chosen between: competing versions of a concept, and competing descriptions of a context (`competingDescriptions`), are reported until a later entry settles them; two decisions recorded under one id are both kept, each identified by its `entry`, which `accept` and `--supersedes` take where the id is shared; superseding a retired concept brings it back. The immutability gate now also refuses any edit, deletion, rename or type change under `design/journal`.
