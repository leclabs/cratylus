---
'@cratylus/canon': minor
'cratylus': minor
---

The `gitflow` rules integrate into the integration branch: the branch the project's AGENTS.md names as its integration branch, and `develop` where it names none. Where AGENTS.md names none and `develop` does not exist, the rules have the agent escalate to the product owner, who names it, before branching or merging. The feature, release and hotfix rules branch from and merge into the integration branch so named.

The rule `gitflow-main-and-develop` is renamed `gitflow-main-and-integration-branch`. `cratylus install` over an installation whose recorded choice names `gitflow-main-and-develop` drops it from the choice and names it as no longer offered; on a terminal it asks about `gitflow-main-and-integration-branch` as a newly offered rule. `--rules gitflow` takes all four rules as before.
