---
"@cratylus/runtime": minor
---

The runtime gains the unit: one unit of work in a plan, as records in the `unit` domain

A unit's payload is its plan, its full spec (name, intent, static inputs, deps, outputs, acceptance
criteria), its lifecycle state and its pin. The concept a unit realizes is the one its pin names,
held once, so the two can never disagree. Add writes its first version in the lifecycle's first
state, revise supersedes its spec and pin, advance moves it exactly one step forward and refuses any
other move, retract withdraws it, and reconcile writes one version over every head of a diverged
unit. An ordinary write on a diverged unit refuses and points to reconcile; a unit whose heads
converged on one payload reads settled, and a write names every head.

The unit laws: one live unit per name within its plan, dependencies acyclic and naming live units
of the same plan, and a plan that is not withdrawn. A write is refused when it would introduce a
violation the fold did not already hold, so incoherence, like divergence, arises only from merges,
and the owner keeps working while one stands. Incoherence is reported: a dep on a withdrawn unit, a
unit of a withdrawn plan, a dep cycle, one name on two live units of a plan. A withdrawn concept is
not incoherence; it drifts the pins naming it.

Readiness is computed at the read and never written into a record: a unit is ready when it has not
started, every dep has reached the state that satisfies a dependency or moved past it, and no owed
ruling names it or its plan. The frontier (ready and in-flight units) and the waves are computed the
same way. The unit lifecycle vocabulary, plan liveness and the entities owed rulings name are
received as parameters; the runtime spells no lifecycle state.
