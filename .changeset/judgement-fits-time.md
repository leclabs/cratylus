---
'@cratylus/canon': patch
'@cratylus/forge': patch
---

A guard's judge is now sent a smaller rubric and a bounded excerpt, so a judgement fits the time
its harness allows a guard and a judge that is merely slow is no longer reported as one that could
not run. The stance rubric is cut from 29 KB to under 14 KB, keeping its rules, boundary tests and
output protocol; its rationale and measurements move to the hook source's comments. All three
workers (turn end, pre-tool, purview) send at most 12000 bytes: a turn keeps its close and the
operator message its tail, a dispatch or menu keeps both ends, each cut is marked, and a BLOCK's
evidence is checked against what the judge was sent. No deadline and no cell timeout is raised.
The omp bridge's deadline comments now carry the new measurement; its constants are unchanged.
