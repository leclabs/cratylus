# @cratylus/forge

## 0.3.0

### Minor Changes

- d31a769: omp is a harness: an agent can now BE a declared being on it

  `cratylus project --harness omp` and `cratylus deploy --harness omp` land a
  projected persona at `~/.omp/profiles/<name>/agent/APPEND_SYSTEM.md`, which omp
  auto-discovers and appends to its base system prompt. Measured on `omp/17.2.9`:
  launched in a blank cwd with `--no-skills` and the corpus nowhere on disk,
  `omp --profile tester` answers "My name is tester."

  **`--profile <name>` is this harness's `--agent <name>`.** It is the only name an
  omp launch carries — there is no `--agent` flag, `SessionStartEvent` has no
  payload, and the one near-miss (`agentId`) is SDK-only IRC routing reachable from
  neither the CLI nor an extension. The profile also exports `OMP_PROFILE` into the
  environment and roots a private config tree, which is what makes the rest work.

  **The per-agent scope is a DIRECTORY**, and that is the new shape. Claude attaches
  a hook inside a subagent's front-matter; codex declares hooks globally and narrows
  with a generated `matcher` regex. omp needs neither: its native config root is
  profile-scoped, so a module written to `profiles/<agent>/agent/extensions/` loads
  under that profile and no other. Composition is realized by WHERE the file is, so
  enforcement needs no selector and no runtime self-filter — the ambient form
  `MODEL.md` forbids outright. Every event omp can fire, this adapter can scope,
  which closes the bootstrap's finding that everything degraded to `steer` there.

  Three things the harness's own naming gets wrong, each corrected against its
  source rather than its doc comments: `turn.end` is `agent_end`, not `turn_end`
  (omp's "turn" is a MODEL turn and would have fired several times per exchange);
  `prompt.submit` is `before_agent_start`, not `turn_start` (which carries no prompt
  text); and `agent_start`/`agent_end` are the main loop, never subagents.

  ### `HarnessAdapter.agentRel` — the destination layout is the adapter's

  New required member: where an agent's definition lands ON THE HOST, relative to
  the harness home. The render tree's staging layout and a harness's own layout are
  two different facts, and deploy had them as one — `agents/<name><agentExt>`,
  hardcoded at four sites. Claude and codex both happen to match it, so the
  assumption held for two harnesses and was invisible until a third keyed its
  persona by a per-agent directory.

  ### Fixed: codex's per-agent enforcing constraints reached the host as nothing

  `enforcingSurface` was called with only its bindings while every implementation
  needed the `anchor → HarnessMechanism` map to know what command to wire. Codex's
  took the map as an optional parameter and the adapter wired it at arity one, so
  every binding hit `if (!m) continue` and the function returned `null` for all
  input — measured, not inferred. It stayed green throughout because the unit tests
  call the function directly with a map the production path never supplied. The port
  now threads it, and `enforcingSurface` may return many projections rather than one.

## 0.2.0

### Minor Changes

- 3e9c103: The command ships from one package, and `forge` becomes a library.

  **Breaking, and marked `minor` deliberately.** Pre-1.0, a `minor` bump IS the breaking signal —
  changesets reads `major` on a `0.x` package as a jump to `1.0.0`, which would claim a stability this
  project has not earned while every sibling is still `0.x`.

  **`cratylus` is the package a consumer installs.** It was `@cratylus/invoke`, which
  ARCHITECTURE already described as the composition root; it now carries the build-time entry beside
  the run-time one rather than a third package appearing. **One command.** `cratylus-run` is gone: a second bin existed only because the two surfaces lived
  in two packages and each built its own `cac`. Capability verbs (`cratylus memory encode`) route to
  the runtime, everything else to the projector. The "two DAGs" the split defended are a fact about
  IMPORTS, and imports are what the bundler and the package manager already handle.

  `@cratylus/runtime` renames `runMain` to `runCli` and `RUNTIME_BIN` to `CLI_BIN` — there is one
  command, so the name that said otherwise was a lie. `CLI_BIN` lives in the runtime because it is the
  contract leaf: it depends on nothing, so every package imports the name without inverting an edge.
  The host runtime config follows it to `~/.cratylus.json`.

  It also gains a library face: `import { defineConfig } from 'cratylus'`. A consumer never reaches
  into `@cratylus/forge/config`, so the internal package split stays ours to change.

  **`@cratylus/forge` no longer declares a `bin`** — breaking for anyone invoking it as a program
  rather than importing it. Two manifests declaring one bin name is an install conflict, not a second
  home, so the name has exactly one home and it is the hub's manifest. `CLI_BIN` is handed down by
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

  **`cratylus install` is new** — the zero-config path for an operator with no project. It resolves a
  corpus (the config where one exists, otherwise the corpus the mounting package names), detects the
  harness, renders to a temp tree and places it at user scope. `graphify install [--platform P]` is
  the prior art. Two harnesses on a host refuses and names both rather than choosing one silently.

### Patch Changes

- Updated dependencies [3e9c103]
  - @cratylus/runtime@0.2.0
  - @cratylus/schema@0.1.2

## 0.1.1

### Patch Changes

- a019716: Every CLI reports the version its manifest declares.

  `0.1.0` shipped with `cratylus-run --version` and `cratylus --version` answering `0.0.0`: the
  number was a literal in TypeScript, and `changeset version` rewrites manifests rather than
  source, so the two diverged at the first release and would have stayed diverged. Each now
  reads its own manifest by package self-reference, and a gate holds the shape.

- Updated dependencies [a019716]
  - @cratylus/runtime@0.1.1
  - @cratylus/schema@0.1.1

## 0.1.0

### Minor Changes

- 6b471c4: Initial public release of Cratylus — the latent-lexicography toolchain.

  `0.1.0` rather than `1.0.0` deliberately: under semver, `0.x` signals a surface that may still break,
  and several concepts are still being cut. The names, however, are settled —
  scope, packages, and both bin names went through the full round-trip (forward argmin, blind reverse
  decode, occupancy check) before this release, because a name is free until first publish and never
  after.

  - `cratylus` — the build-time command: author, resolve, project and deploy a corpus.
  - `cratylus-run` — the run-time command a deployed agent's shims invoke for a capability.

### Patch Changes

- Updated dependencies [6b471c4]
  - @cratylus/runtime@0.1.0
  - @cratylus/schema@0.1.0
