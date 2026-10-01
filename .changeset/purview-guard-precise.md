---
'@cratylus/canon': patch
---

The purview guard now keeps a refusal: a call it denied is judged again however often it is retried, and a BLOCK on the retry denies it, where before the identical second call went through unjudged under a re-entry cap. The judge is handed only what its one decision needs: a rubric of a few sentences (under 2 KB, from about 6.6 KB) that says what an act produces and lets it pass only when the contract's `writes` lists it or `reserves` names it, and an act line that names only the act and its target (`DISPATCH to <recipient>`, `WRITE to <path>`). The rubric asks for an `EVIDENCE:` line, the one the shared judge backend keeps, and the worker checks that line, so a fabricated block is discarded on Claude Code too.
