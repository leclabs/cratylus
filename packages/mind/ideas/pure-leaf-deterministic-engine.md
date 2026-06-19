---
kind: concept
delineation: Concentrate all orchestration in one deterministic engine and make the pluggable parts pure, stateless leaves — same input, same output, state lives outside them — so the leaves are trivially testable and a third party can author one against a small contract.
---

# Pure-Leaf Deterministic Engine

Split a pluggable system into a **deterministic engine** that orchestrates and **pure, stateless leaves** that do the typed work. The engine owns sequencing, scope-walking, and reconciliation; each leaf is a value-semantics function — **same input, same output**, no internal state — with all durable state living **outside** it (on disk, in the canonical form). The engine pushes state in and takes a result out; the leaf never hides any.

Why this split earns its keep:

- **Leaves are trivially testable** — a pure function over fixtures, no setup, no teardown, golden-file and property tests fall out directly.
- **The contract is small, so it fans out** — a third party can author a conforming leaf against a tiny declared interface plus **shared serialization primitives** the host provides (rather than hand-rolling and diverging). Reusing the shared primitives is the enforced quality baseline; hand-rolling is the smell.

## See also

- [[declare-capability-dont-discover]] — each leaf declares its capabilities as data the engine reads.
- [[minimalism]] — the leaf contract is the smallest interface that does the one job, which is what lets a complete leaf stay tiny.
