---
"@cratylus/runtime": minor
---

The runtime gains the design domain: the concept lattice computed from the design records

`@cratylus/runtime` holds each concept as an entity of the record store's `design` domain, whose
payload is its anchor, gloss and factors, with factors stored by entity so that relabelling an
anchor never breaks a reference. Concepts are named by anchor at the domain's boundary, and no
caller ever names a record. The domain defines a concept, amends it (a new version of the same
concept over its one current head, which reinstates a withdrawn concept), retracts it, and
reconciles a diverged concept over every head. Amending or retracting a diverged concept refuses
and names reconciliation.

Every write keeps the design's laws on the current branch, so incoherence arises only from merges.
A write refuses an empty anchor, gloss or reason, a factor cycle (a self-factor included), a factor
naming a withdrawn concept, and an anchor another concept carries (a withdrawn concept keeps its
anchor). A retraction refuses while another concept factors on the concept. The domain's reads
compute, at the moment of the read, every live concept, divergence, and incoherence: a factor on a
withdrawn concept, a factor cycle, or one anchor on several live concepts. When a merge leaves one
anchor on several concepts, each is named `<anchor> #<n>` in definition order, so the architect can
relabel or retract one of them. The reads also answer the `design` skill's `closure` and `blast`,
and give a concept's history with reasons. The module is internal: the `design` capability composes
it.
