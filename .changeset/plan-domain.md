---
"@cratylus/runtime": minor
---

The runtime gains the plan as an entity over the record store

A plan's records hold its name, the set of concepts it realizes and its lifecycle state. Propose
writes its first version; revise, bind and close supersede every head of it. Revise may change its
name or its concepts, never its state; bind and close move it forward along its lifecycle. The
final state is final: a closed plan is never revised, keeps its name, and stays readable in the
fold, and a diverged plan with a closed head reconciles to closed only. A plan's concepts form a
set, and a duplicate is refused.

Two laws bind plans together: one live plan per name, and at most one plan bound — binding a plan
returns whichever plan was bound to the first state. A merge can still break either; each such
incoherence is reported. Every write passes one gate, which refuses it only when it introduces a
violation — one whose plans were not already bound together in a standing violation of the same
law — so a write that shrinks a violation or leaves it standing is allowed, and every incoherence
can be repaired one write at a time. An owed ruling naming a plan blocks binding it. A plan whose
heads carry more than one payload has diverged: it refuses revise, bind and close and is settled by
reconcile, one version superseding every head; heads carrying one payload have converged, and the
next write names them all. The lifecycle's states are received as a parameter (the states in order,
the one at most one plan holds, the final one), never spelled in the runtime. The module is
internal and not yet exported.
