---
kind: principle
delineation: A translator declares both directions and is held to round-trip as a property-tested fixed point — read(write(read(x))) == read(x); import is a first-class direction, never an afterthought bolted onto a one-way emitter.
---

# Bidirectional Round-Trip Fidelity

The multi-direction instance of the corpus's own acceptance test ([[self-application-is-mandatory]]): the "source" is a dialect's config, the "routed form" is the canonical IR, and equivalent-or-better is the fixed point `read(write(read(x))) == read(x)`. A translator that cannot demonstrate it is unfaithful — mechanically, not by trust.

## See also

- [[canonical-superset-ir]] — the canonical center the round-trip is measured against.
- [[self-application-is-mandatory]] — round-trip-equivalent-or-better as the general acceptance test.
- [[golden-master-equivalence-oracle]] — the one-way case: when the transform has no inverse, a source-pinned golden replaces the round-trip fixed point as the equivalence criterion.
