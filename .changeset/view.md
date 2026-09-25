---
"@cratylus/runtime": minor
---

The runtime gains the view: each domain's current state rendered for its reader in three layers

`@cratylus/runtime` renders the design, a plan and the notebook, each through one function
(`designView`, `planView`, `notebookView`). The first line names the commit the state was computed
at, with counts. Then comes everything to resolve before the rest is trusted: divergence and
incoherence in every domain, drifted and suspect units and owed rulings in a plan, owed rulings and
open questions in the notebook. Last comes the whole domain, one line per live item. The lattice
runs root to primitive in the order given, and each concept names the units realizing it. A plan's
units print in wave order with the frontier marked on their lines, and each names its concept. Notes
group by kind, then topic. Given one item's identity, a view prints that item in full in place of
the body. The view declares the shapes it renders and receives states, kinds, waves, frontier, drift
and suspicion already computed. It spells no lifecycle state or note kind, and it never prints an
entity identity. It is internal: exported through neither the `.` barrel nor a subpath.
