---
"@cratylus/forge": minor
"@cratylus/schema": minor
---

`cratylus install` installs every agent and skill of the canon, and offers the rulesets, whole or rule by rule. Run with no terminal and naming only the harness, it installs everything and is never refused for want of a choice. A completed install ends with how using cratylus starts where the business analyst is installed.

BREAKING CHANGE: `InstallPrompts` asks for the harness, the scope, the rules, the model roles and the agent status, and nothing else. A plugin, `@cratylus/schema`'s `AgentPlugin` and `@cratylus/forge/project`'s `ProjectablePlugin` alike, is its name, its agents, skills, factors and hooks, its factor manifest and its rulesets (an `AgentPlugin` also its lifecycle events); the projection, the installation record and the deploy record carry agents, skills and rules.
