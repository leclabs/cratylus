---
'cratylus': patch
'@cratylus/forge': patch
---

Every claim that cratylus reaches a harness beyond Claude Code and omp is removed, and the two it supports are described as they are.

`cratylus` describes itself as projecting onto Claude Code and omp, not "any harness", and its README states the differences a user meets: 19 of the 31 canonical events have a native peer on Claude Code and 9 on omp, `eventTap` works on Claude Code only, and the persona badge, the launcher and `modelRoles` routing are omp's.

`@cratylus/forge` documents `--harness claude|omp` on `deploy` as well as `project`, drops the `@iarna/toml` dependency whose only consumer was the removed codex adapter, and no longer calls omp "the third harness" or claims Cursor reads its neutral root.
