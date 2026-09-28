---
"cratylus": minor
---

`cratylus design`, `cratylus plan` and `cratylus note`: the design, plans and notebook as computed state

Three new commands reach the runtime's record capabilities. Each shows its whole domain by default and one item when named (`design show [<concept>]`, `plan show [<plan> | <unit> --plan <p>]`, `note show [<title>]`), and writes through its own verbs: `design define | amend | retract | reconcile | trace`, `plan add | advance | retract | revise | bind | close | reconcile`, and `note capture | revise | retract | reconcile`. Every write carries `--author`, `--reason` and `--cause`. The state is computed from immutable records in the repository at the moment it is read, and nothing is cached.

**Breaking.** `cratylus carryOn` is removed along with the runtime capability behind it.
