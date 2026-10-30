# @cratylus/schema

## 0.14.0

### Minor Changes

- 6bcc373: Decision rights are invoked as RAPID by its name. A factor's metadata may now name the framework its values are the terms of (`framework`), and the projected agent text names it once, at the factor's heading: `### decision-rights (RAPID)`. Canon's decision-rights values `D`, `I`, `R`, `P` and `A` are now bare letters, carrying their meaning by RAPID's name. The slots' precising definitions are unchanged.

### Patch Changes

- c4c9c3a: The density every agent that held `maintenance` reads is now `convergence`, by its name alone. The communication-style value `maintenance` ("a peer's density, in the notation that peer works in"), which named the opposite of its concept in Communication Accommodation Theory, is removed; `convergence`, text `convergence`, takes its place for the tech lead, the software engineer, the test engineer, the code reviewer, mav and nico. The stance value `llmNative` (`llm-native`), which no agent held, is removed. The schema's comments on `Repertoire` quote the `cratylism` axiom as it now stands.

## 0.13.0

### Minor Changes

- a59e469: forge no longer carries the consumer-patch fold or value provenance, which only the removed configuration file and `explain` reached. `install` still discovers the canon's values, and discovery still refuses a shared namespace and a reference graph that dangles or cycles. The schema package's README now addresses cratylus's contributors rather than a canon's author.

  BREAKING CHANGE: forge's `./resolve` subpath is removed, with `resolve`, `ResolveConfig`, `ResolvedAgentSet`, `ResolvedFragment`, `FragmentContribution`, `ContributionSource`, `LoadedPlugin`, `PatchEntry`, `PatchOp`, `MissingExtendsTargetError`, `IllegalOpForValueShapeError`, `ForcePriorityTieError` and its re-export of `AgentPlugin` and `defineAgentPlugin` (import those from `@cratylus/schema`). `@cratylus/forge/project` loses `resolveFragmentBodies`, `AmbiguousFragmentBodyError` and `ProjectOpts.resolvedBodies`. `@cratylus/schema` loses `withBody`, which only the fold used.

- 87a0501: The `cratylus` command offers using cratylus only: `install`, `uninstall` and the capabilities (`model`, `versionSkew`). Its help, its no-argument output and its README list nothing else, and `install` always installs the canon the command is built with.

  BREAKING CHANGE: the commands `init`, `add`, `compose`, `project`, `deploy` (with `deploy --check`), `explain` and `catalog` are removed, and with them the `Corpus authoring:` help group; each is now refused as an unknown command. `cratylus.config.ts` is read by nothing: `install` no longer reads one from the working directory and always installs the bundled canon, refusing only when mounted with no canon at all. The `cratylus` package has no library entry any more, so `defineConfig` (and `CratylusConfig`) are gone from `cratylus` and from `@cratylus/forge`, together with forge's `./config`, `./deploy` and `./validate` subpaths (the config loader and scaffold, render-tree deploy and its drift check, `scaffoldProject`, `writeRenderTree`, the cold-read driver), and `@cratylus/forge/catalog` loses `enumerateCatalog`, `shortlex` and `CatalogEntry`. `projectorCommands` returns the two commands as one list and takes the canon as `canon`; `usageExitCode` is removed. `@cratylus/schema` drops the `deploy-bin` and `deploy-check-drift-code` projection facts and `SkillDeploy.assets`, which only the removed deploy read. `@cratylus/canon` no longer carries the `create-agent` and `create-skill` skills: the `cratylic-context-design` practice keeps its other skills, and an install no longer places those two. A project installation over an earlier render tree in `.cratylus/<harness>` is still refused: move that tree away, and install again.

- 9a8582e: `cratylus install` offers the `behaviour-driven-development` ruleset, first among the canon's rulesets and taken or left like every other. It holds one rule, `behaviour-driven-development-adopted`: "This project practises behaviour-driven development.", because the practice's name carries it whole, each role's participation included. Taken with `--rules behaviour-driven-development`, install places `rules/behaviour-driven-development-adopted.md`; without a terminal and without `--rules`, it places no rule and lists the six rulesets offered. `Rule.convention` is renamed `Rule.statement`.
- ff7723e: `cratylus install` installs every agent and skill of the canon, and offers the rulesets, whole or rule by rule. Run with no terminal and naming only the harness, it installs everything and is never refused for want of a choice. A completed install ends with how using cratylus starts where the business analyst is installed.

  BREAKING CHANGE: `InstallPrompts` asks for the harness, the scope, the rules, the model roles and the agent status, and nothing else. A plugin, `@cratylus/schema`'s `AgentPlugin` and `@cratylus/forge/project`'s `ProjectablePlugin` alike, is its name, its agents, skills, factors and hooks, its factor manifest and its rulesets (an `AgentPlugin` also its lifecycle events); the projection, the installation record and the deploy record carry agents, skills and rules.

