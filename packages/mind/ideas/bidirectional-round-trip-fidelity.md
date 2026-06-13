---
kind: principle
delineation: A translator declares both directions and is held to round-trip as a property-tested fixed point — read(write(read(x))) == read(x); import is a first-class direction, never an afterthought bolted onto a one-way emitter.
---

# Bidirectional Round-Trip Fidelity

A translator between a canonical form and a dialect must declare **both directions** — read (dialect → canonical) _and_ write (canonical → dialect) — as a symmetric contract. Import is not a courtesy added later to a one-way generator; it is co-equal from the first design.

The fidelity is **property-tested as a fixed point**, not asserted: round-tripping a fixture through the pair must reach equilibrium — `read(write(read(x))) == read(x)`. A translator that cannot demonstrate this fixed point is unfaithful, and the failure is mechanically detectable rather than a matter of trust.

This is the operational, multi-direction instance of the corpus's own acceptance test — a source must reconstruct equivalent-or-better from its routed form ([[self-application-is-mandatory]]). Here the "source" is a dialect's config and the "routed form" is the canonical IR.

## See also

- [[canonical-superset-ir]] — the canonical center the round-trip is measured against.
- [[self-application-is-mandatory]] — round-trip-equivalent-or-better as the general acceptance test.
- [[golden-master-equivalence-oracle]] — the one-way case: when the transform has no inverse, a source-pinned golden replaces the round-trip fixed point as the equivalence criterion.
