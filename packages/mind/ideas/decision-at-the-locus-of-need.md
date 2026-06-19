---
kind: principle
delineation: A coordinated decision belongs at the one layer that needs the joined-up outcome and can see all the inputs — resolve it once there, hand consumers a read-only result; pushing it down to a layer that can only see its own slice forfeits coordination.
---

# Decision at the Locus of Need

Saltzer's end-to-end principle as a context-engineering rule. Two diagnostics:

- **Resolve-once, read-many.** Co-load the inputs at the deciding layer, evaluate the decision once (with an explicit, ordered decision sequence), and emit a small declarative bag of results — independent inputs then evolve on their own timelines yet compose deterministically.
- **Reject the convenient-but-wrong carrier.** Routing a decision through a layer that merely transits the data — a hydration payload, a navigation component, a scheduler — because it is _reachable_ is a smell; it cannot see the sibling inputs, and the mismatch surfaces as async indirection and uncoordinated outcomes.

Companion failure: the opposite altitude — a decision hoisted above the layer that needs it, forcing every consumer to re-derive it ([[context-at-the-load-bearing-depth]]).

## See also

- [[intent-not-flag-branches]] — having resolved once, expose the result as a named intent, not as per-consumer flag branches.
- [[pure-leaf-deterministic-engine]] — concentrate the decision in the engine; leaves read the result.
- [[shard-by-orthogonal-concern]] — the orthogonal grain: who owns which surface, vs. which layer owns a decision.