- b8158fc: A term's precising definition is called by its name. `Slot.correction` becomes `Slot.precisingDefinition` and `HookDeclaration.correction` becomes `HookDeclaration.precisingDefinition`; the canon's manifest gives each decision-rights slot its precising definition under the new field. Rendered agents are unchanged.
- 5405787: `@cratylus/schema` names the canon's shapes in the design's terms: factor, value, term, correction, hook declaration, canon. It no longer says corpus, dimension, fragment, cell, anchor, gloss, residue or σ*.

  Breaking renames: `DimensionMeta` → `FactorMeta`, `DimensionManifest` → `FactorManifest`, `DimensionFieldName` → `FactorFieldName`, `DimensionOf` → `FactorOf`, `SetDimensionOf` → `SetFactorOf`, `RequiredDimensionOf` → `RequiredFactorOf`, `FieldDimensionOf` → `FieldFactorOf`, `DimensionFieldsOf` → `FactorFieldsOf`, `isDimensionValue` → `isFactorValue`, `dimensionValueOf` → `factorValueOf`, `anchorOf` → `termOf`, `HookCell` → `HookDeclaration` (its field `residue` → `correction`). A value's brand property `__dimension` is `__factor`. `Binding.anchor` is `Binding.term` and `Binding.fragment` is `Binding.value`. `Slot.gloss` is `Slot.correction`. A plugin's directory of factors is `factors`, not `fragments`. `mergeManifest` logs `override factor …` and, when no plugin declares a manifest, refuses with `no plugin in the set declares a factor manifest`.

### Patch Changes

- 7fd4af9: READMEs and source comments cite the standing decisions by their records in `design/decisions/`, by file name.
- 53f1bba: nico's expertise is terminology work as cratylic context design practises it, finding each concept's Cratylic name, its correction beside it, in the bounded contexts it is given. The canon README names the discipline cratylic context design, and the package keywords say `cratylic-context-design`.
- 4958b21: The person cratylus serves is called the product owner everywhere, never the operator: in the elicit skill, the `install` help and refusals, the READMEs and the code's comments.

  **Breaking.** The canon's lifecycle moment `operator.consult.pre` is now `product-owner.consult.pre`, and `@cratylus/forge`'s exported omp bindings (`canonicalActToOmp`, `ompBindingOf`) know it only by the new name. A hook bound to `operator.consult.pre` must now name `product-owner.consult.pre`.

- e8c2123: The README says which `Agent` fields the canon's own fold copies from its factors (`holds`, `routing`, `contract`), and that `skills` and `isolation` are not factors but stated on the agent itself.
- d2c0e9d: The README's export table names exactly what the root entry exports, and its `Agent` paragraph names the optional fields that exist (`holds`, `routing`, `contract`, `skills`, `isolation`), no longer `dispatches` or `readOnly`.

## 0.12.0

### Minor Changes

