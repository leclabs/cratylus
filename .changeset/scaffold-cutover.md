---
"@cratylus/forge": minor
"@cratylus/canon": minor
---

The project scaffold no longer lays down a `plans/` tree

A plan is an entity whose lifecycle (proposed, bound, closed) is recorded in and read
from the `plan` domain, so there is no folder layout to scaffold. `scaffoldProject`
now writes only the projected culture and `AGENTS.md`; it no longer creates
`<target>/plans/founding/{PLAN.md, pending, ready, active, completed}`.

Breaking for `@cratylus/forge`: `ProjectTemplate` loses `planMd` and `planStates`
and carries only `agentsMd`, and `ScaffoldProjectResult` loses `planDir`. A corpus
that supplied its own template drops those two fields.

In `@cratylus/canon`, the project template no longer imports the plan-state set, and
the Work-tracking section of the scaffolded `AGENTS.md` says work is planned with the
`plan` skill instead of describing a stored layout. The default template in
`@cratylus/forge` names no skill: its Work-tracking section is gone, since the engine
carries no corpus doctrine.
