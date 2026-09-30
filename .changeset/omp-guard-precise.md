---
'@cratylus/forge': patch
---

On omp a guard now judges a call only when the context says it is the main session. A subagent is judged by nothing and says nothing, as before; a context that carries no `agent` used to be judged against the persona's contract whichever session it came from, and is now judged by nothing, with one line to the operator naming the guard and saying it could not tell which session is running, so the call was not judged. The judge is sent the worker's payload alone as the user message, with no transcript label and no instruction line, because a purview payload is a contract and an act and not a transcript; the rubric carries the output format.
