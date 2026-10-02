---
'@cratylus/canon': patch
'@cratylus/schema': patch
'cratylus': patch
---

The `line-worktree` hook is retired. It was the Claude Code `WorktreeCreate` hook that took over the harness's worktree creation to cut the implementer's worktree from the bound plan's line, and it no longer ships: the cell, its committed worker and its test are gone, and the practices that placed the implementer no longer list it. Nothing replaces it. The implementer keeps `isolation: worktree` on Claude Code and stays an isolated task on omp, so the isolation is the harness's own; Claude Code cuts that worktree as it cuts any, by its `worktree.baseRef`, and omp cuts its isolated copy from the dispatcher's HEAD. Starting from the plan's line is the implementer's own move, and `plan land` already refuses a commit not built off the line. A host that installed the hook loses it on its next install, by the deploy prune of registrations the render tree no longer carries. `Practice.hooks` and the `worktree.create` event stay as general plugin surfaces.
