---
'@cratylus/canon': patch
---

The `planner` role's contract now states that it sends what the `architect` role reads from it. Its `returns` line named only the plan's name and the names of units ready to start; it now returns the plan's name, `route-names` (the names of units ready to start or waiting on a route, which it reads from each unit's ledger), and, on `close(P)`, `plan-closed(P)`, the report that plan P has closed. The architect role already lists `route-names` and `plan-closed` among its reads, and no role value named their sender. `¬ spec ∨ plan-view` stays: the planner still returns names and nothing behind them.
