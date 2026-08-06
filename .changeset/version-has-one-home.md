---
'@cratylus/runtime': patch
'@cratylus/memory': patch
'@cratylus/forge': patch
'@cratylus/invoke': patch
---

Every CLI reports the version its manifest declares.

`0.1.0` shipped with `cratylus-run --version` and `cratylus --version` answering `0.0.0`: the
number was a literal in TypeScript, and `changeset version` rewrites manifests rather than
source, so the two diverged at the first release and would have stayed diverged. Each now
reads its own manifest by package self-reference, and a gate holds the shape.
