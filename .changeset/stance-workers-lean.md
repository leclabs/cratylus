---
'@cratylus/canon': patch
---

The two stance guard workers shrink to what a guard does (read the event, decide whether it applies, ask the judge, relay the verdict): the pre-call worker from 14 KB to 6.4 KB and the turn-end worker from 49 KB to 15 KB, by leaving the history their comments carried to git and folding the transcript passes that recomputed the same turn into one. What either worker emits, sends the judge, writes and exits with is unchanged.
