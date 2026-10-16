---
"@cratylus/forge": minor
"@cratylus/canon": minor
---

The omp extension no longer warns of skipped cut steps: the lead and builder dispatch warnings (cut record, branch checked out, work package readiness, unserved concepts, unowned or unchecked examples) are gone. It captures nothing of agent runs: no dispatch, return, verdict or report is sent anywhere, and a dispatch from `eval` code is warned only that its assignment is not shown or checked. It still checks each dispatch's assignment against its agent's form and still names the acting agent on every capability call. The misfit warning with the assignment form, version skew, agent launch and the session-start note are unchanged. omp's dispatch isolation now says it is made from the dispatcher's HEAD and not from the branch the work belongs on, which it must be moved onto before it is merged.

The shipped practice `example-driven-workflow` is renamed `intent-based-delegation`: select it with `--practices intent-based-delegation`.
