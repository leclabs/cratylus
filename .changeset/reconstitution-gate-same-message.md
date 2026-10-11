---
'@cratylus/canon': patch
'@cratylus/forge': patch
---

On omp, the readback gate now counts the visible text of the assistant message carrying a call, read when omp finalizes that message and before it dispatches the call. A readback given in the same message as an act therefore opens the gate. A reply that a turn-end guard refused still counts toward no readback. The `descend` refusal now says where to look: the context overviews, the concept journal and the ledger, read through their capabilities. The `bottom-line` guard refuses a report that drops an open question it covers, or that answers a different question in its place and calls the topic settled.
