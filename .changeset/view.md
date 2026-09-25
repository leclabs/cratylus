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
admits one. Last comes the whole domain, one line for every live item, including one the structure
cannot yet place, which prints with the reason. The view orders the lattice root to primitive from
the factors it is given: the roots are the concepts nothing live factors on, and a concept in or
beneath a factor cycle prints after the lattice, naming the concepts above it. Each concept shows
every plan standing on it with that plan's state. A plan is its whole state (its name, the concepts
it realizes and its lifecycle state), and when a merge leaves more than one plan in the state
admitting one, the view shows each of them with its own units. A plan's units print in wave order
with the frontier marked on their lines, each naming its concept; a unit given no wave prints after
the waves with the deps that hold it. Notes group by kind, then topic, one line per note led by its
title, which is its name; the view never interprets a kind.

Every item and every reference arrives by name. A name is held by every live entity carrying it,
by a withdrawn entity keeping it, and by a diverged entity for every name its heads carry. Where a
merge left a name held by more than one entity, the name arrives with the entity's identity, and the
view prints that identity beside the name everywhere the name prints and never otherwise; the
incoherence line lists each holder with how it holds the name (live, withdrawn or diverged). Naming
an item drills into it in full, or into every version of it when it is diverged, matching a diverged
item by any of its names; a bare shared name drills into each item carrying it, and a withdrawn
holder drills to its last version, marked withdrawn, so no printed identity is a dead end. The
view receives states, kinds, waves, frontier, drift and suspicion already computed, and spells no
lifecycle state or note kind. It is internal: exported through neither the `.` barrel nor a subpath.
