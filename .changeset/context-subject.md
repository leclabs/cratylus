---
'@cratylus/runtime': minor
'cratylus': minor
---

A bounded context's subject and its place in the context map now change the way a concept does (decision 0056), with no new verb: a reason marks a change. `cratylus concepts context <context> --subject <s>` still records a new context, and refuses one already recorded, pointing to `--reason`; `cratylus concepts context <context> --reason <why>` with `--subject`, `--relation` or both records a new description of a recorded context that supersedes the current one (all of them while merged branches compete, which settles them), carrying over a field left out. A change never creates a context: a name the journal does not have is refused, and every refusal appends nothing. `cratylus concepts history --context <context>`, given no concept, prints the context's own history, `{ context, versions }`, every description in the order recorded with its reason and what it supersedes; `state` and `design` still show only the current description. The concept positional of `history` is now optional: its help prints `[concept]` and `--explain` gives it `required: false`.
