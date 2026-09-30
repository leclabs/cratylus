---
'@cratylus/schema': minor
'@cratylus/canon': minor
'@cratylus/forge': minor
---

The placement half of a guided install. An agent may declare `optional` (kino and nico do): an install may offer it without preselecting it. Projection takes `omitAgents`, leaving named agents out of the render entirely, and reports the plugin set's `optionalAgents`. `runDeploy` takes `models` (agent name to a model value), placing the chosen `model:` line on claude defs while the manifest keeps the rendered value, so the choice stands as the host's on every later deploy, including a choice that equals the rendered model; a non-empty `models` fails on omp, whose routes live in its own config. `runDeploy` also takes a `warn` sink for every warning it and its placers print. `cratylus install` itself asks and places as before; it does not yet use these.