- 4c85b6e: Agents are judged in real use, so the mechanisms that policed an agent's act or text are removed, with nothing in their place.

  - The omp extension no longer strips omp's own system prompt for a session launched with `omp --agent <name>`: the declaration follows omp's prompt whole, and no notice of removed sections is shown. A dispatch from `eval` code is no longer warned of, and neither is a dispatch or launch whose assignment misfits its agent's form. Every turn still shows the assignment form of each agent that takes one, and every session start still reports version skew.
  - The omp extension no longer says, at session start, that its process runs a module an install has since replaced.
  - `@cratylus/schema` no longer exports `checkAssignment`, `assignmentIn` or `ContractCheck`; `JsonSchema` and `AgentContract` stay.
  - Canon no longer ships the `deploy-drift-notice` hook, its committed target or the `project:targets` script that regenerated it, and declares no plumbing. `cratylus deploy --check` is unchanged.
  - Canon no longer ships the `introspect` skill; the `corpus-authoring` practice carries the rest.
  - `cratylus optimize`, which checked the accept laws on a plan an agent wrote, is removed, with the exemplify pipeline behind it (`exemplify`, `optimize`, `elevateAgent`, `renderAgentVector`, `renderSkillCell`, the register classifier and their types).
  - `@cratylus/forge/validate` keeps only the cold-decode oracle's driver (`decodeCold`, `nonceControl`): the static accept legs, the residue grammar, the formal-block lint and the `Policy` shape are removed.
  - Canon's corpus-text gates are removed: reader density and reach, symbols, the symbol probe gate and symbol altitude with their tooling, formal-block self-sufficiency, skill shape, cratylism file naming, boundary binding, the cell gloss census, the hook boundary gate with its byte-lock, structural parsimony, the meta-gate that classified every test, and the source lints `authored-source-is-text` and `positional-path`. Forge's signification-marker scan and its story coverage suites go too, as do the simplification checks, the catalog re-cut's sign-off-gates and example checks, and the reply-discipline examples.

- cf853ad: Each agent's text states what it is and does, once and positively; no instruction carries a countermeasure against a failure never seen in use.

  - Canon rewords the architect's role and the `reconstitution` procedure and memory, `source-of-truth`, `honesty`, `decisive`, `conceptual-elevation`, `layman`, `bottom-line-up-front` and `read-back` values. The architect drops its role and reconstitution notes, takes a new `rectify` note, and holds `decisive`, `conceptual-elevation` and `bottom-line-up-front` at their factors' default level rather than fixed.
  - Canon rewords the lead, reviewer, builder and check-writer roles, the `no-implementation`, `append-only`, `never-repairs`, `fixed-acceptance-criteria`, `input-untrusted` and `privacy` guardrails, the `orchestrator-workers` procedure and `management-by-exception` autonomy, each as what it does and who does what it leaves; the reviewer's description and held-out-examples notes, the lead's `ship-show-ask` note and the architect's `read-back` note say the same positively, and the lead drops its `decisive` note. No factor's default level is `fixed` any more, so no agent's text carries "(fixed)".
  - The concept journal presents `design` as the read that recovers the design at a session's start, with `state` as its short summary, and its record as beginning at the journal's start.
  - The persona Protocol is removed: canon no longer exports `personaProtocol`, `Agent` loses `persistence`, and an agent declaration no longer ends with a `## Protocol` section. Persona drift is judged by the operator in real use.
  - The omp extension no longer adds the session-start reconstitution note, the "Meaning: yours" note or "The records" note to a launched session's prompt; every turn still carries the assignment forms.

