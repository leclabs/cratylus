---
"@cratylus/runtime": minor
---

The runtime gains the design domain: the concept lattice computed from the design records

`@cratylus/runtime` holds each concept as an entity of the record store's `design` domain, whose
payload is its anchor, gloss and factors, with factors stored by entity so that relabelling an
anchor never breaks a reference. Concepts are named by anchor at the domain's boundary, and no
caller ever names a record. An anchor is held by the live concept carrying it, by a withdrawn
concept that keeps it, and by a diverged concept for every anchor its heads carry. Where a merge
leaves an anchor held by more than one concept, each holder's identity is shown and accepted beside
the anchor, as a separate field no anchor can ever spell, and only there. The domain defines a
concept, amends it (a new version of the same concept over every current head, which reinstates a
withdrawn concept), retracts it, and reconciles a diverged concept over every head. Amending or
retracting a diverged concept refuses and names reconciliation. Heads that carry the same payload
have converged and read as one.

A write refuses an empty anchor, gloss or reason, a factor named twice, and a factor it newly adds
on a diverged concept (reconcile that concept first). It also refuses to introduce a violation of
the design's relational laws: an anchor held by two concepts, a factor cycle, or a factor on a
withdrawn concept, which covers retracting a concept others factor on. A violation counts as
introduced when its concepts were not already bound together in a standing violation of the same
law. A write that shrinks a violation or leaves it standing is allowed, so a merge's incoherence
can be repaired one write at a time. The domain's reads compute, at the moment of the read, every
live concept, divergence, and incoherence. They also answer the `design` skill's `closure` and
`blast`, and give a concept's history with reasons. The module is internal: the `design`
capability composes it.
