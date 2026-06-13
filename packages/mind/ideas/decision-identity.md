---
kind: concept
delineation: The acceptance test for a projection's fidelity — a reader of a given type reaches the same load-bearing verdict from the projection as from the source; identity of the decision, not of the wording, is what must be preserved across the round-trip.
---

# Decision Identity

A projection is faithful when a reader **decides the same thing** from it as from the source. Not word-identity, nor even full meaning-identity — **verdict-identity**: the load-bearing decision the reader must make comes out the same whether they read the dense projection or the full source. This is the operational, testable form of the round-trip law ([[bidirectional-round-trip-fidelity]]) stated in the reader's terms — what "semantic equivalence over the [[lossless-floor]]" cashes out to when the consumer is an agent making a call.

It is the acceptance criterion for [[reader-prior-projection]]: dropping a delineation is safe exactly when the reader's verdict is unchanged. Tested by giving two readers the same task — one the dense projection, one the full source — and checking they act identically. The test is only as strong as its blinding and its sample size: an unblinded, small-n, self-graded pass is an encouraging signal, never a proof.
