---
"@cratylus/schema": minor
"@cratylus/canon": minor
"@cratylus/forge": minor
---

An agent's held role is carried to omp as the key its host routes a model by

`Agent` gains an optional `holds`, the held role's anchor, which canon's `holds` fold sets from the
role it is folding in. On omp, each agent holding a role now projects
`model: ["@<role>", "@default"]`; it names the role and no model, and an agent holding none emits
no `model` key. `HarnessAdapter` gains an optional `roleRouting` (omp only), `ProjectedTree`
reports the `heldRoles` it rendered, and `cratylus install` adds, for each held role the host's
`~/.omp/agent/config.yml` `modelRoles` lacks, an entry aliasing the nearest built-in role
(implementer to `@task`, planner to `@plan`, assayer and architect to `@default`). Install edits
that host-owned file by inserting lines, never changes an entry the host has, leaves a
`modelRoles` it cannot safely extend untouched and says so, and reports each entry added.
