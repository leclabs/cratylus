---
"@cratylus/forge": minor
"@cratylus/canon": minor
---

The omp extension no longer warns of skipped cut steps: the lead and builder dispatch warnings (cut record, branch checked out, work package readiness, unserved concepts, unowned or unchecked examples) are gone, and it no longer captures verdicts or reports from returned deliverables. Instead each agent run the harness sees for a story or a task is recorded into the ledger: every item of a `task` call whose assignment names a `story` or a `task` is sent to `cratylus lifecycle` as `dispatched` with the call's and the item's ids, the agent it runs as (its role) and what it names, and as `returned` when it returns, with the tokens the harness reports. An item naming neither is not sent, nor is its return, so a session outside such work writes no ledger and is warned of nothing; no elapsed time is sent, since the ledger reads it from its entries. A failed send is warned of and the dispatch goes ahead. The misfit warning with the assignment form, version skew, agent launch and the session-start note are unchanged. omp's dispatch isolation now says it is made from the dispatcher's HEAD and not from the branch the work belongs on, which it must be moved onto before it is merged.

The shipped practice `example-driven-workflow` is renamed `intent-based-delegation`: select it with `--practices intent-based-delegation`.
