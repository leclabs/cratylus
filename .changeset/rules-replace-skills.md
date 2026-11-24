---
"@cratylus/canon": minor
"@cratylus/schema": minor
"@cratylus/forge": minor
"@cratylus/runtime": minor
"cratylus": minor
---

BREAKING: cratylus installs agents, rules and capabilities, and no skills. The seven skills (conceptualize, elicit, exemplify, formalize, materialize, probe and signify) are removed from the canon, the schema's `Skill`, `SkillExpression`, `SkillDeploy` and `CapabilityName`, forge's projection, and the runtime's skill-sourced capability configuration (`runtime.json`, `loadRuntimeConfig`). The principle and its moment are stated in the Cratylic context design rule, and each method is invoked by the name the agent profiles already give it.

Install removes each skill an earlier installation placed, from the root it replaces and from the earlier deploy record, and names it as no longer installed: `skills: removed <name>, … , no longer installed` in its report.

The Cratylic context design rule states its scope, every text an agent reads: a project's context file, an agent's profile, a rule, a dispatch's context and a concept record among them. The command's purpose reads "with its rules and capabilities".
