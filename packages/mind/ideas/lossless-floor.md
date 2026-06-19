---
kind: principle
delineation: A transformation guarantees losslessness only over a known, declared floor (e.g. the intersection of all targets' capabilities); everything above the floor is lossy by construction and must be surfaced explicitly — substitute, warn, or fail — never dropped silently.
---

# Lossless Floor

Within the floor: byte-faithful. For a many-target translator the floor is the **intersection** of all targets' capabilities.

- Surface each above-floor item in an escalating, user-chosen mode — **substitute** an approximation, **skip with a warning**, or **strict-fail**.
- Make the floor **inspectable** — an `explain` view shows exactly what falls outside it before any destructive step.

## See also

- [[canonical-superset-ir]] — the intersection of targets is the floor under a superset IR.
- [[declare-capability-dont-discover]] — the floor is computed from declared capabilities, not discovered.
- [[densest-faithful-point]] — the same lossless-on-essentials discipline at the compression grain.
- [[golden-master-equivalence-oracle]] — the floor captured as an executable test: source-pinned goldens are the slice a transform must preserve exactly.
