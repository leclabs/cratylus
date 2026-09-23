---
'@cratylus/schema': minor
'@cratylus/forge': minor
'@cratylus/canon': minor
---

An agent declares the skills it operates through

`autoloadSkills` was a reader with nothing to read. OMP honours the field natively for a spawned
subagent, and the generic `omp-agent` launcher already rendered it as required reading for a main
session — the consuming half existed on **both** paths. The producing half did not, because the
corpus had nowhere to declare it. The branch was live code with zero live inputs: every deployed
definition carried exactly `name` and `description`.

`Agent.skills` is an optional list of skill NAMES, modelled on the existing optional `preamble`.

It is deliberately **not a dimension**, for two independent reasons. Structurally, a dimension's
value is a branded σ\* fragment `agentBody` emits into the Target, while a skill name is an
address a host resolves — declaring it as a dimension would mint one empty fragment per skill.
Conceptually, a dimension is a persona trait, and which skills an agent loads is apparatus; the
catalog would misrepresent it and hand every agent one more required `null` to spell.

The omp adapter emits it as a third front-matter key, each name through the same `yamlString` the
description uses. Absent or empty emits nothing, leaving the two-key document unchanged. The
claude and codex adapters are untouched: neither harness has a field that loads a skill from an
agent definition, and emitting a key a harness ignores is noise.

This closes the gap that made every skill binding advisory. A main-session persona now carries
its required skills in the system prompt on every turn rather than waiting for a description to
match, and a spawned subagent gets them injected before its first prompt.