- a19139a: cratylus ships rulesets: standard working conventions, each rule stating its convention and why it holds, placed where omp applies them in every session of every project.

  - Schema replaces the `RuleCell` source-cell shape with `Rule` (name, description, convention, why) and `Ruleset` (one convention's rules under its own name); an `AgentPlugin` offers `rulesets`.
  - Canon offers five rulesets: `gitflow`, `conventional-commits`, `commit-discipline`, `established-libraries` and `green-field`, exported as `RULESETS`.
  - Forge projection takes `rules` (rule names, default none) and renders each chosen rule to `rules/<name>.md` with `alwaysApply: true` front-matter; the owned root places them there, where omp loads a plugin's rules. The projected tree reports the declared `rulesets` for an install to offer. A name that is no declared rule, or a rule name two rulesets share, is refused.

### Patch Changes

- a33be54: The concept journal is the only home of cratylus's conceptual model, and INTRODUCTION.md is its entry point. The five static root documents (canon, vision, model, engine and architecture) are deleted, and no README or source comment points at them any longer. The repository's `AGENTS.md` is now a plain hand-authored file that sends a session to INTRODUCTION.md and the concept journal; canon's `repo-preamble` rule cell, its projection to `AGENTS.md` and the byte-lock that held them equal are removed, so `project:targets` regenerates hook targets only. The ground-conformance gate, which read the model document, is removed, and the cratylism gate no longer looks for those document names.
- 98c6546: Source comments, doc comments and test titles no longer cite the deleted root documents by bare name (vision, model, engine, architecture) or quote them as authorities, and no longer carry prescriptions taken from them; they explain what the code does.

## 0.11.0

### Minor Changes

- 4a2d9e4: An assignment schema may state alternative forms at its top level (`anyOf`): `checkAssignment` passes an assignment that fits any one of them, and when none fits reports the problems of the closest form (the first, when no assignment is given). The omp extension's dispatch form shows each alternative. Canon's lead now takes a story or a task with no story without a false warning, its outcome naming the story or the task; the architect, whose handovers are a person's, carries no contract, so a launched architect is never told to answer in JSON. The check-writer no longer sees held-out examples, which are given only to reviewers, and nico is described by the corpus's concept space and the cold-decode oracle.

## 0.10.0

### Minor Changes

- 20b730f: The dimension meta-model is re-cut for the agent catalog (decisions 0044, 0046). `DimensionMeta` is now `{ group, repertoire, arity, level, projection, slots?, required? }`: a free-text `group` replaces the `axis` and its `Genus` type, which are removed; `Repertoire` gains `'fixed'` (a closed list the design fixes); `Arity` gains `'slots'` (one value per named `Slot`) and `'attribute'` (no field on an agent; its values are attributes of other values); `level` is the default `EnforcementLevel` (`'advisory' | 'firm' | 'fixed'`, or `null`) and `projection` says whether the dimension is rendered as `'text'` or compiled to harness settings (`'binding'`); `required` is `true` or absent. `DimensionFieldsOf`/`AgentOf` give every non-attribute dimension a `readonly Entry<D>[]` field, where an `Entry` is `{ value, level, slot?, note? }`, with no `null` (an explicitly empty dimension is `[]`). The `Agent` identity face is `name`, `description`, `mark: Mark | null`, a reserved `key: null`, and optionally `holds`, `dispatches`, `routing: { tier, effort }`, `readOnly`, `skills` and `isolation`; `archetype`, `preamble` and `provenance` are removed.
- ebe2aa5: Typed handoffs. `@cratylus/schema` adds `JsonSchema`, `AgentContract` and `ContractCheck`, and the one assignment check every handoff runs: `assignmentIn(text)` reads the JSON of a dispatch text's fenced `assignment` block, and `checkAssignment(agent, schema, value)` names each missing and ill-typed field (`lead assignment is missing: examples`). Both reference nothing outside their own bodies, so a harness module may carry their source. `Agent` gains `contract` (the assignment and deliverable schemas) and `persistence` (the per-turn persistence protocol). Canon's assignment and deliverable values carry their schemas (`ASSIGNMENT_CONTRACTS`, `DELIVERABLE_CONTRACTS`), and composition copies them onto the lead, builder, assayer, check-writer and illustrator. The architect's free-text intent has none.

  Reach: the read-only derivation is gone. `Agent.readOnly` is removed and no composed agent is narrowed, the assayer included; only handoffs stay a permission.

  The architect is restored as the client's principal architect, owning the conceptual design and delivery of the product. `communication-style` gains the optional slot `ordering` (`Slot.optional`), and the architect holds `bottom-line-up-front` there, fixed. Its reconstitution procedure reads each touched context's overview first, then the detail it needs from the concept journal and the ledger, then reads the design, open decisions and cuts in flight back before acting. The persona genus moves from `genus/persona.md` to `genus/persona.ts` (`personaProtocol`), now names all seven drift tells, and is carried on every composed agent.

  Guards. `@cratylus/schema` adds `GuardCell` and `GuardJudge`, a hook cell that judges an act through a judge prompt and a JSON verdict instead of a worker, and `Layout.guards`. `guarded(value, guard)` makes a value enforce itself through a guard, so the guard binds exactly the agents composing that value.

- 77709cf: Agents are judged in real use, and nothing refuses their acts for how they behave (decisions 0142, 0145).

  - Canon: the `descend` and `past-objective` guards, `guarded()` and the plugin's `guards` dir are removed; the architect's elevation and stopping rule are plain values held by its own text. The `handoffs` factor is removed, so no agent is limited in whom it dispatches. Every role's evaluation is the one value `in-use` (its behaviour is evaluated in real use, by the operator working with it); `behavioral-examples`, `held-out`, `never-assertions` and `rubric` are removed. A persona that widens its reach is composed silently; one that weakens or removes a guardrail, or takes from a set other than its reach, is composed with a `CompositionWarning`. Malformed personas are still refused.
  - Forge (omp): declarations carry `spawns: "*"` and the extension refuses no spawn. A dispatch or launch whose assignment misfits is shown the agent's form and warned, and goes ahead; the lead's and builder's cut-state checks and a dispatch from `eval` code are warnings. The readback gate, the guards and their in-process model judge (`completeSimple`) are removed, as is the forced `schemaMode: "strict"`; a session hook's worker is fired once and its stdout read as its verdict. Projection no longer closes a practice over dispatch, and the tree no longer reports `guards`. `HarnessAdapter.nativeAgents`, `ComposedGuard` and the live omp scenario runner (`createOmpAgentScenarioRunner`) are removed.
  - Schema: `GuardCell`, `GuardJudge`, `Layout.guards` and `Agent.dispatches` are removed; `checkAssignment` reports its finding as `problem` (was `reason`).

## 0.9.1

### Patch Changes

- 9482980: The `line-worktree` hook is retired. It was the Claude Code `WorktreeCreate` hook that took over the harness's worktree creation to cut the implementer's worktree from the bound plan's line, and it no longer ships: the cell, its committed worker and its test are gone, and the practices that placed the implementer no longer list it. Nothing replaces it. The implementer keeps `isolation: worktree` on Claude Code and stays an isolated task on omp, so the isolation is the harness's own; Claude Code cuts that worktree as it cuts any, by its `worktree.baseRef`, and omp cuts its isolated copy from the dispatcher's HEAD. Starting from the plan's line is the implementer's own move, and `plan land` already refuses a commit not built off the line. A host that installed the hook loses it on its next install, by the deploy prune of registrations the render tree no longer carries. `Practice.hooks` and the `worktree.create` event stay as general plugin surfaces.

## 0.9.0

### Minor Changes

- 4c997d5: The implementer now starts in a git worktree of its own, cut from the tip of the bound plan's line, where its session used to begin in the operator's main checkout.

  `@cratylus/schema`'s `Agent` gains the optional `isolation?: 'worktree'`, carried on the identity face beside `holds` and `dispatches`, and `Practice` gains the optional `hooks`, the hook cells a practice registers beyond the guards its agents' compositions bind.

  `@cratylus/canon`'s `RoleCell` may state `isolation`, `holds` copies it to every holder of the role (a persona cannot state it), and only the implementer role does. The vocabulary gains `worktree.create`, the moment a worktree is made for an agent, and a new hook cell, `line-worktree`, is bound to it: while a plan is bound it creates the requested worktree on a new branch cut from the tip of that plan's line, which it asks the host `cratylus plan show` for and names nowhere itself; with no plan bound it creates the worktree as Claude Code would, from origin's default branch or, where the host's `worktree.baseRef` is `head`, from HEAD. A creation it cannot make, including one made while the runtime cannot say whether a plan is bound, exits non-zero with no path and no worktree, and never falls back to the main checkout. Worktrees it creates are kept on removal. Every practice that places the implementer lists the cell, so every install that places the implementer places it and uninstall removes its registration with the rest.

  `@cratylus/forge`'s `HarnessAdapter` gains the required `startsInWorktree`: claude answers yes, emits `isolation: worktree` in the front matter of an agent declaring it and nothing for one that does not, and binds `worktree.create` to `WorktreeCreate`; omp answers no, since its agent definition has no field that isolates an agent and it fires no worktree-creation event, so it emits nothing and projection warns once per declaring agent. Projection also warns, once per moment, of a hook bound to a moment the harness does not fire, and no longer stages the worker of a hook none of whose moments it fires, where it used to stage the file with no registration beside it. A chosen practice's `hooks` are registered with the plumbing.

## 0.8.1

### Patch Changes

- be25412: The package READMEs are rewritten for the author of a corpus or of a harness adapter, from the tree as it stands. Each says what its package is for and how its own surface is used, and links to `ARCHITECTURE.md` for what every package is for and to the `cratylus` README for what a consumer does. The forge README drops the install, launch, badge and uninstall detail the `cratylus` README holds and keeps the pipeline, the harness adapter port, the deploy placement table and the library surface. The schema README now spells a dimension's `repertoire` (its example said `kind`), names the `@cratylus/schema/hook` exports as they are, and covers the plugin declaration. The canon README no longer says canon takes `defineAgentPlugin` from forge, and describes the architect, planner, implementer, assayer and integrator agents as the generic holders of their roles and mav, nico and kino as personas over the architect role. No behaviour changes.

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
