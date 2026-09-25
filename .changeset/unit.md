---
"@cratylus/runtime": minor
---

The runtime gains the unit: one unit of work in a plan, as records in the `unit` domain

A unit's payload is its plan, its full spec (name, intent, static inputs, deps, outputs, acceptance
criteria), its lifecycle state and its pin. The concept a unit realizes is the one its pin names,
held once, so the two can never disagree. Add writes its first version in the lifecycle's first
state, revise supersedes its spec and pin, advance moves it exactly one step along its lifecycle
and refuses any other move, and reconcile writes one version over every head of a diverged unit;
revise and advance on a diverged unit refuse and point to reconcile.

Every write keeps the unit's laws on the current branch: a write whose dependencies would close a
cycle, name a unit that is not live or belongs to another plan, or whose plan is withdrawn is
refused. Incoherence, like divergence, then arises only from merges, and is reported: a dep on a
withdrawn unit, a dep cycle, a unit of a withdrawn plan, a unit realizing a withdrawn concept.

Readiness is computed at the read and never written into a record: a unit is ready when it has not
started, every dep has reached the state that satisfies a dependency or moved past it, and no owed
ruling names it or its plan. The frontier (ready and in-flight units) and the waves are computed the
same way. The unit lifecycle vocabulary, plan and concept liveness and the entities owed rulings
name are received as parameters; the runtime spells no lifecycle state. The module is internal
until the `plan` capability composes it.
