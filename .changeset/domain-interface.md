---
"@cratylus/runtime": minor
"@cratylus/canon": patch
---

The runtime gains the `design`, `plan` and `note` capabilities: the one way agents and users meet
notes, design and plans

`@cratylus/runtime` ships three capabilities, each named for its domain and speaking its verbs:
`design` shows the lattice or one concept, and defines, amends, retracts, reconciles and traces a
concept; `plan` shows the bound plan, any plan named, or one unit, adds, advances and retracts
units, revises a unit or a plan, binds and closes a plan, and reconciles either, the first `add`
naming a new plan proposing it with its concepts; `note` shows the notebook or one note, and
captures, revises, retracts and reconciles notes. `cratylus <capability> <verb>` routes each ahead
of the discovered dispatch, and their ports (`DesignHost`, `PlanHost`, `NoteHost`) join the `.`
barrel, the capability keyspace and `RuntimePlugin`. Every input names entities by name, and every
output is the domain's view. An identity is printed and accepted only beside a name a merge left
held by more than one entity, and the form printed is the form accepted; which holder a name
addresses is decided in one place, the record store's `names.ts`, for all three domains. Refusals
speak only the domains' words. A write is all or nothing: its writes are staged (`StagedStore`),
checked and rendered before any reaches disk. The plan lifecycle is read from `configuration.plan`
in the host runtime config; `plan` refuses without it, naming the deploy, while `design show` still
shows the lattice and says the plans standing on it wait for a deploy. Every view's header says when
it includes uncommitted writes.

The capabilities compose the domain modules. A unit is pinned on add, with the design's closure
wired into the pin, and re-pinned only by a revise or reconcile that says `--repin` with a reason,
so editing a spec never clears a drift. A unit realizes one of its plan's concepts, and a merge that
breaks this is listed as incoherence. A closed plan and its units are never written again and show
no frontier; a diverged plan takes no new unit. A unit is ready, or on the frontier, only while
every dependency is done and live and no owed ruling names it or its plan; an owed ruling naming a
plan refuses binding it. `plan show <plan>` shows any plan whole, with its units. The repair rule,
by which a write is refused only when it introduces a violation, now has one home in the record
store, and so does the canonical order a set-valued payload field is written in, so the same set
written in two orders on two branches converges. A unit's dependencies and a note's `blocks` now
refuse a member named twice. The view gives a diverged concept, unit or note a line in its place in
the whole view, marked; names which head of a diverged item is a retraction and what it withdrew;
names a withdrawn reference's kind (`factor` or `dependency`); counts each shown plan apart in the
header; lists a plan standing on a diverged concept once; and renders a concept's trace.

Every name a view prints addresses one entity: where no plan is in view a unit is printed with its
plan, `u of plan p`, and that form is accepted wherever a unit is named, so a note blocks a unit by
it (the note capability's `--plan` flag is gone). What must be resolved first names each item's
cause and what moved (`drifted: v — same diverged since pinned`, `suspect: u — beneath leaf, base
amended since pinned`), lists a plan view's own items only, and never asks of a closed plan's frozen
units. A unit realizing a concept its plan does not is an incoherence a merge can leave and the
repair rule repairs. A diverged plan reads as diverged wherever it is named, a diverged unit is
joined in the design's cross-reference, and each diverged version shows who wrote it and when, drawn
in full where summaries would print alike. When the store itself fails the capability says so
plainly — the directory is outside a repository, or a stored entry is damaged, naming its path to
restore.

`@cratylus/canon`'s `RUNTIME_CAPABILITIES` gains `design`, `plan` and `note`.
