---
kind: concept
delineation: Concentrate all orchestration in one deterministic engine and make the pluggable parts pure, stateless leaves — same input, same output, state lives outside them — so the leaves are trivially testable and a third party can author one against a small contract.
---

# Pure-Leaf Deterministic Engine

The engine owns sequencing, scope-walking, and reconciliation; the leaf is a value-semantics function that hides nothing — the engine pushes state in and takes a result out.

The third-party contract is the tiny declared interface plus the **shared serialization primitives the host provides**. Reusing those primitives is the enforced quality baseline; hand-rolling is the smell.

## See also

- [[declare-capability-dont-discover]] — each leaf declares its capabilities as data the engine reads.
- [[minimalism]] — what lets a complete leaf stay tiny against its declared contract.
