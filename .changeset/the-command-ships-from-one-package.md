---
'cratylus': minor
'@cratylus/forge': minor
'@cratylus/schema': patch
---

The command ships from one package, and `forge` becomes a library.

**Breaking, and marked `minor` deliberately.** Pre-1.0, a `minor` bump IS the breaking signal —
changesets reads `major` on a `0.x` package as a jump to `1.0.0`, which would claim a stability this
project has not earned while every sibling is still `0.x`.

**`cratylus` is the package a consumer installs.** It was `@cratylus/invoke`, which
ARCHITECTURE already described as the composition root; it now carries the build-time entry beside
the run-time one rather than a third package appearing. One install, two commands — `cratylus` and
`cratylus-run` stay separate **commands** because they serve separate DAGs, and shipping them from a
single package is what makes that a seam instead of a second install.

It also gains a library face: `import { defineConfig } from 'cratylus'`. A consumer never reaches
into `@cratylus/forge/config`, so the internal package split stays ours to change.

**`@cratylus/forge` no longer declares a `bin`** — breaking for anyone invoking it as a program
rather than importing it. Two manifests declaring one bin name is an install conflict, not a second
home, so the name has exactly one home and it is the hub's manifest. `FORGE_BIN` is handed down by
whatever mounts the CLI instead of derived from a manifest forge no longer has; that is a parameter,
not a second spelling. `./cli` is added to the exports map so the hub can mount it.

**The config file is `cratylus.config.ts`,** and its factory is `defineConfig`. `agents.config.ts`
named one of four Kinds while governing all four, ignored the near-universal tool-named convention,
and claimed the most contested filename in the ecosystem. `CONFIG_FILE` now derives from the bin
name — the config is named after the tool, so it carries the same single-home obligation.

**`deploy` defaults its render tree** to `.cratylus/<harness>`, what `project` writes. The ordinary
invocation is `cratylus deploy`; `--agents-dir` / `--skills-dir` / `--hooks-dir` remain as
overrides, and a missing tree refuses by naming `cratylus project` rather than by demanding a flag.

**`@cratylus/schema` drops its `@cratylus/runtime` dependency.** It imported nothing from it — the
edge was repaired in the source on 2026-08-05 and the manifest entry was left behind, so installing
the shapes package also downloaded the runtime. Schema is the package the whole graph sits on top
of; its own README already said "this package imports nothing" while its manifest disagreed.
