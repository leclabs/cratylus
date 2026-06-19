---
kind: principle
delineation: A recurring loop must gate its own output on actual change — when a cycle detects zero delta across its authoritative sources, it emits nothing and commits nothing; output bandwidth tracks the real signal, not the polling rate, and the next non-silent cycle records "covers N silent cycles" so the timeline reconstructs losslessly.
---

# Emit Only on Change

Ashby's requisite variety: emit at the rate of change, not the rate of observation. The change-decision lives **at the loop**, not in the scheduler that wakes it — the scheduler only triggers; the loop alone decides whether anything is worth saying.

## See also

- [[never-go-silent]] — distinct: that forbids going dark on a _human waiting on you_; this forbids emitting _noise when nothing changed_. Report substance, suppress non-events.
- [[doc-mirrors-runtime-truth]] — the loop mirrors the authoritative sources; it writes only when they actually move.
