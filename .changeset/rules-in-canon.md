---
"@cratylus/canon": minor
"@cratylus/forge": minor
"@cratylus/schema": minor
---

cratylus ships rulesets: standard working conventions, each rule stating its convention and why it holds, placed where omp applies them in every session of every project.

- Schema replaces the `RuleCell` source-cell shape with `Rule` (name, description, convention, why) and `Ruleset` (one convention's rules under its own name); an `AgentPlugin` offers `rulesets`.
- Canon offers five rulesets: `gitflow`, `conventional-commits`, `commit-discipline`, `established-libraries` and `green-field`, exported as `RULESETS`.
- Forge projection takes `rules` (rule names, default none) and renders each chosen rule to `rules/<name>.md` with `alwaysApply: true` front-matter; the owned root places them there, where omp loads a plugin's rules. The projected tree reports the declared `rulesets` for an install to offer. A name that is no declared rule, or a rule name two rulesets share, is refused.
