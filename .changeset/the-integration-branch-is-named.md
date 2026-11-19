---
'@cratylus/canon': minor
'cratylus': minor
---

The `gitflow` rules integrate into the integration branch: the branch the project's AGENTS.md names as its integration branch, or `develop` where it names none. Where that branch does not exist, the rules have the agent escalate to the product owner, who names it, before branching or merging. Each of the four rules says so, since each can be taken on its own. Feature and release branches branch from the integration branch and merge back into it; hotfix branches branch from a release tag on `main` and merge into `main` and into the integration branch, or into the current release branch where one exists.

The rule `gitflow-main-and-develop` is renamed `gitflow-main-and-integration-branch`. `cratylus install` over an installation whose recorded choice names `gitflow-main-and-develop` drops it from the choice and names it as no longer offered; on a terminal it asks about `gitflow-main-and-integration-branch` as a newly offered rule. `--rules gitflow` takes all four rules as before.
