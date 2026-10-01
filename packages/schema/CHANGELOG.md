# @cratylus/schema

## 0.8.0

### Minor Changes

- 1e5fd22: `cratylus install` offers practices where it offered optional personas. `--practices <name,…>` names the practices to install and `--all` installs every one; on a terminal with neither, install asks one multiselect of the declared practices, each with its description, preselecting the ones already installed here (on a fresh host, the corpus's preselected `cdd`), and `--yes` takes that preselection. With no terminal on stdin and stdout and neither flag, install refuses before writing anything and names `--practices` and `--all`, under `--yes` and over an existing install too; it used to place the whole corpus. An empty choice is refused, saying that removing everything is `cratylus uninstall`, and `projectPluginSet` refuses `practices: []` instead of rendering every cell (absent still renders every cell). A practice installed before and not chosen now is removed with the agents, skills, hooks and persona commands no chosen practice still carries, and the chosen practices are recorded in the deploy manifest for the next run to preselect. The persona decision is retired: `--personas`, `Agent.optional`, `ProjectOpts.omitAgents` and `ProjectedTree.optionalAgents` are gone, and `kino` and `nico` are installed with their practices, `film-production` and `corpus-authoring`.
- 57fd456: A practice: a way of working a corpus offers as one installable choice, with the agents, skills and hooks that carry it. The schema gains `Practice`, `Plumbing`, `AgentPlugin.practices` and `AgentPlugin.plumbing`, and `Agent.dispatches`, the roles an agent hands work to. Canon's role cells state the roles their holders dispatch, and canon declares `cdd` (preselected), `corpus-authoring`, `film-production` and `carry-on`, with the event tap and the drift notice as plumbing. Forge projection takes `practices` to render; absent, every cell renders as before, and given names it renders only what they place, refusing a set not closed under skill composition and agent dispatch. `ProjectedTree.practices` reports the declared practices for an install to offer.

## 0.7.0

### Minor Changes

- d65e7db: `cratylus install` is a short guided run. It asks only what the operator must decide — which harness, which of the corpus's optional personas (an agent may declare `optional`; kino and nico do, and every other agent is always installed), whether to link the persona launch commands, and which model each held role routes to — shows what it will place before placing anything, places it once confirmed, and ends with a few lines saying what was done and what to do next. Each decision has a flag (`--harness`, `--personas <name,…|none>`, `--link-persona-commands` / `--no-link-persona-commands`, `--model-roles <role=model,…|default>`) and a decision given by flag is never asked; with every decision given, with `--yes`, or with no terminal, nothing is asked and nothing waits for a confirmation. `--dry-run` prints the preview and stops; `--verbose` prints the per-file detail the run used to print by default. What install places is exactly what the operator decided and exactly what `cratylus uninstall` removes: an optional persona not chosen is left out (and one installed before and not chosen now is removed, with its launch command), and a chosen omp `modelRoles` entry is recorded for uninstall like the ones it seeds.

  A model chosen at install is the host's from then on. On Claude Code the deploy manifest now lists, beside `agentModels`, the agents whose `model:` line is the host's (`hostModels`): a chosen line stays when the rendering moves even where it equals the rendered one, a line the host edits stands, and a line the host removes stays removed. A line cratylus rendered and nobody chose follows the rendering, and a manifest written before the list reads as it did. A role the host already routed is never asked and never changed. On omp the same holds of a `modelRoles` entry the operator chose, which the manifest lists as `hostRoutes`; the entry install seeded itself for a role nobody chose is not the host's, so a later install asks that role again and moves the entry to the answer, and an uninstall still removes exactly the lines install put there.

  Projection takes `omitAgents`, leaving named agents out of the render entirely, and reports the plugin set's `optionalAgents` and, per held role, the agents holding it (`roleHolders`). `runDeploy` takes `models` (agent name to a model value) on claude, and a `warn` sink for every warning it and its placers print; a non-empty `models` fails on omp, whose routes live in its own config. The `RoleRouting` port lists the built-in roles an operator may route to (`offered`). A host's `settings.json` is written back in the style it was found in, so an install and the uninstall after it return a compact file byte for byte.

## 0.6.0

### Minor Changes

- 8f1abc6: The scope-enrolled guards now judge on Claude Code, and only the agents that compose them. They fired from `settings.json` on every turn and exited at their scope gate, because the gate read only the `stance_scope` that omp's dispatcher supplies, so a Claude Code session was never judged and nothing said so.

  `@cratylus/schema` adds the projection facts `harness-persona-root` and `stance-manifest`, and `HookCell.binds`: the composition (a dimension and optionally one value's anchor) that makes a cell a guard and binds an agent to it. A cell without `binds` binds nobody.

  `@cratylus/forge` builds the stance manifest once, in `core/enrollment.ts`, and the projector stages it for every adapter that declares `scopedRel`. Each persona's manifest lists exactly the guards its composed agent includes, never every cell for every persona and never the drift notice, so omp's rendered manifests drop the `deploy-drift-notice` gate they used to carry. The claude adapter now declares `scopedRel`, placing a persona scope at `personas/<name>/` under `.claude`. `OMP_STANCE_MANIFEST` is now `STANCE_MANIFEST` in that module, and `install` logs the file as a stance manifest rather than as mechanism. A harness with no `scopedRel` cannot name the running agent, so projection warns once per guard and carries it as a steer, withholding its registration and workers. On omp, `tool.use.pre` now reaches its worker with the real `tool_name` (mapped from omp's `write`, `edit`, `task` and `ask`) instead of an empty one. `deploy` also stops dropping a cell's second matcher group on one event when it merges `settings.json`, which had left the stance dispatch guard and purview's every-tool group unregistered on a deployed host; an identical group is still added once.

  `@cratylus/canon` resolves the scope in all three guard workers as `stance_scope` when present, and otherwise as `<harness home>/<persona root>/<agent_type>` when the payload names an agent. A bare session and an agent with no manifest stay silent, and an `agent_type` that is not one directory name is refused. The turn-end worker now judges a subagent's own transcript (`agent_transcript_path`) rather than its parent's, and takes the closing message from the payload's `last_assistant_message`, because Claude Code fires Stop before that message reaches the transcript, so a turn that was only text went unjudged. Purview now reads the shared judge seam (`STANCE_EMIT_PAYLOAD`, `STANCE_VERDICT_FILE`) like its siblings; under its own `PURVIEW_` names the omp bridge got no payload back and it judged nothing there. The workers take the manifest path from the `stance-manifest` fact, and the regenerated `.sh` targets differ accordingly.

- 7c7d49b: The prime principle is carried only by the cells whose laws apply it, no longer stamped on every projected cell.

  `AgentPlugin.preamble` is removed from `@cratylus/schema`, along with `ProjectOpts.preamble` and the plugin-wide stamping in `@cratylus/forge` (agent and skill projection, `resolveSkills`). A plugin that set `preamble:` must move the block onto the cells that need it. `Skill` gains an optional `preamble`, the same shape `Agent.preamble` already had, and projection emits it as the first section of that skill's SKILL.md.

  `@cratylus/canon` drops `preamble` from its plugin and sets `primePrinciple` on the ten skills that name concepts by anchor, optimal sign or cold decode: `create-skill`, `deliver`, `design`, `exemplify`, `formalize`, `introspect`, `materialize`, `plan`, `probe` and `signify`. The other six skills carry no `## Prime Principle`, and no agent does: each agent already carries cratylism once through its held role's engineering-principles, where it previously carried it twice. The stance-guardrail operator-slot filter now recognizes a skill body by its verb H1 over the fenced formal block instead of by `## Prime Principle`.

## 0.5.0

### Minor Changes

- 538b742: An agent's held role is carried to omp as the key its host routes a model by

  `Agent` gains an optional `holds`, the held role's anchor, which canon's `holds` fold sets from the
  role it is folding in. On omp, each agent holding a role now projects
  `model: ["@<role>", "@default"]`; it names the role and no model, and an agent holding none emits
  no `model` key. `HarnessAdapter` gains an optional `roleRouting` (omp only), `ProjectedTree`
  reports the `heldRoles` it rendered, and `cratylus install` adds, for each held role the host's
  `modelRoles` lacks, an entry aliasing the nearest built-in role
  (implementer to `@task`, planner to `@plan`, assayer and architect to `@default`). Install edits
  the config file omp reads (`~/.omp/agent/config.yml`, else `config.yaml`) by inserting lines, creates
  `config.yml` only when neither exists, never changes an entry the host has, leaves a
  `modelRoles` it cannot safely extend untouched and says so, and reports each entry added. An agent
  whose role has no entry runs on the `default` role.

## 0.4.0

### Minor Changes

- eff81ef: The runtime ships four capabilities, built in, and nothing else

  `eventTap`, `design`, `plan` and `note` are the capabilities, each a module of the runtime and known when it is built. The runtime routes exactly these four, each to its own verb surface; nothing is discovered, registered or loaded, and nothing is scoped to a session. `memory` and `heartbeat` are no longer commands: `cratylus` hands any first word that is not one of the four to the projector. Every refusal the event tap raises now opens with `eventTap:` (`eventTap install:` and the like) rather than `event-tap:`.

  **Breaking for `@cratylus/runtime`.** The subpaths `./loader`, `./dispatch` and `./ports/memory` are removed, and with them `RuntimeHost`, `bootstrap`, `discoverConfigured`, `dispatch`, `parseArgs`, `verbsOf`, `MemoryStrategy`, `RuntimePlugin` and `defineRuntimePlugin`; the `heartbeat` port and capability are removed; `capabilities/event-tap` no longer exports `runtimePlugin`. `CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, and `SESSION_SCOPED` is removed. `runCli(argv)` takes no options. `RuntimeConfig` loses the provider keys `capabilities` and `resolveFrom`: a host config is live when it carries `events`, `harnesses` or `configuration`, and the provider keys in an existing `~/.cratylus.json` are ignored.

  **Breaking for `@cratylus/forge`.** `emitRuntimeConfig` and `runtimeConfigDocument` no longer take, write or carry over `capabilities` and `resolveFrom`, and `EmittedRuntimeConfig` loses both; a deploy drops them from an existing host config. `ResolvedSkill` loses `toolSection` and `skillDescription`; every projected skill's front-matter carries its `description`, and claude's carries its `trigger`. Projected SKILL.md bytes are unchanged.

  **Breaking for `@cratylus/schema`.** `SkillDeploy.deployAs` is removed.

  **Breaking for `@cratylus/canon`.** `RUNTIME_CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, so a cell naming `heartbeat` no longer compiles.

## 0.3.0

### Minor Changes

- 36a0511: Capability configuration travels to the runtime the way the event vocabulary does

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

### Patch Changes

- 859d0fa: Every projected agent is given the closure of its skills over `composition`

  Projection now hands each adapter an agent's declared skills followed by every
  skill they transitively compose, breadth-first in each cell's declaration order,
  each name once. `skillClosure`, beside `resolveSkills`, computes it once in
  `projectPluginSet` against the set's resolved skills, so a later plugin's
  same-name cell changes it, a name no plugin ships is kept and not expanded, and a
  composition cycle terminates. Adapters render the list they are handed.

  `HarnessAdapter` gains the required `preloadsSkills`. omp says yes and emits
  `autoloadSkills` as before. claude says yes and now emits the subagent `skills`
  front-matter sequence, which Claude Code preloads. codex says no: its agent TOML
  has no such field, so no key is emitted, the closure ends
  `developer_instructions` as a `## Required reading` section, and projection
  warns once per agent given any skills.

  The claude agent front matter now quotes `description`, so a description holding
  `: ` no longer makes the front matter invalid YAML.

  The `Agent.skills` documentation no longer claims that claude has no equivalent.

## 0.2.0

### Minor Changes

- b0bc847: An agent declares the skills it operates through

  `autoloadSkills` was a reader with nothing to read. OMP honours the field natively for a spawned
  subagent, and the generic `omp-agent` launcher already rendered it as required reading for a main
  session — the consuming half existed on **both** paths. The producing half did not, because the
  corpus had nowhere to declare it. The branch was live code with zero live inputs: every deployed
  definition carried exactly `name` and `description`.

  `Agent.skills` is an optional list of skill NAMES, modelled on the existing optional `preamble`.

  It is deliberately **not a dimension**, for two independent reasons. Structurally, a dimension's
  value is a branded σ\* fragment `agentBody` emits into the Target, while a skill name is an
  address a host resolves — declaring it as a dimension would mint one empty fragment per skill.
  Conceptually, a dimension is a persona trait, and which skills an agent loads is apparatus; the
  catalog would misrepresent it and hand every agent one more required `null` to spell.

  The omp adapter emits it as a third front-matter key, each name through the same `yamlString` the
  description uses. Absent or empty emits nothing, leaving the two-key document unchanged. The
  claude and codex adapters are untouched: neither harness has a field that loads a skill from an
  agent definition, and emitting a key a harness ignores is noise.

  This closes the gap that made every skill binding advisory. A main-session persona now carries
  its required skills in the system prompt on every turn rather than waiting for a description to
  match, and a spawned subagent gets them injected before its first prompt.

### Patch Changes

- e2b2263: A harness-invariant hook asset deploys once, to the vendor-neutral `.agents` root

  The stance rubric is one 27 kB file every projection scores against, byte-for-byte identical
  across claude, codex and omp — and it was being copied into `<harness>/hooks/stance-guardrail/`
  three times. The duplication was the smaller half of the cost. The larger half is that the text
  had **no address any other realization could name**: an advisor roster entry wanting the same
  rubric would have had to `@`-import it out of a sibling harness's tree, which is exactly the
  cross-harness reach `harness-independence` forbids. A shared asset has one address, and the
  neutral root is the one place every harness may read without reaching into another.

  `HookWorker.shared` declares it, `SHARED_STAGE_DIR` stages it, and deploy places it at
  `../.agents/<id>/` — the same relative-escape shape the scoped mechanism modules already use,
  so the manifest keeps it attributable and prune retires it with its hook. The workers resolve
  it by DERIVATION (`.agents` is the sibling of every harness home, three `dirname`s up), never
  by a baked `$HOME`, so a sandboxed `--home` deploy resolves correctly — the same discipline
  that repaired the `$HOME/.claude` leak, applied before it could become one.

  **The criterion is `byte-identical ∧ ¬executable`, and the gate is what corrected it.** The
  first cut said byte-identical alone, and it immediately caught two assets that must NOT move:
  the worker scripts are byte-identical too, and are positionally coupled to the harness in two
  ways their bytes cannot show — each harness's registration addresses its own copy by path, and
  each worker resolves `stance-judge.sh` as a sibling. That judge is genuinely harness-specific
  (it names the harness's own CLI through `{{fact:harness-judge-bin}}`), so a single shared
  worker could not know whose judge to run without the registration passing it in. That trade
  relocates harness-specificity into a shared file's arguments and buys only the deduplication of
  two scripts that belong beside the registration invoking them. An entry point a harness invokes
  is executable; a rubric is not.

  The gate holds both directions and is non-vacuous in both arms: the corpus must contain a shared
  data asset and a harness-specific one, or the rule is green over nothing.

  Verified on a sandboxed two-harness deploy — one rubric on disk, claude and omp both resolving
  `<home>/.agents/stance-guardrail/stance-judge-prompt.md`, including from the pre-guard — and
  live on omp, where the guard blocked twice reading the shared rubric with a tripwire `claude`
  first on `PATH` never invoked.

- 415a112: omp judges in-process; no harness depends on another harness's CLI

  `claude -p` was never an acceptable judge for omp, and it was not acceptable for codex
  either. The backend hardcoded `judge_bin="${STANCE_JUDGE_BIN:-claude}"`, so every harness's
  stance guard required a third vendor's CLI installed, on PATH, and separately
  authenticated. When that OAuth lapsed on the author's host, every verdict on every harness
  failed open in silence — deployed, opted in, correctly scoped, judging nothing.

  **The judge seam is now explicit, and the procedure still has one home.** A host that holds a
  model runs the worker twice around a judgment it makes itself: once with `STANCE_EMIT_PAYLOAD`
  to collect the gated, layer-1-annotated payload and the rubric that scores it, then again with
  `STANCE_VERDICT_FILE` naming its answer. Everything either pass touches before the seam is
  read-only, so the counters, the hash and the verdict log see exactly one pass. The gating,
  extraction, deterministic pre-filter, evidence verification and block accounting stay in the
  worker; only the model call moves.

  **omp's shim takes that seam.** The emitted extension module resolves `modelRoles.advisor`
  (then `smol`, then `tiny`, then the live session model) through `ctx.modelRegistry`, gets auth
  from omp's own registry, and calls `completeSimple` — static-imported from `@oh-my-pi/pi-ai`,
  which omp's loader aliases to its own bundled build. Measured against `omp` v18.1.19: the real
  26.8 kB rubric judged in 1991 ms on a local model, and a live `mav` session blocked, re-opened
  the turn, and settled with a tripwire `claude` first on `PATH` never once invoked.

  The richer `judgment` module (`TextJudge`, `chatTextBackend`, `NoulQuestion`) exists in omp's
  source but is **not** in the bundled compat entrypoint the shipped binary carries; importing it
  silently kills the module load. `completeSimple` is what the binary exposes and what a judge
  needs.

  **The judge binary is now a projection fact, not a literal.** `harness-judge-bin` joins the
  closed `ProjectionFact` set; each adapter answers with its own name — claude `claude`, codex
  `codex`, omp the **empty string**, because it judges in-process and names no subprocess at all.
  An empty value is a real answer and the backend reads it as one, failing open rather than
  falling back to somebody else's CLI.

  **A gate holds the law.** `canon/harness-independence.test.ts` fails if any committed worker
  names another harness's home in executable shell, or if a cell template names a vendor CLI
  where a projection fact belongs. Both legs were convicted before admission: a
  `$HOME/.claude/...` line injected into a committed worker and a `:-claude}` default restored to
  the cell each produced exactly one finding, and removing them returned the gate to green.
  Comments are exempt — a rule that forbids naming `claude` in a sentence would delete the record
  of the repair along with the bug.

## 0.1.2

### Patch Changes

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

## 0.1.1

### Patch Changes

- Updated dependencies [a019716]
  - @cratylus/runtime@0.1.1

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
