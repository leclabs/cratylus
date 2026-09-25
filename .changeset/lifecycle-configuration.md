---
"@cratylus/schema": minor
"@cratylus/forge": minor
"@cratylus/runtime": minor
"@cratylus/canon": patch
---

Capability configuration travels to the runtime the way the event vocabulary does

A skill's runtime face (`SkillDeploy.runtime`) may now carry `configuration`, a
`JsonValue` the capability receives, with no opinion in `@cratylus/schema` about
any capability's keys. `cratylus deploy` gathers it from every skill of the
resolved plugin set and emits it into the host runtime config keyed by
capability, beside `events`: regenerated on every deploy, harness-independent,
and refused when two skills configure one capability. The operator-owned
`capabilities` field keeps its preservation rule. `loadRuntimeConfig` lifts the
block as `RuntimeConfig.configuration`; a config carrying only configuration is a
real config, and a malformed block is ignored without wedging the load. A
capability whose entry is absent must refuse and say so, never fall back to a set
of its own.

`@cratylus/canon`'s event-vocabulary gate now holds the configuration's round
trip across schema, forge and runtime, including a leg that fails when a member
is dropped.
