---
"@cratylus/runtime": minor
---

The runtime gains the plan as an entity over the record store

A plan's records hold its name, the concepts of the piece it realizes and its lifecycle state.
Propose writes its first version; bind and close supersede it, moving it forward along its
lifecycle and never backwards, and a closed plan stays readable in the fold. At most one plan is
bound: `bind` refuses while another plan holds that state, while a plan an owed ruling names is the
one to bind, and while more than one plan holds it — the state a merge of two branches that each
bound a different plan leaves, which the domain reports and never resolves by picking one. The
lifecycle's states are received as a parameter (the states in order, the one at most one plan
holds, the final one), never spelled in the runtime. The module is internal and not yet exported.
