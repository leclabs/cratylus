---
'@cratylus/canon': minor
'cratylus': minor
---

The `gitflow` ruleset holds one rule, `gitflow-adopted`: the project follows gitflow, adopted by its name, its integration branch `develop` unless the project's AGENTS.md names another; a missing integration branch is escalated to the product owner. The rules `gitflow-main-and-develop`, `gitflow-feature-branches`, `gitflow-release-branches` and `gitflow-hotfix-branches` are no longer offered.

`cratylus install` over an installation whose recorded choice names any of them drops them from the choice and names them as no longer offered; on a terminal it asks about `gitflow-adopted` as a newly offered rule. `--rules gitflow` or `--rules gitflow-adopted` takes it.
