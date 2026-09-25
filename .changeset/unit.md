---
"@cratylus/runtime": minor
---

The runtime gains the unit: one unit of work in a plan, as records in the `unit` domain

A unit's payload is its plan, its full spec (name, the concept it realizes, intent, static inputs,
deps, outputs, acceptance criteria), its lifecycle state and its pin. Add writes its first version
in the lifecycle's first state, revise supersedes its spec and pin, and advance moves it exactly one
step along its lifecycle and refuses any other move. Readiness is computed at the read and never
written into a record: a unit is ready when it has not started, every dep is in the state that
satisfies a dependency, and no owed ruling names it or its plan. The frontier (ready and in-flight
units) and the waves are computed the same way. A dep on a withdrawn unit, a dep cycle, a unit of a
withdrawn plan and a unit realizing a withdrawn concept each read as incoherence. The unit lifecycle
vocabulary, plan and concept liveness and the entities owed rulings name are received as
parameters; the runtime spells no lifecycle state. The module is internal until the `plan`
capability composes it.
