---
"@cratylus/forge": minor
"@cratylus/schema": minor
---

`cratylus install` offers no practices choice: it installs every agent and skill of the canon, and the rulesets stay offered as before. Run with no terminal and naming only the harness, it installs everything and is never refused for want of a choice. A completed install ends with how using cratylus starts where the business analyst is installed. An earlier installation's recorded practices are not read.

BREAKING CHANGE: `install` loses `--practices` and `--all`, and `InstallPrompts` its `practices` question. `@cratylus/forge/project` loses `ProjectOpts.practices`, `ProjectedTree.practices`, `OfferedPractice` and the practice closure checks, and `ProjectablePlugin` its `practices` and `plumbing`; the installation record and the deploy record no longer carry `practices`. `@cratylus/schema` loses `Practice`, `Plumbing`, `AgentPlugin.practices` and `AgentPlugin.plumbing`.
