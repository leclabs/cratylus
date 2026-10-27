---
'@cratylus/schema': minor
'@cratylus/canon': minor
'@cratylus/forge': minor
'cratylus': minor
---

`cratylus install` always places the `behaviour-driven-development` ruleset with the agents, at either scope, whatever `--rules` says, a recorded choice included. It holds one rule, `behaviour-driven-development-examples`: each example lives in its concept's record in `design/model/`, and its acceptance test is titled `<context>/<concept>: <example name>`. It is never offered, never asked, and not recorded among the rules chosen; naming it in `--rules` is refused like any name that is no offered rule. The summary lists it among the rules placed.

`Rule.convention` is renamed `Rule.statement`. `AgentPlugin` gains `practiceRulesets`, the rulesets installed with the plugin's agents and never offered; canon exports them as `PRACTICE_RULESETS` beside `RULESETS`. Projection renders every rule of the plugin set's practice rulesets on every render and reports their names as `ProjectedTree.practiceRules`; `ProjectOpts.rules` names only offered rules, and a rule name shared by any two rulesets, practice or offered, is refused.
