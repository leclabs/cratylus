---
kind: concept
delineation: The acceptance test for a projection's fidelity — a reader of a given type reaches the same load-bearing verdict from the projection as from the source; identity of the decision, not of the wording, is what must be preserved across the round-trip.
---

# Decision Identity

The operational, testable form of [[bidirectional-round-trip-fidelity]] in the reader's terms — what "semantic equivalence over the [[lossless-floor]]" cashes out to when the consumer is an agent making a call. Not word- nor full-meaning-identity: verdict-identity.

The acceptance criterion for [[reader-prior-projection]]: dropping a delineation is safe exactly when the reader's verdict is unchanged. Tested by giving two readers the same task — one the dense projection, one the full source — and checking they act identically. The test is only as strong as its blinding and sample size: an unblinded, small-n, self-graded pass is an encouraging signal, never a proof.
