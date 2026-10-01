---
'@cratylus/schema': minor
'@cratylus/canon': patch
'@cratylus/forge': patch
'cratylus': patch
---

The implementer now starts in a git worktree of its own, where its session used to begin in the operator's main checkout. `@cratylus/schema`'s `Agent` gains the optional `isolation?: 'worktree'`, carried on the identity face beside `holds` and `dispatches`. `@cratylus/canon`'s `RoleCell` may state it, `holds` copies it to every holder of the role (a persona cannot state it), and only the implementer role does. `@cratylus/forge`'s `HarnessAdapter` gains the required `startsInWorktree`: claude answers yes and emits `isolation: worktree` in the front matter of an agent declaring it, and nothing for one that does not; omp answers no, since its agent definition has no field that isolates an agent, so it emits nothing and projection warns once per declaring agent, as it does for skills a harness cannot preload.
