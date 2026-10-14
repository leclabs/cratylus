---
'@cratylus/runtime': patch
'cratylus': patch
---

Work dispatched outside any cut is no longer recorded in the ledger as a cut (decision 0201, item 5).

The ledger now records a harness lifecycle event (`dispatched`, `returned`, `verdict`, `reported`) only for a cut opened in it. A dispatch whose assignment names no opened cut, such as ordinary engineering under decision 0202, records nothing, and the dispatch goes ahead as before.
