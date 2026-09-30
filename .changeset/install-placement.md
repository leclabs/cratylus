---
'@cratylus/schema': minor
'@cratylus/canon': minor
'@cratylus/forge': minor
---

Install places what the operator decided. An agent may declare `optional` (kino and nico do): an install offers it without preselecting it. Projection takes `omitAgents`, leaving named agents out of the render entirely, and reports the plugin set's `optionalAgents`. `runDeploy` takes `models` (agent name to a model value), placing the chosen `model:` line on claude defs while the manifest keeps the rendered value, so the choice stands as the host's on every later deploy; a non-empty `models` fails on omp, whose routes live in its own config. `runDeploy` also takes a `warn` sink for every warning it and its placers print.
