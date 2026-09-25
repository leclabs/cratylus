---
"@cratylus/runtime": minor
---

The runtime gains the design domain: the concept lattice computed from the design records

`@cratylus/runtime` holds each concept as an entity of the record store's `design` domain, whose
payload is its anchor, gloss and factors, with factors stored by entity so that relabelling an
anchor never breaks a reference. Anchors resolve to entities and back at the domain's boundary, and
no caller ever names a record. The domain defines a concept, amends it (a new version of the same
concept over its one current head, which reinstates a withdrawn concept), retracts it, and
reconciles a diverged concept over every head. Amending or retracting a diverged concept refuses
and names reconciliation. Its reads compute, at the moment of the read, every live concept,
divergence, and the incoherence of a factor pointing at a withdrawn concept or a factor cycle. They
also answer the `design` skill's `closure` and `blast` and give a concept's history with reasons.
The module is internal: the `design` capability composes it.
