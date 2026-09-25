---
"@cratylus/schema": minor
"@cratylus/forge": minor
"@cratylus/runtime": minor
"@cratylus/canon": patch
---

Capability configuration travels to the runtime the way the event vocabulary does

A skill's runtime face (`SkillDeploy.runtime`) may now carry `configuration`, a
`JsonValue` the capability receives, with no opinion in `@cratylus/schema` about
any capability's keys. `cratylus deploy` and `cratylus install` gather it from
every skill of the resolved plugin set and emit it into the host runtime config
keyed by capability, beside `events`: regenerated on every run,
harness-independent, and refused when two skills configure one capability. The
operator-owned `capabilities` field keeps its preservation rule.

Deploy now derives the event vocabulary and the configuration from one plugin
set: `runDeploy`'s `events` option is replaced by `plugins`, which a caller that
already holds the corpus (as `install` does) passes instead of a config path. The
skills rendered by projection and the skills whose configuration is emitted come
from one resolution of the plugin set. `loadRuntimeConfig` lifts the
block as `RuntimeConfig.configuration`; a config carrying only configuration is a
real config, and a malformed block is ignored without wedging the load. A
capability whose entry is absent must refuse and say so, never fall back to a set
of its own.

`@cratylus/canon`'s event-vocabulary gate now holds the configuration's round
trip across schema, forge and runtime, including a leg that fails when a member
is dropped.
