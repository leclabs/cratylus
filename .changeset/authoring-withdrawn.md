---
"cratylus": minor
"@cratylus/forge": minor
"@cratylus/canon": minor
"@cratylus/schema": minor
---

The `cratylus` command offers using cratylus only: `install`, `uninstall` and the capabilities (`concepts`, `versionSkew`). Its help, its no-argument output and its README list nothing else, and `install` always installs the canon the command is built with.

BREAKING CHANGE: the commands `init`, `add`, `compose`, `project`, `deploy` (with `deploy --check`), `explain` and `catalog` are removed, and with them the `Corpus authoring:` help group; each is now refused as an unknown command. `cratylus.config.ts` is read by nothing: `install` no longer reads one from the working directory and always installs the bundled canon, refusing only when mounted with no canon at all. The `cratylus` package has no library entry any more, so `defineConfig` (and `CratylusConfig`) are gone from `cratylus` and from `@cratylus/forge`, together with forge's `./config`, `./deploy` and `./validate` subpaths (the config loader and scaffold, render-tree deploy and its drift check, `scaffoldProject`, `writeRenderTree`, the cold-read driver), and `@cratylus/forge/catalog` loses `enumerateCatalog`, `shortlex` and `CatalogEntry`. `projectorCommands` returns the two commands as one list and takes the canon as `canon`; `usageExitCode` is removed. `@cratylus/schema` drops the `deploy-bin` and `deploy-check-drift-code` projection facts and `SkillDeploy.assets`, which only the removed deploy read. `@cratylus/canon` no longer carries the `create-agent` and `create-skill` skills: the `cratylic-context-design` practice keeps its other skills, and an install no longer places those two. A project installation over an earlier render tree in `.cratylus/<harness>` is still refused: move that tree away, and install again.
