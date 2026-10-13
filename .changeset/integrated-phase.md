---
'@cratylus/runtime': minor
'cratylus': minor
---

A cut's phase reads `integrated` once its integration is recorded, whatever its work packages' statuses, which stay as recorded. Before, an integrated cut read `open`, `in flight` or `complete` from its packages alone. `workPackage state` answers `phase: 'integrated'`, `concepts overview` no longer lists an integrated cut among the cuts in flight, and the post-commit completion check stays silent for a `feat(cut:<name>): ` commit whose cut is integrated. No ledger entry is added or changed: every integration already recorded reads integrated.

The concepts capability's `leakage` verb now serves the concept `concept journal` (decision 0158), and its explanation names that concept.
