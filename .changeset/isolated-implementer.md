---
'@cratylus/schema': minor
'@cratylus/canon': patch
'@cratylus/forge': patch
'cratylus': patch
---

The implementer now starts in a git worktree of its own, cut from the tip of the bound plan's line, where its session used to begin in the operator's main checkout.

`@cratylus/schema`'s `Agent` gains the optional `isolation?: 'worktree'`, carried on the identity face beside `holds` and `dispatches`, and `Practice` gains the optional `hooks`, the hook cells a practice registers beyond the guards its agents' compositions bind.

`@cratylus/canon`'s `RoleCell` may state `isolation`, `holds` copies it to every holder of the role (a persona cannot state it), and only the implementer role does. The vocabulary gains `worktree.create`, the moment a worktree is made for an agent, and a new hook cell, `line-worktree`, is bound to it: while a plan is bound it creates the requested worktree on a new branch cut from the tip of that plan's line, which it asks the host `cratylus plan show` for and names nowhere itself; with no plan bound it creates the worktree as Claude Code would, from origin's default branch or, where the host's `worktree.baseRef` is `head`, from HEAD. A creation it cannot make, including one made while the runtime cannot say whether a plan is bound, exits non-zero with no path and no worktree, and never falls back to the main checkout. Worktrees it creates are kept on removal. Every practice that places the implementer lists the cell, so every install that places the implementer places it and uninstall removes its registration with the rest.

`@cratylus/forge`'s `HarnessAdapter` gains the required `startsInWorktree`: claude answers yes, emits `isolation: worktree` in the front matter of an agent declaring it and nothing for one that does not, and binds `worktree.create` to `WorktreeCreate`; omp answers no, since its agent definition has no field that isolates an agent and it fires no worktree-creation event, so it emits nothing and projection warns once per declaring agent. Projection also warns, once per moment, of a hook bound to a moment the harness does not fire, and no longer stages the worker of a hook none of whose moments it fires, where it used to stage the file with no registration beside it. A chosen practice's `hooks` are registered with the plumbing.
