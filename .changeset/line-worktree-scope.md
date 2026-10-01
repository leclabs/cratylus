---
'@cratylus/canon': patch
'cratylus': patch
---

The `line-worktree` hook now cuts only the implementer's worktree from the bound plan's line, and leaves every other worktree on the host to be created as Claude Code would create it. It used to cut every worktree Claude Code makes — a `claude --worktree` session, a background session isolated in a worktree, any subagent declaring `isolation: worktree` — from the line whenever a plan was bound, and to fail the creation outright where `cratylus` or `jq` was not on `PATH`, or where `cratylus plan show` answered a first line the hook did not recognise (`with nothing committed yet`), in every repository on the host.

The hook tells the implementer's worktree by the name Claude Code gives a subagent's (`agent-a` and 7 or 16 hex digits), since the `WorktreeCreate` input names no subagent. For every other worktree, and for the implementer's when there is no line to cut from (no plan bound, `cratylus` or `jq` missing, a `plan show` answer it does not know, a line commit the repository does not resolve), it creates the worktree at `<project>/.claude/worktrees/<name>` on `worktree-<name>`, from origin's default branch or, where the host's `worktree.baseRef` is `head` or there is no origin, from HEAD, and prints its path; without `jq` it reads the request and `baseRef` with `sed`. It still fails, with no path and no worktree, a creation Claude Code's own would refuse: an unusable `cwd` or `name`, a `cwd` in no repository, a path already taken, a `git worktree add` that fails.
