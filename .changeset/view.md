---
"@cratylus/runtime": minor
---

The runtime gains the view: each domain's current state rendered for its reader in three layers

`@cratylus/runtime` renders the design, a plan and the notebook, each through one function
(`designView`, `planView`, `notebookView`). The first line names the commit the state was computed
at, with counts. Then comes everything to resolve before the rest is trusted: divergence and
incoherence in every domain, drifted and suspect units and owed rulings in a plan, owed rulings in
the notebook. Incoherence has four kinds, each naming what it involves: a reference to a withdrawn
entity, a cycle, one name on two or more live entities, and more than one plan in the state that
admits one. A name shared by several live entities prints with each entity's identity beside it,
which is the one place an identity prints. Last comes the whole domain, one line for every live
item, including one the structure cannot yet place, which prints with the reason. The view orders
the lattice root to primitive from the factors it is given: the roots are the concepts nothing live
factors on, and a concept in or beneath a factor cycle prints after the lattice, naming the concepts
above it. Each concept shows every plan standing on it with that plan's state. A plan is its whole
state (its name, the concepts it realizes and its lifecycle state), and when a merge leaves more
than one plan in the state admitting one, the view shows each of them with its own units. A plan's
units print in wave order with the frontier marked on their lines, each naming its concept; a unit
given no wave prints after the waves with the deps that hold it. Notes group by kind, then topic,
and the view never interprets a kind. Given one item's entity, a view prints that item in full in
place of the body, or every version of it in full when it is diverged. The view receives states,
kinds, waves, frontier, drift and suspicion already computed, and spells no lifecycle state or note
kind. It is internal: exported through neither the `.` barrel nor a subpath.
