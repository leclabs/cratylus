---
"@cratylus/runtime": minor
"@cratylus/canon": patch
---

The runtime gains the `design`, `plan` and `note` capabilities: the one way agents and users meet
notes, design and plans

`@cratylus/runtime` ships three capabilities, each named for its domain and speaking its verbs:
`design` shows the lattice or one concept, and defines, amends, retracts, reconciles and traces a
concept; `plan` shows the bound plan or one unit, adds, advances and retracts units, revises a unit or
a plan, binds and closes a plan, and reconciles either, the first `add` naming a new plan proposing
it with its concepts; `note` shows the notebook or one note, and captures, revises, retracts and
reconciles notes. `cratylus <capability> <verb>` routes each ahead of the discovered dispatch, and
their ports (`DesignHost`, `PlanHost`, `NoteHost`) join the `.` barrel, the capability keyspace and
`RuntimePlugin`. Every input names entities by name, and every output is the domain's view. An
identity is printed and accepted only beside a name a merge left held by more than one entity. The
plan lifecycle is read from `configuration.plan` in the host runtime config, and its absence refuses
naming the deploy.

The capabilities compose the domain modules. A unit is pinned on add and re-pinned on revise, with
the design's closure wired into the pin. A unit's readiness reads its plan's liveness and the owed
rulings the notebook recognises, and an owed ruling naming a plan refuses binding it. The repair rule,
by which a write is refused only when it introduces a violation, now has one home in the record store,
and so does the canonical order a set-valued payload field is written in, so the same set written in
two orders on two branches converges. A unit's dependencies and a note's `blocks` now refuse a
member named twice. The view names which head of a diverged item is a retraction and what it
withdrew, names a withdrawn reference's kind (`factor` or `dependency`), counts each shown plan apart
in the header, lists a plan standing on a diverged concept once, and renders a concept's trace.

`@cratylus/canon`'s `RUNTIME_CAPABILITIES` gains `design`, `plan` and `note`.
