---
"@cratylus/forge": patch
"cratylus": patch
---

A rule's why is rendered on its rule's line, `<statement> Why: <why>`, so that in the system prompt, where omp concatenates the rule files one newline apart, each why reads as part of its own rule and never as part of the next.
