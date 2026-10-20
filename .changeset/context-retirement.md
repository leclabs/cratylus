---
'@cratylus/runtime': minor
'cratylus': minor
---

The concept journal retires a bounded context: `concepts retire --context <context> --reason '…'`, given no concept, records a `retire-context` entry superseding the context's current descriptions, refused for a context the journal does not have, one already retired and a delivered one. A retired context and its concepts leave `state`, `design` and `leakage`; `decisions` lists its decisions only with `--history`; its own history lists the retirement with its reason; `define`, `supersede`, `retire` and `decide` into it are refused, naming the remedy; `concepts context <context> --reason '…'` brings it back, its subject and relation carried from before; a retired own copy of a delivered context lets the delivered one show again; and closing the books carries nothing of it.
