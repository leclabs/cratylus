---
'@cratylus/forge': patch
---

omp: the generated guard module judges nothing in a subagent session. A persona's guards bind its main session only; omp hands a spawned subagent its parent's extensions, and the module now returns before asking the judge, or printing any notice, when `ctx.agent.kind` is not `main`.
