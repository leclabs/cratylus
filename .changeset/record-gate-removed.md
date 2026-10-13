---
'@cratylus/runtime': minor
'cratylus': patch
---

The record gate is gone (decision 0153). `@cratylus/runtime` no longer has the `immutability-gate` script or module, and no hook or CI step refuses a change to existing records under `records/`, `design/journal/` or `design/ledger/`; history is controlled by pull-request review. The concept journal and the ledger stay append-only because their verbs only append.
