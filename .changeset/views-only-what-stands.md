---
'@cratylus/runtime': minor
'cratylus': minor
---

The record's default views show only what stands; history only with `--history` (decision "The record shows only what holds").

- **`concepts state`** no longer lists retired concepts, the reason each live concept's version was written, or the effort of finished cuts (work complete or integrated) or of cuts the ledger does not record; its `efficiency` gives only the cuts the ledger records not yet finished. `--history` adds them all back.
- **`concepts design`** no longer lists retired concepts or each live concept's `reason`, and takes `--history` to add them.
- **`concepts decisions`** gives each standing decision with its governing `kind` only: `supersedes`, `supersededBy` and `kinds` (every kind recorded) are history, given with `--history`.
- `overview`, `leakage`, `history` and the ledger's views are unchanged: `overview` already tells only live concepts, open decisions and cuts in flight, `leakage` already reads only what stands, `history` is history asked for, and every ledger view but `frozen` (cuts not integrated) answers about the one cut it is asked for.
