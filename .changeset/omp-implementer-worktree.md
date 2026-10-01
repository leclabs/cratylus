---
'@cratylus/forge': patch
'cratylus': patch
---

`cratylus install --harness omp` now says, in its summary and not only in the warning under it, that the implementer is not started in a worktree of its own on omp and that the land gate refuses work built in the main checkout. The projection's warning stays, and `ProjectedTree` gains `unisolated`, the sorted names of the agents that declare a worktree the harness cannot start, which install reads. The README's "Where Claude Code and omp differ" says the same.

omp's task isolation was measured on 18.4.9 and does not close the gap. An extension's `tool_call` handler can set a task's `isolated`, and `task.isolation.apply: false` keeps the copy's changes out of the dispatcher's checkout (its `git status` is unchanged), but the copy is cut from the dispatcher's own checkout, HEAD and uncommitted work, and no ref can be given: its HEAD is the dispatcher's, not the plan line's tip. Moving the copy's HEAD onto the line from inside the copy keeps the agent's own commits on `omp/task/<id>` only while the dispatcher's checkout is clean; once it holds uncommitted work omp rewrites the commits onto the dispatcher's HEAD, and the history no longer runs from the line. The omp side therefore stays unchanged and no host setting is recorded.
