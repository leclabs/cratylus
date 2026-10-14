---
'@cratylus/canon': patch
'@cratylus/forge': patch
---

Reconstitution reads the delivered workflow overview alongside each touched context's overview (decision 0207).

The `reconstitution` procedure now reads the overview of each context it touches and the delivered workflow overview first, then the detail it needs from the concept journal and the ledger, then reads the current design, open decisions and cuts in flight back before acting. The omp session-start note says the same: it names the delivered workflow (`cratylus:workflow`, or the project's own workflow context where its journal holds it) as the practice to read whole, never only recalled from tool descriptions or memory.
