---
"@cratylus/forge": patch
---

On omp, a guard whose judge stopped answering now asks it again after a cooldown instead of staying dark for the rest of the session: once three consecutive calls miss their deadline the judge is skipped for two minutes, the first fire after that asks it once, an answer clears the outage and a miss starts a new cooldown. A guard also says so again when a later outage follows a recovery, even when the notice reads the same as the first. A call that was answered no longer counts a miss when its deadline timer later fires.
