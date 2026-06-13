---
kind: principle
delineation: Separate concerns into independent strands — interior modules stay pure and stateless (testable with `assert(fn(input)===expected)`); integration happens only at named composition hubs. Makes whole bug classes uninstantiable, not merely rarer.
---

# Unbraided Code

Separate concerns into **independent strands**; the interior stays pure, integration happens at the edge. The name is [[hickey]]'s "decomplected" — a label for functional-core/imperative-shell (Bernhardt) and ports-and-adapters (Cockburn), chosen because the braid metaphor cues both separation (the strands) and integration (the braid points).

- **Independent strands** — each concern in its own module; modules don't import each other's internals.
- **Pure interior** — stateless, side-effect-free: inputs → outputs.
- **Composition at the edge** — strands braid only at named [[composition-hub]] boundaries.

**The one-line test:** a module is unbraided iff `assert(fn(input) === expected)` tests it. If you can't — because it reaches a registry, fetches the network, reads ambient state — it is braided, however clean it looks.

Unbraiding makes whole bug classes **uninstantiable**: races on shared state (none exists), wrong-environment bugs (interior never reads env), mocking complexity (nothing to mock), effect-ordering bugs (no effects). The cost of braiding is paid in categories of failure, not occasional defects.

Read [[unbraided-code]] and [[composition-hub]] as one teaching split across two cells: interior purity is meaningful only if a hub absorbs the impurity.

## See also

- [[composition-hub]] — the boundary where strands braid.
- [[hickey]] — "unbraided" is his "decomplect"; the origin prior.
