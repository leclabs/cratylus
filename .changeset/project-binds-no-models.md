---
"cratylus": minor
"@cratylus/forge": minor
---

A project installation binds no models. It is shared through the project, and a tier's model is each operator's own setting, so `cratylus install --scope project` no longer asks for a model or writes a `modelRoles` entry, in the project's `.omp/config.yml` or anywhere else, and `--model-roles` with `--scope project` is refused, naming `cratylus install --scope user --model-roles …` instead. It reads, without writing, the project's settings and your own, and names as your next step each tier the agents fall back to that neither binds, to bind in your own settings. The status line choice at project scope is unchanged. `cratylus uninstall --scope project` now also removes the project's `.omp/` where install created it and it is left empty; an `.omp/` that was there before install stays. A user installation asks and binds models as before.

At project scope those settings are read in any layout omp reads (block or flow YAML, or JSON), so a tier bound in a layout install would not edit is never named as unbound.
