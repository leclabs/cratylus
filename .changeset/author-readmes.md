---
'@cratylus/canon': patch
'@cratylus/forge': patch
'@cratylus/runtime': patch
'@cratylus/schema': patch
---

The package READMEs are rewritten for the author of a corpus or of a harness adapter, from the tree as it stands. Each says what its package is for and how its own surface is used, and links to `ARCHITECTURE.md` for what every package is for and to the `cratylus` README for what a consumer does. The forge README drops the install, launch, badge and uninstall detail the `cratylus` README holds and keeps the pipeline, the harness adapter port, the deploy placement table and the library surface. The schema README now spells a dimension's `repertoire` (its example said `kind`), names the `@cratylus/schema/hook` exports as they are, and covers the plugin declaration. The canon README no longer says canon takes `defineAgentPlugin` from forge, and describes the architect, planner, implementer, assayer and integrator agents as the generic holders of their roles and mav, nico and kino as personas over the architect role. No behaviour changes.
