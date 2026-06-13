---
kind: principle
delineation: A coordinated decision belongs at the one layer that needs the joined-up outcome and can see all the inputs — resolve it once there, hand consumers a read-only result; pushing it down to a layer that can only see its own slice forfeits coordination.
---

# Decision at the Locus of Need

When a decision must come out **consistent across many consumers**, it belongs at the **single layer that needs the joined-up outcome and can see every input it depends on** — resolve it **once** there, then hand each consumer a small, read-only result it merely reads. Scattering the decision down into the consumers, where each sees only its own slice, produces timing gaps, inconsistent first renders, and no way to coordinate sibling decisions.

This is Saltzer's end-to-end principle as a context-engineering rule: the place that can correctly make a choice is the place that holds the whole context for it, not a downstream layer the choice happened to pass through. Two diagnostics:

- **Resolve-once, read-many.** Co-load the inputs at the deciding layer, evaluate the decision once (with an explicit, ordered decision sequence), and emit a small declarative bag of results. Independent inputs can then evolve on their own timelines yet compose deterministically.
- **Reject the convenient-but-wrong carrier.** Routing a decision through a layer that merely transits the data — a hydration payload, a navigation component, a scheduler — because it is _reachable_ is a smell: that layer was designed for another purpose, cannot see the sibling inputs, and so cannot coordinate. The mismatch surfaces as async indirection and uncoordinated outcomes.

The companion failure is the opposite altitude: a decision hoisted above the layer that actually needs it, forcing every consumer to re-derive it — or context hoisted above the narrow scope that uses it ([[context-at-the-load-bearing-depth]]).

## See also

- [[intent-not-flag-branches]] — having resolved once, expose the result as a named intent, not as per-consumer flag branches.
- [[pure-leaf-deterministic-engine]] — concentrate the decision in the engine; leaves read the result.
- [[shard-by-orthogonal-concern]] — the orthogonal grain: who owns which surface, vs. which layer owns a decision.
