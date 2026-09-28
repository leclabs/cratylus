---
"@cratylus/forge": minor
"@cratylus/schema": patch
---

Every projected agent is given the closure of its skills over `composition`

Projection now hands each adapter an agent's declared skills followed by every
skill they transitively compose, breadth-first in each cell's declaration order,
each name once. `skillClosure`, beside `resolveSkills`, computes it once in
`projectPluginSet` against the set's resolved skills, so a later plugin's
same-name cell changes it, a name no plugin ships is kept and not expanded, and a
composition cycle terminates. Adapters render the list they are handed.

`HarnessAdapter` gains the required `preloadsSkills`. omp says yes and emits
`autoloadSkills` as before. claude says yes and now emits the subagent `skills`
front-matter sequence, which Claude Code preloads. codex says no: its agent TOML
has no such field, so no key is emitted, the closure ends
`developer_instructions` as a `## Required reading` section, and projection
warns once per agent given any skills.

The `Agent.skills` documentation no longer claims that claude has no equivalent.
