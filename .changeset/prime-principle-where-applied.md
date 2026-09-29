---
'@cratylus/schema': minor
'@cratylus/forge': minor
'@cratylus/canon': minor
---

The prime principle is carried only by the cells whose laws apply it, no longer stamped on every projected cell.

`AgentPlugin.preamble` is removed from `@cratylus/schema`, along with `ProjectOpts.preamble` and the plugin-wide stamping in `@cratylus/forge` (agent and skill projection, `resolveSkills`). A plugin that set `preamble:` must move the block onto the cells that need it. `Skill` gains an optional `preamble`, the same shape `Agent.preamble` already had, and projection emits it as the first section of that skill's SKILL.md.

`@cratylus/canon` drops `preamble` from its plugin and sets `foundingDoctrine` on the ten skills that name concepts by anchor, optimal sign or cold decode: `create-skill`, `deliver`, `design`, `exemplify`, `formalize`, `introspect`, `materialize`, `plan`, `probe` and `signify`. The other six skills carry no `## Prime Principle`, and no agent does: each agent already carries cratylism once through its held role's engineering-principles, where it previously carried it twice. The stance-guardrail operator-slot filter now recognizes a skill body by its verb H1 over the fenced formal block instead of by `## Prime Principle`.
