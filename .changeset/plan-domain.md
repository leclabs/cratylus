---
"@cratylus/runtime": minor
---

The runtime gains the plan as an entity over the record store

A plan's records hold its name, the concepts it realizes and its lifecycle state. Propose writes
its first version; bind and close supersede it, moving it forward along its lifecycle, and a closed
plan stays readable in the fold. One live plan carries each name: propose and reconcile refuse a
name another live plan carries. Binding a plan returns whichever plan was bound to the first state,
so at most one plan is bound. A merge can still leave two bound plans, or two live plans under one
name; each incoherence is reported, and binding the one to keep resolves the first. An owed ruling
naming a plan blocks binding it. A plan diverged by concurrent writes refuses bind and close and is
settled by reconcile, one version superseding every head. The lifecycle's states are received as a
parameter (the states in order, the one at most one plan holds, the final one), never spelled in
the runtime. The module is internal and not yet exported.
