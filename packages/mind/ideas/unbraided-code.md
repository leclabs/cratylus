---
kind: principle
delineation: Separate concerns into independent strands — interior modules stay pure and stateless (testable with `assert(fn(input)===expected)`); integration happens only at named composition hubs. Makes whole bug classes uninstantiable, not merely rarer.
---

# Unbraided Code

The name is [[hickey]]'s "decomplected" — a label for functional-core/imperative-shell (Bernhardt) and ports-and-adapters (Cockburn), chosen because the braid metaphor cues both the separation (the strands) and the integration (the braid points at the [[composition-hub]]).

A module that can't be tested by `assert(fn(input) === expected)` — because it reaches a registry, fetches the network, reads ambient state — is braided, however clean it looks.

The bug classes made uninstantiable: races on shared state (none exists), wrong-environment bugs (interior never reads env), mocking complexity (nothing to mock), effect-ordering bugs (no effects).

Read [[unbraided-code]] and [[composition-hub]] as one teaching split across two cells: interior purity is meaningful only if a hub absorbs the impurity.

## See also

- [[composition-hub]] — the boundary where strands braid.
- [[hickey]] — "unbraided" is his "decomplect"; the origin prior.
