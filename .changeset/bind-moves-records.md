---
'@cratylus/runtime': patch
'cratylus': patch
---

`plan bind` now moves the plan's records onto its line instead of copying them. The records of the plan, its units and the notes blocking either, which the checkout it runs in holds and the line lacks, are written into the line's worktree and are no longer in the checkout afterwards, where they used to stay as untracked files that a commit of `records/` would have put on the main line and the release of the closed plan would have met as untracked paths. A record the checkout's HEAD tracks stays in it, since a committed record is never removed, and nothing else is removed: a design record and a note naming no plan stay where they were written. A bind run from the line's own worktree moves nothing. `plan show` and `note show` print the same state from the main checkout as from the line's worktree, as before.
