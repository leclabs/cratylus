# @cratylus/invoke

## 0.21.1

### Patch Changes

- Updated dependencies [67df142]
- Updated dependencies [bbf86c0]
- Updated dependencies [c4c9c3a]
- Updated dependencies [f8414f7]
- Updated dependencies [00bf8c0]
- Updated dependencies [675f849]
- Updated dependencies [831743c]
- Updated dependencies [86a21e0]
- Updated dependencies [6bcc373]
- Updated dependencies [26544af]
  - @cratylus/canon@0.23.0
  - @cratylus/forge@0.21.0

## 0.21.0

### Minor Changes

- 87a0501: The `cratylus` command offers using cratylus only: `install`, `uninstall` and the capabilities (`model`, `versionSkew`). Its help, its no-argument output and its README list nothing else, and `install` always installs the canon the command is built with.

  BREAKING CHANGE: the commands `init`, `add`, `compose`, `project`, `deploy` (with `deploy --check`), `explain` and `catalog` are removed, and with them the `Corpus authoring:` help group; each is now refused as an unknown command. `cratylus.config.ts` is read by nothing: `install` no longer reads one from the working directory and always installs the bundled canon, refusing only when mounted with no canon at all. The `cratylus` package has no library entry any more, so `defineConfig` (and `CratylusConfig`) are gone from `cratylus` and from `@cratylus/forge`, together with forge's `./config`, `./deploy` and `./validate` subpaths (the config loader and scaffold, render-tree deploy and its drift check, `scaffoldProject`, `writeRenderTree`, the cold-read driver), and `@cratylus/forge/catalog` loses `enumerateCatalog`, `shortlex` and `CatalogEntry`. `projectorCommands` returns the two commands as one list and takes the canon as `canon`; `usageExitCode` is removed. `@cratylus/schema` drops the `deploy-bin` and `deploy-check-drift-code` projection facts and `SkillDeploy.assets`, which only the removed deploy read. `@cratylus/canon` no longer carries the `create-agent` and `create-skill` skills: the `cratylic-context-design` practice keeps its other skills, and an install no longer places those two. A project installation over an earlier render tree in `.cratylus/<harness>` is still refused: move that tree away, and install again.

- 9a8582e: `cratylus install` offers the `behaviour-driven-development` ruleset, first among the canon's rulesets and taken or left like every other. It holds one rule, `behaviour-driven-development-adopted`: "This project practises behaviour-driven development.", because the practice's name carries it whole, each role's participation included. Taken with `--rules behaviour-driven-development`, install places `rules/behaviour-driven-development-adopted.md`; without a terminal and without `--rules`, it places no rule and lists the six rulesets offered. `Rule.convention` is renamed `Rule.statement`.
- b023712: A capability's verb only reads and takes no arguments, which is all the two remaining capabilities use; the machinery for anything more is removed.

  - `@cratylus/runtime`: a verb's `effect` is `reads` alone (the `appends` effect is gone), and a verb's explanation is its `name`, `concept`, `purpose`, `when` and `effect`, with no `parameters` (`ParameterExplanation` and `ParameterSchema` are gone). The `./verb-flags` subpath is gone, and with it `Positional`, `Flags`, `Flag`, `ValueShape`, `valueFlag`, `switchFlag`, `spelled`, `Argv`, `readArgv`, `refused` and `nearest`; a verb's declaration is its purpose, beside the concept, when and effect it explains. Any token after a verb is refused by `verbOf`, in one line naming each token and the verb's `--help`; `--help`, `-h` and `--explain` are read as any token after the verb. A verb's help lists no arguments or flags.
  - `@cratylus/forge`: the omp extension's capability tools are all read-only (approval `read`); a tool takes a required `verb` of the capability's verbs, or nothing where the capability explains one verb alone, and a call runs `<bin> <capability> <verb>`.
  - `cratylus`: the README says a capability verb takes no arguments.

- 0df8f19: The domain model is plain files in `design/model/`, checked by the model check: `cratylus model check`, in omp the tool `model_check`. The command offers `install`, `uninstall` and exactly two capabilities, `model` and `versionSkew`; the runtime's `CAPABILITIES` and canon's `RUNTIME_CAPABILITIES` are `model` and `versionSkew`, and every capability tool only reads.

  - `@cratylus/runtime` exports from `.` the capabilities' explanations (`MODEL_CHECK`, `VERSION_SKEW`), `explain` and the command's self-description; `./runtime-config` holds the runtime configuration and the installation's root and scope. Its subpaths are `.`, `./main`, `./bin-name`, `./capability`, `./runtime-config` and `./package.json`.
  - A build projects the agents, skills and rules, and install places them, the extension and the installation record in the owned root, and nothing else.
  - The cratylus omp extension is emitted whenever the harness adapter has one (`HarnessAdapter.capabilitySurface`), and it alone carries the capabilities to the harness.

  BREAKING CHANGE: a script or import using a command, tool, export, subpath or installed file not listed above must drop it.

- 891d1b0: `cratylus install` installs every agent and skill of the canon, and offers the rulesets, whole or rule by rule. Run with no terminal and naming only the harness, it installs everything and is never refused for want of a choice. Its options are `--harness`, `--scope`, `--rules`, `--model-roles`, `--agent-status`, `--yes`, `--verbose`, `--dry-run` and `--home`.

  BREAKING CHANGE: `cratylus install` refuses any option not listed above; a script passing one must drop it.

- 6af2a28: The model check binds an example only to a test that can run, and refuses records it used to pass over. A test title only in a `//` or `/* */` comment binds nothing and names nothing missing (comments are blanked by a small scanner that keeps string, template and regular-expression literals whole, so `'http://x'` survives). A `.md` file in `design/model` other than `purpose.md`, a `<context>/context.md` or a `<context>/<concept>.md` — another file at the root, any file in a nested directory, an extension not in lower case — fails as a misplaced record, naming the file. An example's lines must be Given lines, then When lines, then Then lines, each run optionally going on in `And` lines, and nothing else; otherwise it fails, naming the concept and the example.
- 42049b7: The model check: `cratylus model check` checks the domain model, plain files in `design/model` of the repository holding the working directory, and binds each of its examples to the acceptance test that names it. A concept record is `<context>/<concept>.md`, its `# term`, its correction and optionally `## Examples` of `### <name>` (or `### <name> (judged in review)`) over Given, When and Then lines; an acceptance test is an `it(`/`test(` whose title is exactly `<context>/<concept>: <example name>`. It prints its report as JSON on stdout, `{model, passed, failures, warnings}`, and exits 1 when anything fails: a malformed record or context, an example no acceptance test names and not judged in review, or an acceptance test naming an example the model does not have. Implementation leakage in a record and history recounted in its correction are warnings, never failures. With no `design/model` it refuses on stderr. `cratylus model --explain` explains it, and the omp extension offers it as the tool `model_check`.

  `@cratylus/runtime`: `CAPABILITIES` and canon's `RUNTIME_CAPABILITIES` gain `model`; `@cratylus/runtime` exports `MODEL_CHECK`. The orientation starts with the business analyst (`omp --agent business-analyst`), and its theory points at the domain model of cratylic context design. The repository's `pnpm check` ends with the model check.

- 5c312bd: The model check holds each concept record to its form and each example to its acceptance test, and nothing more: its report is `{ "model", "passed", "failures" }`, its word-list warnings gone. A record's failures speak of its Cratylic name and precising definition (`has no # Cratylic name`, `has no precising definition`). Its explanation says where each example lives, in its concept's record in `design/model/`, written as given–when–then, and how its acceptance test, in the project's own test framework, is titled, `<context>/<concept>: <example name>`, unless it is marked judged in review. The command's orientation states the domain model's purpose: a team of AI agents in industry roles, installed into the agent harness you already use, holding your meaning in a living domain model written by Cratylic context design and realizing it by behaviour-driven development; its theory points at the context-engineering context.
- c18354e: The command describes itself, and every omp session knows from its start what cratylus is for and how using it starts. `@cratylus/runtime` holds the one text, `ORIENTATION` (of `PURPOSE`, `START` and `THEORY`): what cratylus is for, that using it starts by launching the business analyst with `omp --agent business-analyst` and saying what you want, and that its theory is cratylic context design, whose domain model is in cratylus's repository at `design/model/cratylic-context-design`.

  `cratylus --help` opens with what the command is for. `cratylus` with no arguments prints the three-line orientation and a line naming `cratylus --help` for everything else, on stdout, exit 0 (it printed the help on stderr and exited 1). `cratylus --explain` prints `{name, purpose, orientation}` as JSON.

  The cratylus omp extension runs the reached command's `--explain` once at load and appends its orientation, verbatim, right after omp's own system prompt in every session, launched or not, main or dispatched; a command that cannot explain itself adds nothing. The READMEs name the business analyst, by its command, as the way in.

- c82a25d: The seven skills of cratylic context design (conceptualize, elicit, exemplify, formalize, materialize, probe, signify) say in their descriptions what each is for and when to reach for it, in the pattern's own terms (term, Cratylic name, semantic gap, missing and spurious meaning, correction, cold read), with no notation and nothing of how cratylus builds them (decision 0334). Their bodies keep their procedures with the design's terms: signify's `residue(n,c)` is now `gap(n,c)`, the semantic gap of n for c read in κ(c) (missing meaning ∪ spurious meaning, cited `@ cratylic context design`), and `cratylic(c)`, the Cratylic name of c, is the term of smallest semantic gap; a concept enters a text as its term with `correction(c)`, its missing meaning stated and its spurious meaning stated denied, the term alone when the correction is empty; the cold-decode oracle is now the cold read, and a sign or signifier meaning a name is a term. Only what the design defines (the semantic gap, the correction, the cold read) is cited to it; exemplify's warm decode, `coldpass` and `K`, and probe's `K`, are the skills' own.

  Every concept is held to its Cratylic name, in a user's project as in cratylus's own: the limit to the core agent dimension names and values is gone from every body. signify's `dom(τ)` is every concept the text carries, a concept its domain already names takes that established term, found and never coined, its cold read confirming it, and a concept is no longer excluded for being outside that vocabulary; exemplify's `valid(k)` requires the cold pass of every piece, and its `core` is gone; formalize names every entity and operation by its term through signify. materialize writes a primitive concept as its term with its correction, the term alone where the correction is empty, never restating what the term carries, in place of the term with the concept's whole meaning; composites stay by reference.

  A term need not read exactly as its concept to name it. signify's `covers(n,c)` holds when n, read in κ(c), addresses c, so its gap can be closed by a correction supplying the missing meaning and excluding the spurious, without excluding n's core meaning. `Est(κ)` is the terms established in κ's domain. `cratylic(c)` is the established term covering c of smallest gap (then `|n|`, then n), so a coined name never beats an established one; a mint, which lies outside `Est(κ(c))`, only where no established term covers c, and the concept is excluded, logged, when no mint covers it either; `correction(c)` closes `gap(cratylic(c), c)`. A rejection binds a term that does not cover; the exact fit `circ` stays only in the misattribution law and nowhere selects a name. probe's `experiment(c)` narrows the candidates to those covering c read amid them, and `crystallize` settles `cratylic(c)` on the experiment's established covering candidate of smallest gap; a mint is settled through signify, never crystallized.

  The prime principle the skills open with states cratylism as the design holds it: names natural to the model, whose semantic space is the universe of discourse; each concept takes its Cratylic name, the term of smallest semantic gap read in its bounded context, which intuition proposes and a cold read confirms, found and never coined unless no established term covers it; its correction beside it, each side of the gap once; a kept name short of it recorded as such. It no longer cites the residue or the oracle, nor scopes itself to the corpus's core agent dimension names and values. The canon README says the same.

- 4958b21: The person cratylus serves is called the product owner everywhere, never the operator: in the elicit skill, the `install` help and refusals, the READMEs and the code's comments.

  **Breaking.** The canon's lifecycle moment `operator.consult.pre` is now `product-owner.consult.pre`, and `@cratylus/forge`'s exported omp bindings (`canonicalActToOmp`, `ompBindingOf`) know it only by the new name. A hook bound to `operator.consult.pre` must now name `product-owner.consult.pre`.

### Patch Changes

- 12a55a5: `cratylus install`'s help and the `cratylus` README name what install places in the design's terms: the canon cratylus ships, its agents, skills and rules, where they said "the bundled corpus". The command hands forge's install the canon as `canon`.
- 7fd4af9: READMEs and source comments cite the standing decisions by their records in `design/decisions/`, by file name.
- 9a8582e: Bind the departures-only domain model to acceptance tests of the packed command: install offers behaviour-driven development and adopts it by name when chosen, installs every agent and skill unattended, and checks example bindings with a report of the model, its verdict and its failures. Remove acceptance tests for retired examples.
- 23826e9: The READMEs document the domain model as plain files in `design/model`, one per concept, and the model check (`cratylus model check`, the tool `model_check`) that binds every example to its acceptance test.
- 3442096: `cratylus --help` shows each capability's usage as `<capability> <verb>`.
- 53f1bba: nico's expertise is terminology work as cratylic context design practises it, finding each concept's Cratylic name, its correction beside it, in the bounded contexts it is given. The canon README names the discipline cratylic context design, and the package keywords say `cratylic-context-design`.
- 1045204: `cratylus --explain` given with any other word (`cratylus --explain install`, `cratylus --version --explain`) is refused as a usage error, one stderr line and exit 1, running nothing. The `cratylus` package describes itself with the command's purpose, and the READMEs say that `cratylus` with no arguments prints how to start, without restating the orientation.
- Updated dependencies [41c216f]
- Updated dependencies [41c216f]
- Updated dependencies [86b9f42]
- Updated dependencies [a59e469]
- Updated dependencies [87a0501]
- Updated dependencies [9a8582e]
- Updated dependencies [85e6484]
- Updated dependencies [0f98ee3]
- Updated dependencies [2e59765]
- Updated dependencies [2e91395]
- Updated dependencies [fb58bf7]
- Updated dependencies [c21bbed]
- Updated dependencies [b023712]
- Updated dependencies [1c51eec]
- Updated dependencies [0df8f19]
- Updated dependencies [7fd4af9]
- Updated dependencies [23826e9]
- Updated dependencies [9b36a76]
- Updated dependencies [fee3ce2]
- Updated dependencies [ff7723e]
- Updated dependencies [56385af]
- Updated dependencies [6af2a28]
- Updated dependencies [42049b7]
- Updated dependencies [5c312bd]
- Updated dependencies [c18354e]
- Updated dependencies [53f1bba]
- Updated dependencies [c82a25d]
- Updated dependencies [81e83bc]
- Updated dependencies [b8158fc]
- Updated dependencies [4958b21]
- Updated dependencies [e712ceb]
- Updated dependencies [a1abdda]
- Updated dependencies [34268dc]
- Updated dependencies [edfae61]
- Updated dependencies [54989e1]
  - @cratylus/forge@0.20.0
  - @cratylus/canon@0.22.0
  - @cratylus/runtime@0.20.0

## 0.20.0

### Minor Changes

- 4f46ebd: `cratylus install` and `cratylus uninstall` take `--scope user|project`. User, the default, is the installation you had. Project places everything inside the project you are in: the owned root at `<project>/.cratylus/omp`, and relative references in `<project>/.omp/plugins`: a link, a `file:` dependency, and a `.gitignore` block that keeps the link committable. The block is appended whole after your own lines, and uninstall takes back only the block. Commit them and your team shares the installation. In that project omp loads it in place of your user installation, and its session hooks run its own workers, which are named relative to the installation. A project install writes nothing under your home directory. It reads and writes model roles and the status-line choice in `<project>/.omp/config.yml`. On a terminal, install asks which scope you want when you are outside your home directory and gave no `--scope`, with user preselected. `installation.json` now records its `scope`. Install refuses to place a project root over an author's render tree, and `cratylus project` refuses to render into an installation.
- 6af4f18: The concept journal closes its books as event sourcing does. `cratylus concepts close`, and the concept journal tool built from the capability's explanation, opens a new period with one opening entry per current version of each standing item, written at one moment past every entry the journal holds and in the order the readings list them: the project's purpose, each context with its `identity`, each live concept as a `define`, and each standing decision as a `decide`, accepted where it is accepted and with its governing kind where one is recorded. Each opening is an ordinary entry of its item's kind, superseding nothing and carrying `broughtForward`, the full sha of the commit at HEAD that holds the closed period; competing versions each open as an entry of their own, so they still compete. Retired concepts, superseded or deprecated decisions, acceptances, classifications, a cut's efficiency figures, and the cut or example files (`keeps`) a legacy decision's entry recorded stay in the closed period. The close then removes every other entry file, kept by version control at that commit, and prints the commit with how many openings it wrote and how many files it removed. Every reading reads the directory's entries and nothing else, so `state` and `design` answer the same after a close as before, and `decisions` gives each standing decision the same meaning and status, its `entry` renewed as its opening's id; `history`, `design --history` and `decisions --history` carry `booksClosed`, `{ "at", "by", "commit" }`, and mark each opening they list `broughtForward`. A context's identity is the `identity` its earliest entry carrying one carries, else its earliest entry's id, and a journal owns a delivered context whose identity is one of its contexts'. A line of work that branched before a close joins it as recorded: a version superseding versions the journal no longer holds competes with its item's opening, and an acceptance, deprecation or supersession naming a decision entry it no longer holds binds by the decision's name where one decision has it. A concept retired before a close returns by `define`. A close refuses, changing nothing, outside a repository or without a commit at HEAD, while `design/journal` differs from HEAD's tree in anything, an ignored file included, while it reads past entries of a newer runtime, when the journal holds no entry, and when it holds nothing but opening entries; where writing an opening or removing a file fails, it restores the journal from HEAD and removes the openings it wrote. The verb's explanation gains the effect `closes`, which the omp tool approves as a write.
- 8bf49a6: A project installation binds no models. It is shared through the project, and a tier's model is each operator's own setting, so `cratylus install --scope project` no longer asks for a model or writes a `modelRoles` entry, in the project's `.omp/config.yml` or anywhere else, and `--model-roles` with `--scope project` is refused, naming `cratylus install --scope user --model-roles …` instead. It reads, without writing, the project's settings and your own, and names as your next step each tier the agents fall back to that neither binds, to bind in your own settings. The status line choice at project scope is unchanged. `cratylus uninstall --scope project` now also removes the project's `.omp/` where install created it and it is left empty; an `.omp/` that was there before install stays. A user installation asks and binds models as before.

  At project scope those settings are read in any layout omp reads (block or flow YAML, or JSON), so a tier bound in a layout install would not edit is never named as unbound.

- 38a1e0d: A project installation writes no operator's own setting. Besides binding no models, `cratylus install --scope project` no longer asks whether the status line shows the session's agent and writes nothing about the status line, in the project's `.omp/config.yml` or anywhere else, and `--agent-status` with `--scope project` is refused, naming `cratylus install --scope user --agent-status <show|hide>` instead. It reads, without writing, the project's settings over your own (a key set to null counting as unset), and where they hide the session's agent names how to show it as your next step: the project's own `statusLine` keys that hide it, to change in the project's `.omp/config.yml`, or, where your settings alone hide it, `cratylus install --scope user --agent-status show` (or, where your user installation already recorded that answer, which a user install never applies again, the keys in your own `~/.omp/agent/config.yml` to change there). A user installation asks and writes the status line choice as before.
- 23423e2: Version skew names the installation in use. The warning at every omp session start says whether the skewed installation is the user's or a project's, and its root, with the remedy for that scope: `cratylus install --harness omp --scope user` for the user's, `cratylus install --harness omp --scope project`, run in that project, for a project's. `versionSkew report` and the `version_skew` tool report `scope` beside the root. The scope is read from the installation's `installation.json`; a record without one is a user installation. Run inside a project with a project installation, the operator's own `cratylus` reads that installation, as omp does; `$CRATYLUS_INSTALLATION` still wins, and a `.cratylus/` tree without an installation record is never one.

### Patch Changes

- ab70588: The command's README, help and package description describe omp as the only harness, and the README documents the two installation scopes: `--scope user|project` on install and uninstall, how the project is found, the project's root `<project>/.cratylus/omp` and its relative references in `<project>/.omp/plugins`, committing `.cratylus/omp` and `.omp/` to share an installation with a team, the project's `.omp/config.yml` for model roles and the status line, and upgrading or uninstalling either scope without touching the other. The repository README mentions the project scope.
- Updated dependencies [a3bc415]
- Updated dependencies [4f46ebd]
- Updated dependencies [6af4f18]
- Updated dependencies [8bf49a6]
- Updated dependencies [38a1e0d]
- Updated dependencies [23423e2]
  - @cratylus/canon@0.21.0
  - @cratylus/forge@0.19.0
  - @cratylus/runtime@0.19.0

## 0.19.0

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

- beffc2c: `cratylus install` offers the corpus's rulesets: on a terminal each is taken whole, rule by rule, or not at all, and `--rules <ruleset-or-rule,…|none>` settles it instead. None is the default. The choice is recorded by rule name in the owned root's `installation.json`, and installing again keeps it without asking unless `--rules` says otherwise; a rule no longer offered is dropped and named. The summary names the rules placed, and uninstall removes them with the owned root.
- cf853ad: Each agent's text states what it is and does, once and positively; no instruction carries a countermeasure against a failure never seen in use.

  - Canon rewords the architect's role and the `reconstitution` procedure and memory, `source-of-truth`, `honesty`, `decisive`, `conceptual-elevation`, `layman`, `bottom-line-up-front` and `read-back` values. The architect drops its role and reconstitution notes, takes a new `rectify` note, and holds `decisive`, `conceptual-elevation` and `bottom-line-up-front` at their factors' default level rather than fixed.
  - Canon rewords the lead, reviewer, builder and check-writer roles, the `no-implementation`, `append-only`, `never-repairs`, `fixed-acceptance-criteria`, `input-untrusted` and `privacy` guardrails, the `orchestrator-workers` procedure and `management-by-exception` autonomy, each as what it does and who does what it leaves; the reviewer's description and held-out-examples notes, the lead's `ship-show-ask` note and the architect's `read-back` note say the same positively, and the lead drops its `decisive` note. No factor's default level is `fixed` any more, so no agent's text carries "(fixed)".
  - The concept journal presents `design` as the read that recovers the design at a session's start, with `state` as its short summary, and its record as beginning at the journal's start.
  - The persona Protocol is removed: canon no longer exports `personaProtocol`, `Agent` loses `persistence`, and an agent declaration no longer ends with a `## Protocol` section. Persona drift is judged by the operator in real use.
  - The omp extension no longer adds the session-start reconstitution note, the "Meaning: yours" note or "The records" note to a launched session's prompt; every turn still carries the assignment forms.

### Patch Changes

- a33be54: The concept journal is the only home of cratylus's conceptual model, and INTRODUCTION.md is its entry point. The five static root documents (canon, vision, model, engine and architecture) are deleted, and no README or source comment points at them any longer. The repository's `AGENTS.md` is now a plain hand-authored file that sends a session to INTRODUCTION.md and the concept journal; canon's `repo-preamble` rule cell, its projection to `AGENTS.md` and the byte-lock that held them equal are removed, so `project:targets` regenerates hook targets only. The ground-conformance gate, which read the model document, is removed, and the cratylism gate no longer looks for those document names.
- Updated dependencies [4c85b6e]
- Updated dependencies [a33be54]
- Updated dependencies [beffc2c]
- Updated dependencies [cf853ad]
- Updated dependencies [ef043a5]
- Updated dependencies [22c6a6c]
- Updated dependencies [c6289da]
- Updated dependencies [98c6546]
- Updated dependencies [a19139a]
  - @cratylus/canon@0.20.0
  - @cratylus/forge@0.18.0
  - @cratylus/runtime@0.18.0

## 0.18.0

### Minor Changes

- 0fb5973: The concept journal gives the design state alone (decision 0294). `cratylus concepts state` answers only `purpose` (and `competingPurposes` while they compete), the delivered `practice` apart, and per context its `name`, `subject`, `relation`, `competingDescriptions` only when any, `concepts`, each live concept as one line `"<name> ≜ <residue>"`, and `competing`, `[{ "name", "versions" }]`, each version such a line or `"<name> retired"`. It no longer carries the `reading` legend, decisions, `builtFrom`, reasons or recorded effort, and takes no `--history`.

  `concepts overview` is gone, with its prose account, and is refused as an unknown verb; read `state` instead. `concepts design` is unchanged: each context's live concepts with their wording and `builtFrom`, and with `--history` the retired concepts and reasons.

  Decisions record realization only. `concepts decide` takes no `--kind` and marks every new decision `"decisionKind": "realization"`; `concepts classify` is gone and refused as an unknown verb. Standing decisions are read with `concepts decisions` alone. `concepts leakage` inspects concept wordings, context descriptions and examples, never a decision, and takes no `--history`; `decide` never carries `warnings`.

  The effort recorded for past work (`efficiency`) is read with a context's own history: `concepts history --context <name>` without a concept carries it. Entries already recorded, decisions with a kind, classifications and efficiency entries, are still read as recorded; `decisions --history` keeps each decision's `kinds`.

  The journal's explanation and every verb's purpose speak of the design state: a session reads the design state of the delivered practice and of each context its work touches first, then the standing decisions its work needs.

  The capabilities speak of the concepts by their established names (decision 0296). `concepts state` and `concepts design` act on the `conceptual model` (no longer `conceptual design`), and the journal's summary, `when` and the `design` purpose say conceptual model; the version skew summary, and the help of `install`, `uninstall`, `project` and `deploy`, say agent harness. The `cratylus` and `@cratylus/runtime` READMEs follow: agent harness, agent definition, code review, version history, and `design/examples/<context>/<user-story>.md`. Every verb of every capability acts on a concept live in cratylus's own journal.

  The journal's explanation follows the restated concepts (decision 0296): `concepts leakage` and `concepts purpose` act on the `event-sourced conceptual model`, while the capability keeps its name, `concept journal`. The right side of `name ≜ …` is the concept's residue (decision 0302), what the concept means that its name, read in its bounded context, does not invoke and what the name invokes that the concept does not have: the journal's summary, the `state` and `leakage` purposes, the `--wording` description of `define` and `supersede`, the refusal of a missing `--wording` and both READMEs say so; the `--wording` flag and the `wording` field keep their names.

### Patch Changes

- Updated dependencies [21ad8b1]
- Updated dependencies [95f122e]
- Updated dependencies [0fb5973]
- Updated dependencies [09a8b23]
- Updated dependencies [0e7e3be]
  - @cratylus/canon@0.19.0
  - @cratylus/forge@0.17.1
  - @cratylus/runtime@0.17.0

## 0.17.0

### Minor Changes

- f297ff5: The documents describe intent-based delegation. The repository's working conventions (`AGENTS.md`, the `repo-preamble` rule) follow Git flow's `dev`/`main` split, without release or hotfix branches: each change is made on a short-lived branch from `dev` and merged locally into `dev` once `pnpm check` passes on the merged result, and release, a pull request from `dev` into `main`, is the operator's. The runtime's README names its two capabilities, `concepts` and `versionSkew`; forge's README tells the omp extension's handover forms, warned when incomplete and never refused; the `cratylus` README's practice example is `intent-based-delegation`.
- 7fe2da4: The concept journal states and serves only the live workflow.

  `concepts decide` no longer takes `--cut`: a decision stands until a later decision supersedes it or a later `deprecate` entry deprecates it. `concepts leakage` reads every example file present, with or without `--history`.

  Entries already recorded are read as they were written: a decision whose entry names a cut is read by its own status alone, and the recorded `cut` is shown only with `--history`. The `efficiency` entries recorded for cuts are past effort, shown by `concepts state` only with `--history`; no verb writes them.

  Every verb's purpose, when and parameter text, and the `state` reading's legend, name the live workflow only.

- d0350f9: Cratylus keeps no record of the work. What is in flight and how it ended is seen in the project's version control and the lead's outcomes; what it cost is what the harness records and the outcome reports. The concept journal is the project's one record of its own, and it holds the design alone.

  Removed: the work package capability (`cratylus workPackage`, its verbs, its dependency graph, freeze, rounds, whole-check runs, integration and `record`) from `CAPABILITIES`, `RUNTIME_CAPABILITIES` and omp's offered tools, with nothing in its place, so the runtime's capabilities are `concepts` and `versionSkew`, and an installation upgraded from an earlier one no longer offers its tool; the harness-facing `cratylus lifecycle` command and `appendLifecycle`; the completion check (`cratylus completion-check`, its `post-commit` hook and `completionCheck`/`WATCHED`); the example substrate (`@cratylus/runtime/example-substrate`), which nothing live used; the `@dagrejs/graphlib` dependency; and the cut API the runtime barrel exported (`cutView`, `cutsInLedger`, `frozenCuts`, `foldCut`, `readCut` and their types). Nothing is migrated from the files the capability kept, and nothing reads them.

  The concept journal's views read only the journal and the example files. The overview no longer tells work in flight (`cutsInFlight` and its line are gone), `define`, `supersede` and `retire` no longer warn of a freeze, and a decision recorded about a cut is read by its own status alone. `concepts state` gives a context's recorded cut `efficiency` only with `--history`.

  The reconstitution procedure and the omp session-start and per-turn notes say a session sees the work in flight and how it ended in the project's version control and the lead's outcomes; the lead's outcome states its cost as the harness records it.

### Patch Changes

- Updated dependencies [7763b8f]
- Updated dependencies [4a2d9e4]
- Updated dependencies [f85330b]
- Updated dependencies [f297ff5]
- Updated dependencies [1147440]
- Updated dependencies [0611941]
- Updated dependencies [2297534]
- Updated dependencies [7fe2da4]
- Updated dependencies [df2780c]
- Updated dependencies [d0350f9]
  - @cratylus/canon@0.18.0
  - @cratylus/forge@0.17.0
  - @cratylus/runtime@0.16.0

## 0.16.0

### Minor Changes

- feea599: The delivered practice is shown apart from a project's design (decision 0220). `concepts overview`, `state` and `design` list under `contexts` only the project's own bounded contexts, its design and its context map; each context the installation delivers (`cratylus:workflow`) is shown apart, under `practice: { about, contexts }`, labelled as the practice the project's agents work by and placed before `contexts` so a fresh session still reads it first. Its overview's account says it is not part of the project's design and tells its relation in its origin's context map, never the project's; in `state` it carries no empty `decisions` or `efficiency`. A journal holding the delivered context itself, by the entry that first recorded it, reads its own among its `contexts`, as part of its design, and shows no `practice`.

  Every view shows a decision by what it says first: `decisions` leads each with its `title`, its `id` and `entry` last as references; `state` lists them by `title`, `kind`, `id` and `entry`; `overview` gives open ones as `{ title, id }` and tells them as `“<title>” (decision <id>)`; and `leakage` names a decision's passage by its `title` as well as its context and id. The omp session-start note says the delivered workflow is shown apart from the project's design and never part of it.

### Patch Changes

- Updated dependencies [feea599]
  - @cratylus/runtime@0.15.0
  - @cratylus/forge@0.16.2
  - @cratylus/canon@0.17.0

## 0.15.0

### Minor Changes

- 3f13825: The concept journal warns, and never refuses, where a wording tells more than what holds now. A live concept's wording and a context's current subject and relation are warned where they cite a decision by its number (rule `cites a decision`), recount their history, what changed or what something used to be or no longer is (`recounts history`), or only extend the version they replace, keeping its wording whole and adding to it (`only extends the version it replaces`, the words being what was added). The warnings show in `concepts leakage` and in the answer of `concepts context`, `define` and `supersede`; a context's description is named as the passage `{ "kind": "context", "context", "field": "subject" | "relation" }`.

### Patch Changes

- Updated dependencies [3f13825]
  - @cratylus/runtime@0.14.0
  - @cratylus/canon@0.17.0
  - @cratylus/forge@0.16.1

## 0.14.0

### Minor Changes

- af1e269: The architect explores, then converges (decision 0203).

  The architect's bottom-line-up-front ordering now applies when work needs a decision: the conclusion first, then at most one recommended action per topic, then only the support a layman needs. When the operator is exploring, the architect explores too: it lays out the options with their trade-offs and still says which it recommends, and it asks the operator what only the operator can answer. It never offers options without a recommendation.

  Every agent's drift tells change to match: the "menu" tell (options offered where the stance owns one recommendation) is now "unrecommended options", options offered without a recommendation.

- 1c7c41d: The record's views show what stands, assayers' verdicts are recorded, and a development build says its commit (decision 0212).

  - **Deprecation.** `concepts deprecate <id> --reason` records that a standing decision no longer applies and has no replacement. `concepts decide --cut <name>` names the cut a decision is about; once the ledger records that cut integrated, the decision reads as deprecated with no entry. `decide --keeps <context>/<cut>` keeps that cut's example file standing past its integration.
  - **Views show what stands.** `concepts decisions` lists only standing decisions (open or accepted); `concepts state` lists them by entry, id, title and kind, their whole text being the decisions reading's; `concepts overview` tells only standing open ones; `concepts leakage` reads only standing decisions and the examples of cuts not integrated, or kept. `--history` on `decisions`, `state` and `leakage` adds every superseded and deprecated decision, each with what replaced it or why it no longer applies, and the examples that are history.
  - **Verdicts.** The omp extension now records an assayer's verdict, and a lead's report, when the deliverable comes back as text: whole JSON, or the last fenced JSON block after prose, and for a background item from its `.md` output when no `.json` one exists. Judged work shows approved or failing, not only returned.
  - **Build identity.** A `cratylus` run from the source tree it was built in reports its version with the commit it was built from as build metadata (`0.13.0+62c7b190`, `.modified` when built from uncommitted changes), in `cratylus --version` and so in `versionSkew report`; a release installed as a package reports its version alone.

- 747e8bc: A project's record states its purpose, read first, and the architect writes for the operator in plain words (decisions 0215, 0216).

  - **The project's purpose.** `cratylus concepts purpose --statement '…'` records what the project is for, in plain words; `--reason '…'` with a new statement changes it, superseding the current one, the way a context's description changes. `concepts overview` and `concepts state` show it first, as `purpose`, before any context (`null` until one is recorded); purposes recorded differently on two branches are listed under `competingPurposes` until a later one with a reason settles them.
  - **Plain words for the operator.** The architect's register is now `layman`: everything it writes for the operator, replies and documents alike, is in plain words for a layman, at the level of meaning. It explains in its own words rather than quoting the record, names a decision or concept by what it says and never by its number in the record, and leaves out history and mechanics unless asked.

- 17266c3: The record's default views show only what stands; history only with `--history` (decision "The record shows only what holds").

  - **`concepts state`** no longer lists retired concepts, the reason each live concept's version was written, or the effort of finished cuts (work complete or integrated) or of cuts the ledger does not record; its `efficiency` gives only the cuts the ledger records not yet finished. `--history` adds them all back.
  - **`concepts design`** no longer lists retired concepts or each live concept's `reason`, and takes `--history` to add them.
  - **`concepts decisions`** gives each standing decision with its governing `kind` only: `supersedes`, `supersededBy` and `kinds` (every kind recorded) are history, given with `--history`.
  - `overview`, `leakage`, `history` and the ledger's views are unchanged: `overview` already tells only live concepts, open decisions and cuts in flight, `leakage` already reads only what stands, `history` is history asked for, and every ledger view but `frozen` (cuts not integrated) answers about the one cut it is asked for.

- c1eb6c8: cratylus delivers its own workflow context to every project (decision 0207).

  The `cratylus` package's build projects the repository's `workflow` context from its concept journal — the current subject and relation and every live concept at its current meaning, with no history, decisions or retired concepts — with origin `cratylus` and the package's version. `install` and `deploy` place it read-only in the owned root as `delivered/cratylus/workflow.json`; upgrading replaces it and uninstalling removes it with the root.

  `@cratylus/runtime` exports `deliverContext({ from, context, origin, version })`, the projection. `cratylus concepts overview`, `state` and `design` show each delivered context of the installation the command reaches beside the project's own, as `cratylus:workflow`, carrying `delivered: { origin, version, context, identity }` and `readOnly: true`, unless the project's journal holds a context entry with that identity. Its history has no versions, only its current meaning; it has no decisions. Recording into it is refused as read-only and nothing is written; reading never creates the journal. `dispatchConcepts` called as a library sees delivered contexts only when handed them.

### Patch Changes

- 889c765: Work dispatched outside any cut is no longer recorded in the ledger as a cut (decision 0201, item 5).

  The ledger now records a harness lifecycle event (`dispatched`, `returned`, `verdict`, `reported`) only for a cut opened in it. A dispatch whose assignment names no opened cut, such as ordinary engineering under decision 0202, records nothing, and the dispatch goes ahead as before.

- 6a8425c: `cratylus concepts overview` gives each concept once, in its prose account.

  The overview no longer repeats every concept as a structured `concepts` list beside the account, which doubled its size: the overview of all of a project's contexts now fits in one read. Each context's overview keeps its `subject`, `relation`, `cycles`, `openDecisions` and `cutsInFlight`, and its `account` still tells each live concept, whole before its parts, with its current meaning and the concepts it is built from.

- Updated dependencies [af1e269]
- Updated dependencies [1c7c41d]
- Updated dependencies [889c765]
- Updated dependencies [6a8425c]
- Updated dependencies [747e8bc]
- Updated dependencies [17266c3]
- Updated dependencies [c1eb6c8]
- Updated dependencies [159b278]
  - @cratylus/canon@0.17.0
  - @cratylus/runtime@0.13.0
  - @cratylus/forge@0.16.0

## 0.13.0

### Minor Changes

- e7367b6: The architect decides meaning only, and realization is the lead's (decision 0160).

  The architect agent no longer holds decisions on realization or check rulings: both are now "has no part". It still names a cut's scope and feature branch, but the lead checks the branch out. The architect accepts that a cut realized its meaning, and the lead merges it.

  The lead agent now decides realization, decisions on realization and check rulings. It checks out the cut's branch, owns the checks that bind the examples, makes and records every technical decision, settles the operator's open recommendations, and merges the cut once the architect has accepted it. It can also add entries to the concept journal, which is where it records its decisions.

  The `workPackage` capability's `frozen`, `open` and `freeze` verbs now explain the freeze this way: the illustrator writes a cut's examples before they are approved; from then until the cut is integrated, only the architect changes its examples and concepts, and only the lead and its check-writer write and change its checks.

- 881db80: A cut's phase reads `integrated` once its integration is recorded, whatever its work packages' statuses, which stay as recorded. Before, an integrated cut read `open`, `in flight` or `complete` from its packages alone. `workPackage state` answers `phase: 'integrated'`, `concepts overview` no longer lists an integrated cut among the cuts in flight, and the post-commit completion check stays silent for a `feat(cut:<name>): ` commit whose cut is integrated. No ledger entry is added or changed: every integration already recorded reads integrated.

  The concepts capability's `leakage` verb now serves the concept `concept journal` (decision 0158), and its explanation names that concept.

### Patch Changes

- 409c06f: The record gate is gone (decision 0153). `@cratylus/runtime` no longer has the `immutability-gate` script or module, and no hook or CI step refuses a change to existing records under `records/`, `design/journal/` or `design/ledger/`; history is controlled by pull-request review. The concept journal and the ledger stay append-only because their verbs only append.
- Updated dependencies [e7367b6]
- Updated dependencies [881db80]
- Updated dependencies [409c06f]
  - @cratylus/canon@0.16.0
  - @cratylus/runtime@0.12.0
  - @cratylus/forge@0.15.1

## 0.12.0

### Minor Changes

- 8964765: An omp agent declaration now carries an agent's reach and model as omp settings. The front matter is `name`, `description`, `mark` (only with one), `key: null` (reserved for ipseic agents), `model: "@<name>"`, `spawns` and `tools`, then `autoloadSkills` (only with skills). `spawns` lists the agent's handoffs, with the researcher mapped to omp's own `scout`. It is `""` for an agent that hands off to no one and absent where handoffs are undeclared. `tools` is `[read, grep, glob, find, ast_grep, web_search]`, written only for an agent that has no tool that changes anything. Every other agent keeps omp's default tools.

  `cratylus install --harness omp` binds each agent's own model role in the host's `modelRoles`: `<name>: "@<tier>:<effort>"`, plus each tier the agents use as a role named for the tier. A tier role is seeded when absent: `frontier` from the host's `default`, `fast` from `smol`, and `frontier-other-family` from the first entry whose provider differs from the frontier's, each with its thinking level dropped. A tier that cannot be seeded is left out, and install says so. An entry the host set is never changed. An entry install seeded follows what install would seed now, so a changed effort moves it. `--model-roles` keys by agent name and refuses a name no installed agent has. A `config.yml` written as one JSON document is edited too, where writing it back reproduces its bytes. Uninstall takes the entries out again.

  Nothing is placed under `~/.omp/agent/personas/` any more. The next install prunes the per-agent guardrail, session and isolation modules an earlier install recorded there, and uninstall removes them. omp cannot narrow a guard to one agent, so an enforcing value bound to agents is reported by projection as unscopable on omp and is not emitted. The session hook and dispatch isolation modules are placed once, in `~/.omp/agent/extensions/`. The canon's `deploy-drift-notice` target names omp's `extensions/cratylus-session.ts` as the harness hook file.

  **Breaking for `@cratylus/forge` consumers.** `RoleRouting` is now `{ configRels, agentRole, seedTier }`; `defaultRole`, `nearest` and `offered` are removed. `HarnessAdapter` gains `nativeAgents`. Removed from the omp adapter: `OMP_PERSONA_DIR`, `OMP_GUARDRAIL_MODULE`, `ompGuardrailExtensions` and its `enforcingSurface`. `ompScopeActivatedExtensions(hooks)` no longer takes agent names. omp's `scopedRel` refuses an agent scope. `RoleQuestion.holders` is removed. `AddModelRolesResult` gains `host` (the host's entries in file order), and `RetargetedModelRole` is now `{ role, value, line? }`. `noteHostRoutes` takes the seeded roles with their values, recorded in the manifest's new `modelRoleSeeds`. New exports: `OMP_NATIVE_AGENTS`, `OMP_READ_ONLY_TOOLS`.

- 4b34740: Add the `concepts` capability, the concept journal: `cratylus concepts` keeps each bounded context's concepts and decisions as an append-only journal in `design/journal` (one file per entry, merging across branches as the union of their files), appended through `context`, `define`, `supersede`, `retire`, `decide` and `accept`, and read through `state`, `design`, `history` and `decisions`. What merged branches recorded is kept, never chosen between: competing versions of a concept, and competing descriptions of a context (`competingDescriptions`), are reported until a later entry settles them; two decisions recorded under one id are both kept, each identified by its `entry`, which `accept` and `--supersedes` take where the id is shared; superseding a retired concept brings it back. The immutability gate now also refuses any edit, deletion, rename or type change under `design/journal`.
- 19e525c: A bounded context's subject and its place in the context map now change the way a concept does (decision 0056), with no new verb: a reason marks a change. `cratylus concepts context <context> --subject <s>` still records a new context, and refuses one already recorded, pointing to `--reason`; `cratylus concepts context <context> --reason <why>` with `--subject`, `--relation` or both records a new description of a recorded context that supersedes the current one (all of them while merged branches compete, which settles them), carrying over a field left out. A change never creates a context: a name the journal does not have is refused, and every refusal appends nothing. `cratylus concepts history --context <context>`, given no concept, prints the context's own history, `{ context, versions }`, every description in the order recorded with its reason and what it supersedes; `state` and `design` still show only the current description. The concept positional of `history` is now optional: its help prints `[concept]` and `--explain` gives it `required: false`.
- 96c2945: Install places everything under one owned root, `~/.cratylus/<harness>/` (decision 0108).
  For omp the root is an extension package (`agents/`, `skills/`, `extensions/cratylus.ts`,
  hook workers, and a `package.json` recording the cratylus version that projected it),
  linked into omp's plugin directory as `omp plugin link` would, so every project of the
  user is offered it and no host file is overwritten. Installing again replaces the root
  whole (upgrade); an earlier installation on omp's own surfaces, the event tap's skill
  included, is taken back by its deploy record, what it placed before it recorded digests
  included (decision 0114), save the `modelRoles` entries it seeded, which stay in the
  host's config as the host's own. `cratylus uninstall --harness omp [--home <dir>]`
  removes the root and every reference into it, found from where each points, so none is
  left dangling when the root or its record was edited or removed. Agent declarations name
  their own model role first, then their tier and effort (decision 0111), and are never
  rewritten with a model. Which model a tier or a persona's role runs on is the operator's
  choice and the host's own setting (decision 0112): install asks for each the host does
  not bind (or takes `--model-roles <role=model,…|default>`, keyed by tier or agent) and
  writes the answer into `~/.omp/agent/config.yml` as an ordinary `modelRoles` entry,
  recorded nowhere as cratylus's, so upgrade and uninstall keep it. A run that is neither
  told nor able to ask places everything else and names, as the next step, each tier the
  agents fall back to that the host does not bind. Whether omp's status line shows the session's agent, where the host hides it, is the
  operator's choice the same way (decision 0113): asked, or `--agent-status show|hide`,
  written as the host's own setting and never applied again. Install and upgrade leave a
  reference place the host has redirected or replaced, and say what to do. The new `versionSkew` capability
  (`version_skew` in omp) reports the projecting and the reached cratylus versions, and
  every omp session start warns when they differ, whichever is older, comparing the
  version the root records with the command's own `--version`; a command lacking a
  capability the installation expects is named in the warning, and the rest still load. `deploy --scope user` goes through the
  same owned root.
  A session started in an omp process that still runs an extension the installation has
  since replaced says so and asks for a restart; dispatch checks and ledger capture know a
  dispatch by its items, never by the name the harness gives its dispatch tool.
- a4fb154: Retire the event tap from what cratylus delivers (decision 0108). `cratylus eventTap` is gone and is refused as an unknown command; the runtime's capability keyspace (`CAPABILITIES`) and canon's `RUNTIME_CAPABILITIES` are `concepts` and `workPackage`, and both explain themselves. `@cratylus/runtime` no longer exports the `./events`, `./ports/event-tap` and `./capabilities/event-tap` subpaths, nor `EventName` and the `EventTapHost` port from its `.` barrel. The host runtime config reader carries only each capability's configuration: the lifecycle vocabulary (`events`) and the per-harness native names (`harnesses`), with `nativeEventsOf` and `nativeActsOf`, served only the tap and are removed. Canon no longer ships the `event-tap` skill or installs it as plumbing, so no projection carries its skill or `scripts/eventTap.mjs` shim, and forge's projection no longer warns about the tap on a harness without a tap strategy.
- 50f14f9: The concept journal and the work package ledger can now be read by a runtime older than the entries they hold. An entry of a kind the runtime does not know (one written by a newer runtime) is skipped instead of refusing the whole ledger. So is a journal entry of a known kind holding a value the runtime does not know: a newer decision status (`decide` with `status: deferred`), or a newer decision kind on `decide` or `classify` (`decisionKind: policy`). Every reading is worked out from the remaining entries as before: the journal's `concepts overview`, `state`, `design`, `history`, `decisions` and `leakage`, and the ledger's `workPackage state`, `inventory`, `assignment`, `levels`, `history` and `efficiency`. Its answer then also carries `uninterpreted`, with:

  - `kinds`: each skipped kind with how many entries of it were skipped;
  - `values`: present when an entry was skipped for a value; for each `<kind>.<field>`, every value not known with how many entries hold it;
  - `mayBeIncomplete: true`;
  - `reading`: a sentence saying how the reading was made.

  For example: `{ "kinds": { "annotation": 2, "decide": 1 }, "values": { "decide.status": { "deferred": 1 } }, "mayBeIncomplete": true, "reading": "…" }`. `concepts overview` also reads the ledger for the cuts in flight, so its report counts what it skipped in both. When the post-commit completion check warns that a cut is not complete, its warning also names each ledger kind it skipped.

  Appending still works on such a journal or ledger, and no existing entry is rewritten or removed. The new entry's id is minted after the last entry, whatever its kind. A ledger append is still refused when its transition is already recorded, even by an entry of an unknown kind. The work package capability's `record` reads and appends the journal the same way.

  A known journal entry the runtime cannot read is still refused, and the refusal names the entry's file and the fields that are wrong. One example is a `define` entry missing its `wording`. A file whose id doesn't match its name, or that names no kind, is still not an entry of the journal or ledger and is refused. A journal or ledger holding only what the runtime knows carries no `uninterpreted` report, and reading never appends.

  The concept journal's explanation now says only when to use it. How a reading treats entries it can't interpret is stated in the reading's own answer, in `uninterpreted.reading`.

  `@cratylus/runtime`: `cutView` also returns `readPast`, the ledger entries it skipped. `cutsInLedger` returns `{ cuts, readPast }` where it returned the list of cuts.

- 9564ae9: Warn of implementation leakage in the concept journal: `cratylus concepts leakage [--context <name>]` reports, as `{ "warnings": [...] }`, each live concept's wording, decision not superseded and numbered example in `design/examples` that names code, files, commands, flags, identifiers, tools or libraries instead of what must hold. Each warning names its passage (a concept by context and name, a decision by context and id, an example by file and number), the narrowest words that leak and the rule they break. `define`, `supersede` and `decide` record exactly as before and, when what they recorded leaks, their printed entry also carries its `warnings`; the journal stores none, and nothing is refused for leakage. Detection is lexical, and a context's own concept names are never leakage. The runtime's `.` export now also carries `JOURNAL`, the concept journal's explanation.
- dd09a53: Leakage now warns only where realization replaces meaning (decision 0058). A decision states what it is about: `cratylus concepts decide` takes `--kind meaning` or `--kind realization`, and a decision recorded without it is inspected as stating meaning. A new appending verb, `cratylus concepts classify <id> --kind meaning|realization [--reason <why>]`, records the kind of a decision already recorded as an entry of its own, so the decision's record never changes; `<id>` is the decision's id, or its entry where two decisions share the id, and the latest kind recorded governs. A decision that already has a kind is classified again only with `--reason`; an unknown or ambiguous decision, an unknown kind and an empty reason are refused, and every refusal appends nothing. `decisions` and `state` report each decision's governing `kind` (`null` where none is recorded) and its `kinds`, every kind recorded in order, each with the `entry` that recorded it and its `reason` where one was given. `leakage`, and the warnings on `define`, `supersede` and `decide`, no longer inspect a decision whose kind is `realization`, and a context's own words now include each word its current subject names, so a tool the subject names is no leak as that plain word in that context's concepts, decisions and examples, and still is in any other; a command, a code span or a flag that holds the word is still warned, and a word joined to others in the subject (`omp's`, `--agent`, `vitest-based`) still names its bare word. Changing a context none of whose descriptions is current no longer fails with an uncaught error: a field left out is refused, naming the field to give.
- 486719c: The omp extension names the acting agent on every capability call, in `CRATYLUS_AGENT`: the declaration a main session was launched as, the agent a dispatched session runs as, and no one otherwise. It drops any value the environment carries in. A capability's refusal is now returned as a tool error (`isError: true`) carrying the command's own message, never thrown.

  Every `bash` call runs with the session's agent named in `CRATYLUS_AGENT`: the extension leads its command with a line exporting it (omp's bash tool takes no `env`), so a commit or journal append made from the architect's session carries the architect and a lead's carries the lead. In a session that is no agent the line unsets it, naming no one.

  The freeze holds at the record (decisions 0128, 0129): the journal refuses before appending, and the project's history at its `reference-transaction` hook, `cratylus freeze-gate`. The extension no longer refuses any tool call for the files it would change, by any route; its attempt-time freeze gate, including its refusal of shell calls naming `CRATYLUS_AGENT`, is removed. A builder's dispatch is refused while a visible example its work package owns is among the cut's `unchecked` in `cratylus workPackage frozen`, naming the package and those examples.

- 9687df6: The runtime records what is frozen. A cut is frozen from its `workPackage open` until its new `workPackage integrate`. From its opening, for each of its contexts, it freezes its examples, its held-out example text `design/judgment/<context>/<cut>.md` and each concept its examples name, in its own context. The new `workPackage freeze --cut <cut> --check <path>` (a file, or a folder ending in `/`) freezes the checks it names, a held-out check under `design/judgment/<context>/<cut>/` only once a freeze names it. `workPackage frozen` answers every cut opened and not integrated, with its architects, examples, checks, concepts and unchecked examples.

  The agent making a capability call is named in `CRATYLUS_AGENT` (`ACTING_AGENT_ENV`, `actingAgent`). `integrate` records who made it. `workPackage state` tells whether the cut is integrated.

- a511371: `omp --agent <name>` now starts the main session with the whole declaration, as omp's `task` dispatch gives it to a child, resolved by omp's own resolvers. Every turn's prompt carries, after the declaration's text, the full instructions of each skill its `autoload-skills` names that omp discovers for the session, in omp's autoload form (an unknown name is skipped). The session runs without omp's default personality; with summarised reads on or off as `read-summarize` says (unsaid, the session's own setting); with the advisor and the pre-planning hand-off (prewalk) the declaration names, `task.agentAdvisor` and `task.agentPrewalk` entries first, and neither when it names none (a hand-off the configuration armed is dropped first, so a declared target wins). It dispatches only the agents its `spawns` names (`*` any; absent, as omp reads it: `*` with `task` among the `tools`, else none; an explicitly empty `spawns`, an empty list or a blank string, none even with `task`), omp refusing any other with `Cannot spawn '<name>'. Allowed: …` through `before_subagent_spawn`; its children's own dispatch is untouched. Two values omp's own dispatch does not hold are held by launch as the declaration says: an explicitly empty `spawns` with `task` among the `tools` (omp's discovery reads it as `*`), and `read-summarize: true` (omp's dispatch applies only `false`); every other value is held as omp's dispatch gives it to a child. These settings are session-scoped runtime overrides, never persisted, applied once per launch and put back when the launch ends. The operator's `--model`, `--thinking`, `--advisor`, `--prewalk`, `--no-prewalk` and `--prewalk-into` win their own part; the tools are never touched, so without `task` the session cannot dispatch. A session without `--agent`, and every subagent session, are unchanged.
- bdadf63: `omp --agent <name>` starts the main session as any agent declaration omp discovers (decision 0047), through cratylus's one omp extension, `~/.omp/agent/extensions/cratylus.ts`, which `cratylus install --harness omp` places. The extension registers the `agent` flag and resolves the name with omp's own agent discovery, the declarations omp's `task` dispatch runs (`.omp/agents/` nearest the session's directory, then `~/.omp/agent/agents/`, then extension packages, plugins and bundled agents such as `scout`), read afresh for each new session. The session runs on the model and thinking level omp's dispatch would run the declaration on, resolved by omp's own resolver: a role alias is expanded, and a level a model selector carries (`provider/model:high`, directly or in a role's configured value) wins over `thinking-level`. An explicit `--model` or `--thinking` on the command line wins over the declaration's, each for its own part. Every turn's system prompt carries the declaration, its name and description as a sentence and then its body, never its raw front matter; and the status line shows the declaration's `mark` and name, or the name alone (a bundled declaration has no mark). The extension never changes the active tools: `omp --agent <name> --tools …` holds exactly what plain `omp --tools …` holds, and a declaration's `tools` are for dispatch only. An unknown name ends startup with a non-zero exit naming it, before any session starts. Without `--agent`, and in subagent sessions, the extension adds nothing. Its capability tools are unchanged.

  Wherever install places that extension on omp it also lists omp's `status` segment in the host's status line (or shows the hidden status row again), whether or not the corpus delivers any agent, so the name and mark render on a host that had hidden extension status.

- 68fd951: The concept journal reaches omp as one tool (decision 0037). `cratylus install --harness omp` places cratylus's own extension, `~/.omp/agent/extensions/cratylus.ts`, recorded in the deploy manifest with the other session modules, which every omp session loads. At load it registers one tool for each capability that explains itself, today the concept journal: it asks the `cratylus` on `PATH` for `cratylus concepts --explain` and registers `concept_journal` composed from that answer alone: its label and description from the explanation, a required `verb` among the explained verbs and every explained parameter with its descriptions and schema (each distinct schema under `anyOf` where verbs declare one name differently), read approval for a verb that reads and write approval for one that appends. A call runs `cratylus concepts <verb> …` in the session's directory, every value as one `--flag=value` word so a value led by `-` reaches the command as written, and returns its JSON output; a refusal is a tool error carrying the command's own message, and a positional led by `-`, which the command cannot take as a word of its own, is refused by the command. The extension holds no description, verb, parameter or rule of the journal, so a newer installed package changes the tool in the next session with the extension unchanged. The harness adapter port gains `capabilitySurface`, which forge's projection stages at the session scope.

  `cratylus install` takes `--home <dir>`, installing for that home in place of yours.

- 68d0bf5: Typed handoffs bound on omp. Each agent declaration carries its deliverable schema as omp's own `output` and its assignment schema under `assignment`; no declaration lists `tools`, and the body ends with the agent's per-turn persistence protocol. Every agent is offered every verb of every capability. Every turn carries the assignment form of each agent that takes a typed one, and on every `task` call, in any session, each such item is checked with the schema package's own `checkAssignment` against its fenced `assignment` block; a misfit is warned of, naming the agent and each missing or ill-typed field, and the dispatch goes ahead. A session launched with `--agent` as such an agent checks its first prompt the same way. The extension appends the harness's own events through `cratylus lifecycle`: `dispatched`, `returned` (with tokens when reported), `verdict` from an assayer's deliverable and `reported` from a lead's, each transition derived from the task call and item ids.

  Capability fidelity. `HarnessAdapter` gains `nativeCapabilities`. Projection chooses for each runtime capability the harness's own facility, else the extension tool, else prose generated from the capability's own explanation (staged as `capabilities/<capability>.md` and carried by every agent), and reports the form as `capabilities`. `@cratylus/runtime` exports `WORK_PACKAGE`, `explain` and `Explanation` for it.

  A builder's assignment `examples` may be empty: a package sharing outputs owns no example.

- f880363: The work package capability keeps a tracked, branch-versioned **ledger** in `design/ledger/` in place of the untracked log under the git common directory: one exclusively created JSON file per entry, named by a ULID, each carrying a transition id, and an entry whose transition is already recorded is refused with nothing written. The pre-commit immutability gate covers `design/ledger/` as it covers `design/journal/`.

  A cut is identified by its name alone, across contexts: `--cut <name>` reads every `design/examples/<context>/<name>.md`, examples are referenced as `<context>/<n>`, and a concept the cut's contexts share is given as `<context>/<name>`. `inventory` lists each example with its `ref` and context and each concept with its context; `assignment` gives the owned examples by `ref`.

  New verbs: `open --cut <name> --branch <branch> --architect <context>=<architect>` records the cut, refusing contexts held by different architects (one cut per context, joined by contracts) or a context left without an architect; `state` computes the cut's branch, contexts, architects, phase (`open`, `in flight`, `complete`), each work package's status (`submitted`, `dispatched`, `returned`, `approved` on two distinct assayers' passing verdicts, `failing`, `disputed`), the packages ready to dispatch and the lead's latest report. The agent-called `dispatch`, `finish` and `run` are removed: dispatches, returns, verdicts and reports reach the ledger only from the harness's own events, through the harness-facing command `cratylus lifecycle '<event-json>'`. `record` writes one `efficiency` entry per context of the cut.

  `cratylus completion-check`, run by this repository's `.husky/post-commit`, warns when a commit's subject opens `feat(cut:<name>): ` and the ledger does not show that cut complete, naming its phase and every work package not approved; it never refuses and never writes the ledger. `lifecycle` and `completion-check` are no capability and no agent tool, and no help lists them.

  `@cratylus/runtime` exports the ledger API (`cutView`, `cutsInLedger`, `foldCut`, `readCut`, `appendLifecycle`, `completionCheck`) for harness bindings and other packages.

- 20c9c98: Context overview. The concept journal gains the reading verb `overview` (`cratylus concepts overview [--context <name>]`, concept: context overview), which tells each bounded context whole and is computed from the journal and the ledger on every request, never stored. Each context answers `{context, subject, relation, concepts:[{name, meaning, builtFrom}], cycles, openDecisions:[{id, title}], cutsInFlight:[{cut, phase, branch}], account}`. Concepts come whole before parts: first those no other concept is built from, in recorded order, then breadth-first, each part right after the first shown concept built from it, ties in recorded order. Concepts reached only through a cycle follow in recorded order, and their cycle is named. Open decisions are the context's own. Cuts in flight are the ledger's cuts in phase `in flight` whose contexts include this one. `account` tells the same in plain prose for a reader of that context, in that order. The verb explains itself like the others, so the `concept_journal` tool offers it. The journal's own `when` and the `state` verb's `when` now say that a session reads each touched context's overview first at reconstitution, and then the detail it needs.

  The concept journal's interface now speaks in the design's own terms. Its summary opens with what an agent reaches for it to do: read a bounded context's current design, its overview first, then its decisions and each concept's history, and record changes to them. The overview explains the ledger as the record of the cuts and their work packages, and explains a cut as a change to the design built and judged as a whole. A decision is referred to by the entry the decisions reading lists for it, wherever an id is shared.

- 81758a4: Remove the legacy `design` capability (decision 0022): the concept journal is the only account of the design, so `cratylus design` is gone and the concept journal's `cratylus concepts` is where the design is read and recorded (`cratylus concepts design` for the current design). `cratylus design …` is now refused as an unknown command. The runtime's capability keyspace (`CAPABILITIES`) and canon's `RUNTIME_CAPABILITIES` are `eventTap` and `concepts`; a skill can no longer declare `runtime: { capability: 'design' }`. The `.` barrel of `@cratylus/runtime` no longer exports the `DesignHost`, `ConceptInput`, `ConceptChange` and `Invocation` port types, and what only the `design` capability reached — its reading of the record store across plan branches and worktrees, and its views — is removed.
- b05854f: Install no longer places a persona launch surface: no `omp-agent` launcher, no per-persona `omp.yml` `--config` overlay, no `cratylus-persona-badge.ts` module, and no persona command in `~/.local/bin`. A session is started as an agent only through the harness itself, `omp --agent <name>` (or `claude --agent <name>`). The install options `--link-persona-commands` and `--no-link-persona-commands`, and the question they answered, are removed; passing either is now an unknown-option error.

  An earlier install's launch surface is taken away: the next `cratylus install` prunes the launcher, overlays and badge modules its deploy manifest records, and unlinks each persona command recorded under `personaLinks` while it still points into the harness's home (one since pointed elsewhere is left and reported); `cratylus uninstall` removes them too.

  The modules composed for one agent (its guardrails and its copies of the session and isolation modules) are still placed under `~/.omp/agent/personas/<name>/extensions/`, which nothing loads without the retired overlay, so a per-agent guard does not judge an `omp --agent` session yet.

  **Breaking for `@cratylus/forge` consumers.** Removed: `HarnessAdapter.launcherFile`, `HarnessProjection.executable`, `SCOPE_DIR_TOKEN`, the omp adapter's `OMP_LAUNCHER_FILE`, `OMP_LAUNCHER_SCRIPT`, `OMP_OVERLAY_FILE`, `OMP_PERSONA_BADGE_MODULE`, `ompLaunchSurface`, `ompOverlayYaml` and `ompPersonaBadgeExtensions`, and from `deploy` `planPersonaCommands`, `placePersonaCommands`, `describePersonaCommands`, `describePersonaRemoval`, `personaLauncherOf`, `PERSONA_BIN_REL` and their types. `removePersonaCommands({ home, harnessDir, dry })` now takes only the recorded links. `InstallCmdOpts.linkPersonaCommands` and `pathEnv`, and `InstallPrompts.linkCommands`, are removed.

- b9e0ce8: The concept journal explains itself (decision 0037): `cratylus concepts --explain` prints, as one JSON object, its name (`concept journal`), its purpose, when to reach for it and its verbs in order, and `cratylus concepts <verb> --explain` prints one verb: the concept of cratylus's own design it acts on, its purpose, when to reach for it, whether it `reads` or `appends`, and each parameter with its description, whether it is required, its JSON Schema, and `positional` for the word it acts on. The explanation, `--help` and the reading of a call share one declaration per verb, so `cratylus concepts --help` and `cratylus concepts <verb> --help` now also say when to reach for the capability and each verb, the concept a verb acts on and its effect, and describe its positional. The verbs' purposes and parameter descriptions are reworded in the journal's own terms; `concepts context` names its positional `<context>` and `concepts accept` `<id>`. What each verb appends, prints and refuses is unchanged. In `@cratylus/runtime`, a verb declares its `purpose` (was `summary`) and a positional `{ name, description }` (was a `<name>` string), a flag may declare `required`, `values` and `repeats`, and `VerbFlags` takes the verb type it holds.
- dd4690d: The freeze is a rule held by review and the record, never a gate (decision 0143). Removed: the `freeze-gate` command and its reference-transaction hook, the tracking of the files a frozen check uses (`uses` in `workPackage frozen`, and the refusal to widen a package's outputs onto them), the offline proof (`proveOffline`, `judgeBatch`) and the `agent-behavior` and `behavioral` example checks.

  Who makes an append to the record is the acting agent (`CRATYLUS_AGENT`), else git's `user.name` (`makerAt`). Every concept journal entry records it as `by`, and `workPackage integrate` records it as `agent`. A change to a frozen concept, or an integration, by anyone but the cut's architect is recorded with a warning naming the cut and its architect instead of being refused.

  These now warn instead of refusing (decision 0142(2)): a cut opened across contexts held by different architects; a work package whose outputs overlap another's, or that needs an output of a package it does not depend on (the package is recorded); and a `workPackage commit` outside the package's outputs or for a package no builder was dispatched for. The immutability gate still refuses a change to a recorded entry, now naming the harm and the way past.

  An example's mechanical check is optional: an example with none is valid, judged by reading, and `checkExample` answers `{ status: 'unchecked' }` for it.

  This repository tests only its own deterministic code (decision 0144): every suite that started omp, an agent or a model, and every recorded-run proof, is removed, and CI no longer installs omp.

- 28ac76d: The runtime ships a third capability, `workPackage`: `cratylus workPackage <verb> --cut <context>/<name>` slices a cut into work packages and hands them out. `submit` and `update` record a package's outputs, concepts, dependencies and needed outputs, refusing an output another package owns, a concept the cut's visible examples do not name, an unknown dependency and a needed output no dependency owns. `levels` computes the dependency graph's levels with `@dagrejs/graphlib` and names the packages of any cycle instead. `dispatch` hands out the lowest unfinished level a whole level at a time and refuses when nothing is ready, when a concept is unserved or when any example has no owner, naming it; `finish` marks a package finished. `inventory` and `assignment` give every visible example its one owner. `commit` reads a builder's paths literally, never as globs, commits them only when every file they would commit lies within its package's outputs, and keeps them in the package's `history`. `check` records a whole-check run as its own round and flags a round that resolves none of the previous run's failures; `run` records an agent run with its role and tokens; `efficiency` reads the figures, and `record` appends them to the concept journal. Each cut's log lives under the repository's git common directory, shared by its worktrees and never tracked.

  The capability explains itself as `work package` (`cratylus workPackage --explain`), so omp offers it as the tool `work_package` through the cratylus extension, its reading verbs alone to a read-only agent.

  The concept journal gains the entry kind `efficiency`, and `cratylus concepts state` gives each context an `efficiency` field: each of its cuts with the figures last recorded for it and when, explained in the `reading` legend.

  `@cratylus/canon`'s `RUNTIME_CAPABILITIES` gains `workPackage`.

### Patch Changes

- 9f38eac: The composed agents' text changes in three profile values, each an architect ruling of 2026-10-10. `judgment` now holds the green-build precondition: the finished work is judged once, when its build is green, against fixed criteria and held-out examples. `outcome-with-efficiency` states each example's outcome in the design's own concepts, the terms the architect works in rather than those of the realization, and names its evidence and sources in those same terms, with the effort it took. `maintenance` keeps a peer's density in the notation that peer works in.
- Updated dependencies [2ff0cf2]
- Updated dependencies [8a744b3]
- Updated dependencies [5f747e9]
- Updated dependencies [cd8e214]
- Updated dependencies [8964765]
- Updated dependencies [4b34740]
- Updated dependencies [19e525c]
- Updated dependencies [96c2945]
- Updated dependencies [a4fb154]
- Updated dependencies [50f14f9]
- Updated dependencies [9f480ca]
- Updated dependencies [9564ae9]
- Updated dependencies [dd09a53]
- Updated dependencies [c291399]
- Updated dependencies [486719c]
- Updated dependencies [9687df6]
- Updated dependencies [a511371]
- Updated dependencies [bdadf63]
- Updated dependencies [68fd951]
- Updated dependencies [6d906e7]
- Updated dependencies [68d0bf5]
- Updated dependencies [ebe2aa5]
- Updated dependencies [f880363]
- Updated dependencies [20c9c98]
- Updated dependencies [14ac18b]
- Updated dependencies [81758a4]
- Updated dependencies [b05854f]
- Updated dependencies [9f38eac]
- Updated dependencies [b9e0ce8]
- Updated dependencies [77709cf]
- Updated dependencies [dd4690d]
- Updated dependencies [28ac76d]
  - @cratylus/canon@0.15.0
  - @cratylus/forge@0.15.0
  - @cratylus/runtime@0.11.0

## 0.11.0

### Minor Changes

- 7c7354d: A note taken up now ends resolved, and a note withdrawn with nothing carrying it ends retracted. `cratylus note resolve <title>` takes exactly one of `--concept <anchor>` or `--unit <u of plan p>` beside the author, reason and cause, and writes a whole new version of the note that keeps its fields and names its carrier by identity and domain, so a carrier renamed since still reads right. It refuses, writing nothing, with neither flag or both, a title no note holds, a diverged note (reconcile it first), an anchor that denotes no live concept and a name that denotes no live unit. A resolved note, like a retracted one, is no longer live, holds no title and blocks nothing, so resolving an owed ruling ends it, the unit it blocked returns to the frontier and a plan it blocked binds; a new note may take its title. The whole notebook neither lists nor counts a resolved note, and `note show <title>` prints it in full marked ` — resolved to concept <anchor>` or ` — resolved to unit <u of plan p>` by the carrier's current name. Resolving a note to a unit of a bound plan is written on that plan's line, as a note blocking it is. A note resolved differently on two merged branches is diverged, and `note reconcile` reaches it by its title: it takes `--concept` or `--unit` too, and needs one where the versions disagree on whether the note is resolved or on what carries it. The `note` skill gains the verb, and the `design` and `plan` skills end a note taken up by resolving it, with the design resolving the note to the concept that carries it, where each retracted it.

### Patch Changes

- Updated dependencies [9813224]
- Updated dependencies [7c7354d]
- Updated dependencies [01afe42]
  - @cratylus/canon@0.14.0
  - @cratylus/runtime@0.10.0
  - @cratylus/forge@0.14.5

## 0.10.4

### Patch Changes

- 9482980: The `line-worktree` hook is retired. It was the Claude Code `WorktreeCreate` hook that took over the harness's worktree creation to cut the implementer's worktree from the bound plan's line, and it no longer ships: the cell, its committed worker and its test are gone, and the practices that placed the implementer no longer list it. Nothing replaces it. The implementer keeps `isolation: worktree` on Claude Code and stays an isolated task on omp, so the isolation is the harness's own; Claude Code cuts that worktree as it cuts any, by its `worktree.baseRef`, and omp cuts its isolated copy from the dispatcher's HEAD. Starting from the plan's line is the implementer's own move, and `plan land` already refuses a commit not built off the line. A host that installed the hook loses it on its next install, by the deploy prune of registrations the render tree no longer carries. `Practice.hooks` and the `worktree.create` event stay as general plugin surfaces.
- Updated dependencies [9482980]
  - @cratylus/canon@0.13.4
  - @cratylus/forge@0.14.4

## 0.10.3

### Patch Changes

- 2d5649c: `plan bind` now moves the plan's records onto its line instead of copying them. The records of the plan, its units and the notes blocking either, which the checkout it runs in holds, are written into the line's worktree when the line lacks them and are no longer in the checkout or its index afterwards, where they used to stay as untracked files that a commit of `records/` would have put on the main line and the release of the closed plan would have met as untracked paths. A record the line holds already is taken off the checkout the same way when the two files are identical. A record the checkout's HEAD tracks stays in it, since a committed record is never removed, and nothing else is removed: a design record and a note naming no plan stay where they were written. A bind run from the line's own worktree moves nothing. `plan show` and `note show` print the same state from the main checkout as from the line's worktree, as before.
- 355dd97: `install`, `uninstall` and `deploy` now place and remove Claude Code's files where Claude Code reads them. Claude Code reads its settings, agents, skills and hooks from `$CLAUDE_CONFIG_DIR` when that is set, and from `~/.claude` otherwise; cratylus put them under `~/.claude` whatever the environment, so with the variable set a session ran whatever hooks and status line sat in the real home, not the deployed ones. Given no `--home`, a run for Claude Code now uses `$CLAUDE_CONFIG_DIR` when it is set and not empty, and `~/.claude` otherwise. A `--home` given still means `<home>/.claude`, and omp is unchanged.

  Every command the Claude Code adapter writes into `settings.json` (the guard hook commands, the persona status line, and the hook that prints a persona's skills into a `--agent` session) now resolves that directory when Claude Code runs it, the way Claude Code does: `$CLAUDE_CONFIG_DIR` when set, else `$HOME/.claude`. The size of the skills hook, which `install` weighs against the cap on what one hook may print, is that of the directory the hook will print. The variable's name is declared on the Claude Code adapter beside its `home` (`HarnessAdapter.homeEnv`), and the deploy engine reads it from there.

  A host installed before this change uninstalls as before: uninstall removes the hook commands and status line its deploy record holds, as they were written.

  Running `install` again over a host installed before this change converges: the status line command that host's deploy record says install placed is install's own, and becomes the current worker command in place, over the same host command if it wrapped one, where it used to be taken for the host's and wrapped, leaving a command that failed once uninstall removed the worker.

- 4c997d5: The implementer now starts in a git worktree of its own, cut from the tip of the bound plan's line, where its session used to begin in the operator's main checkout.

  `@cratylus/schema`'s `Agent` gains the optional `isolation?: 'worktree'`, carried on the identity face beside `holds` and `dispatches`, and `Practice` gains the optional `hooks`, the hook cells a practice registers beyond the guards its agents' compositions bind.

  `@cratylus/canon`'s `RoleCell` may state `isolation`, `holds` copies it to every holder of the role (a persona cannot state it), and only the implementer role does. The vocabulary gains `worktree.create`, the moment a worktree is made for an agent, and a new hook cell, `line-worktree`, is bound to it: while a plan is bound it creates the requested worktree on a new branch cut from the tip of that plan's line, which it asks the host `cratylus plan show` for and names nowhere itself; with no plan bound it creates the worktree as Claude Code would, from origin's default branch or, where the host's `worktree.baseRef` is `head`, from HEAD. A creation it cannot make, including one made while the runtime cannot say whether a plan is bound, exits non-zero with no path and no worktree, and never falls back to the main checkout. Worktrees it creates are kept on removal. Every practice that places the implementer lists the cell, so every install that places the implementer places it and uninstall removes its registration with the rest.

  `@cratylus/forge`'s `HarnessAdapter` gains the required `startsInWorktree`: claude answers yes, emits `isolation: worktree` in the front matter of an agent declaring it and nothing for one that does not, and binds `worktree.create` to `WorktreeCreate`; omp answers no, since its agent definition has no field that isolates an agent and it fires no worktree-creation event, so it emits nothing and projection warns once per declaring agent. Projection also warns, once per moment, of a hook bound to a moment the harness does not fire, and no longer stages the worker of a hook none of whose moments it fires, where it used to stage the file with no registration beside it. A chosen practice's `hooks` are registered with the plumbing.

- eeb334b: `plan land` refuses, writing nothing, a commit its unit was not built apart for, while the unit's plan is bound: a commit the repository cannot resolve, a commit the main checkout's HEAD already contains (a unit built in the operator's checkout, on its branch or on one switched to there), a commit the plan's line already contains (a unit built in the line's own worktree), and a commit whose history does not run from the line (one sharing no history with it, or cut from the main checkout after it moved past the line). A commit made in another worktree on a branch off the line is recorded as before. The refusal says in the plan's words which holds for which unit and commit, and that nothing was written; it names no git command, branch or worktree path. `plan assay`, `plan whole` and `plan broke` are unchanged, and a land on a unit of a plan that is not bound refuses as before.
- 795ea1c: The `line-worktree` hook now cuts only the implementer's worktree from the bound plan's line, and leaves every other worktree on the host to be created as Claude Code would create it. It used to cut every worktree Claude Code makes — a `claude --worktree` session, a background session isolated in a worktree, any subagent declaring `isolation: worktree` — from the line whenever a plan was bound, and to fail the creation outright where `cratylus` or `jq` was not on `PATH`, or where `cratylus plan show` answered a first line the hook did not recognise (`with nothing committed yet`), in every repository on the host.

  The hook tells the implementer's worktree by the name Claude Code gives a subagent's (`agent-a` and 7 or 16 hex digits), since the `WorktreeCreate` input names no subagent. For every other worktree, and for the implementer's when there is no line to cut from (no plan bound, `cratylus` missing, a `plan show` answer it does not know, a line commit the repository does not resolve), it creates the worktree at `<project>/.claude/worktrees/<name>` on `worktree-<name>`, from origin's default branch or, where the host's `worktree.baseRef` is `head` or there is no origin, from HEAD, and prints its path; without `jq` it reads the request and `baseRef` with `sed` and still cuts the implementer's worktree from the line, which needs no `jq`. It still fails, with no path and no worktree, a creation Claude Code's own would refuse: an unusable `cwd` or `name`, a `cwd` in no repository, a path already taken, a `git worktree add` that fails.

- bb861f0: On omp a dispatch of the implementer is now an isolated task, so the implementer builds in an isolated copy of the dispatcher's checkout and no longer writes the main checkout. The copy is still cut from the dispatcher's HEAD and not from the plan's line, so the implementer is still not started in a worktree off the line, and the projection warns of that, in words that now say what it does get.

  `@cratylus/forge`'s `HarnessAdapter` gains the optional `dispatchIsolation`, a harness's isolation of a dispatched agent where its agent definition has no field for one: the host config files, the scalar settings the host must hold, and what the isolation still lacks. omp declares it as `task.isolation.enabled: true`, `apply: false` and `merge: branch`. omp emits a `cratylus-isolation.ts` extension in the session scope and in each persona's, whose `tool_call` handler sets `isolated: true` on every spawn of an agent declaring a worktree, in a batch or a flat call, and on nothing else. Install sets the three settings in omp's `config.yml` by editing its lines, replacing a value the host held and recording the edit so that uninstall puts the file back byte for byte, and says in its summary what is not realized. A config it cannot edit safely is left as it is, with the lines to write by hand. `ProjectedTree` gains `unisolated`, the agents that declare a worktree the harness cannot start.

  Measured on omp 18.4.9: a `tool_call` handler can revise a task's input, `task.isolation.apply: false` keeps the copy's changes out of the dispatcher's checkout (its `git status` is unchanged), and the copy is cut from the dispatcher's checkout as it stands, with no ref to give. The settings are the host's, so they hold for the isolated tasks you dispatch yourself as well: their changes are kept as the branch `omp/task/<id>`, not applied.

- f95d1f9: `cratylus eventTap uninstall` now puts a Claude Code host back as it was before `install`, removing what `install` placed and nothing the host placed, and says what it left. A `settings.json` that install created, and the directories it made to hold it (the `.claude` directory in the usual case), are removed once the tap's entries are gone and nothing else is in them; before, the file stayed holding `{}` and the directory stayed. A settings file that existed before install comes back byte for byte when the host has changed nothing in it since (an empty file comes back empty; the host's indent, line endings, spacing and one-line hooks are kept) where it used to be rewritten in two-space JSON; where the host has changed it, only the tap's entries are taken out.

  Where the host has since put something in a file or directory that install created, uninstall takes out only the tap's entries, keeps what the host put there, and names it: the result gains `left`, a list of `{ path, why }`, absent when nothing was left. The `EventTapHost` port's `remove` returns that list (`EventTapLeft[]`) where it returned nothing.

  Install and uninstall run as separate processes, so an install stamps `restore` on the tap's own hook entries: that it created the file and how many directories, or the text of the file it found. Uninstall reads it back. A second install over a first leaves the first's stamp as the record of what the host held.

- b3113a8: A runtime config cratylus cannot read is no longer replaced unread. `cratylus install` (its `--dry-run` too) and `cratylus deploy`, when the runtime config they would write (`$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json`) exists and is not valid JSON or not a JSON object, used to read it as empty and rewrite it whole, losing the host's bytes without a word. They now refuse before anything is placed, with one line, `cratylus install: <file> <what is wrong>; repair the file or move it away, then run cratylus install again` (`deploy` in its own name), exit 1 and nothing written anywhere. `cratylus uninstall`, which already left such a file unread, now names it among what it left, and why. A missing config and a readable one behave as before.
- Updated dependencies [2d5649c]
- Updated dependencies [355dd97]
- Updated dependencies [4c997d5]
- Updated dependencies [eeb334b]
- Updated dependencies [795ea1c]
- Updated dependencies [bb861f0]
- Updated dependencies [f95d1f9]
- Updated dependencies [b3113a8]
  - @cratylus/runtime@0.9.4
  - @cratylus/forge@0.14.3
  - @cratylus/canon@0.13.3

## 0.10.2

### Patch Changes

- 40d159e: A runtime config the host wrote before install keeps its content. `cratylus install` and `cratylus deploy` used to replace an existing `~/.cratylus.json` (or `$AGENT_RUNTIME_CONFIG`) whole, so a key of the host's own, such as `{"x":1}` or a capability's configuration the corpus does not write (`configuration.mine`), was gone after the run, and the uninstall of the last harness then deleted the file. Every deploy now writes only cratylus's parts of the file, the event vocabulary, the configuration of each capability the corpus configures, and its harness's stanza, and carries every other key as it found it, recording in the deploy manifest (`runtimeConfig`) a digest of each part it wrote. `cratylus uninstall` takes out only those parts, and only while each is still what was written: this harness's stanza, and with the last installed harness's the vocabulary and the capability configuration. A part the host changed since install, such as an edited `configuration.plan` or a vocabulary with an event of the host's added, stays and is named in what was left, as does every key the host placed. The file goes only when nothing else is left in it. A harness deployed before the record was kept leaves all its parts, named, since a change by the host cannot be ruled out; `cratylus install --harness <h>` writes the record. Two harnesses sharing the file each take out only their own stanza, as before.
- 8a3227d: `cratylus install` no longer lists or accepts `--plugin <pkg>`, a flag the command took and never acted on; it now refuses it as an option install does not take. Another corpus is installed by naming it in a `cratylus.config.ts`. In a directory whose `cratylus.config.ts` cannot be loaded (the file `cratylus init` writes, before its package is installed, or one that does not parse), install ends with one `cratylus install: <what is wrong>; <what to do>` line, exit 1 and nothing written, where it used to end in a stack trace.
- 0fa76f9: The persona badge on omp no longer throws at launch on an omp before 18.3.2, which has no `ctx.agent`: it shows the badge where omp's `ctx.mode` still says the session is the interactive terminal host, and where nothing can tell, it says once, in one line, why it shows none. Where the host's `statusLine` is an alias to a mapping written elsewhere and that mapping hides the status row (`showHookStatus: false`) with no `status` segment listed, the badge, which used to show nowhere, is also set in a widget beneath the editor; where the row is shown or `status` is listed it still appears once, in the status line. A subagent's session still gets no badge on any surface.
- Updated dependencies [0742c59]
- Updated dependencies [96fa812]
- Updated dependencies [2a51381]
- Updated dependencies [714b57b]
- Updated dependencies [03bdff1]
- Updated dependencies [40d159e]
- Updated dependencies [8a3227d]
- Updated dependencies [f675f0a]
- Updated dependencies [4386211]
- Updated dependencies [7e99a95]
- Updated dependencies [a2ec086]
- Updated dependencies [0fa76f9]
- Updated dependencies [dcf26db]
- Updated dependencies [3f40cdd]
  - @cratylus/runtime@0.9.3
  - @cratylus/canon@0.13.2
  - @cratylus/forge@0.14.2

## 0.10.1

### Patch Changes

- b5735e0: The README that ships with the package now puts what a consumer does first: install the command, run the guided install, start an agent by its name, take it away again. The explanatory sections (the guided install, the status line badge, where Claude Code and omp differ, model routing, the host runtime config, uninstall) stand above the command reference, which is unchanged in what it lists. No behaviour changes.
- Updated dependencies [be25412]
- Updated dependencies [b4bd37b]
- Updated dependencies [e79b4b0]
- Updated dependencies [b3cb992]
  - @cratylus/canon@0.13.1
  - @cratylus/forge@0.14.1
  - @cratylus/runtime@0.9.2

## 0.10.0

### Minor Changes

- 526ccc2: `cratylus --help` lists the consumer's commands first, `install` then `uninstall`, then the capabilities, then the corpus author's commands (`init`, `add`, `compose`, `project`, `optimize`, `deploy`, `explain`, `catalog`) in a group of their own, `Corpus authoring:`. The README follows the same order. `@cratylus/forge/cli`'s `projectorCommands` returns `{ consumer, author }` — the commands each audience uses — in place of one list.
- 1e5fd22: `cratylus install` offers practices where it offered optional personas. `--practices <name,…>` names the practices to install and `--all` installs every one; on a terminal with neither, install asks one multiselect of the declared practices, each with its description, preselecting the ones already installed here (on a fresh host, the corpus's preselected `cdd`), and `--yes` takes that preselection. With no terminal on stdin and stdout and neither flag, install refuses before writing anything and names `--practices` and `--all`, under `--yes` and over an existing install too; it used to place the whole corpus. An empty choice is refused, saying that removing everything is `cratylus uninstall`, and `projectPluginSet` refuses `practices: []` instead of rendering every cell (absent still renders every cell). A practice installed before and not chosen now is removed with the agents, skills, hooks and persona commands no chosen practice still carries, and the chosen practices are recorded in the deploy manifest for the next run to preselect. The persona decision is retired: `--personas`, `Agent.optional`, `ProjectOpts.omitAgents` and `ProjectedTree.optionalAgents` are gone, and `kino` and `nico` are installed with their practices, `film-production` and `corpus-authoring`.

### Patch Changes

- f0b8693: A `design`, `note`, `plan` or `eventTap` verb no longer drops a word it does not take: a second positional where the verb declares one, any positional where it declares none, is refused before the verb acts, in one line naming the word, the verb's usage and its `--help`, together with any flag the verb does not take. Nothing is written.
- Updated dependencies [526ccc2]
- Updated dependencies [1e5fd22]
- Updated dependencies [57fd456]
- Updated dependencies [f0b8693]
  - @cratylus/forge@0.14.0
  - @cratylus/canon@0.13.0
  - @cratylus/runtime@0.9.1

## 0.9.0

### Minor Changes

- d041f73: `cratylus` is one program, and its help lists every command and every capability

  `cratylus --help` lists `init`, `add`, `compose`, `project`, `optimize`, `install`, `uninstall`, `deploy`, `explain` and `catalog` with `eventTap`, `design`, `plan` and `note`, each with a one-line summary, and `cratylus <command> --help` lists a command's flags with their defaults and choices. `cratylus` with no command prints that help on stderr and exits 1. `--version` and `-v` print the version of the `cratylus` package.

  A word the program does not know is refused on one stderr line, `cratylus <command>: <what went wrong>; <what to do>`, naming the word, the nearest match when one is close and the `--help` to read, with exit 1 and no stack trace: an unknown command (`cratylus frobnicate`), an unknown option (`install --harnes`, and `--versoin`, which used to exit 0 and print nothing), a value outside its choices, a missing required value, an argument too many. Under `deploy --check` a usage error exits with the check's no-verdict code, not drift. `deploy --kind`, `--scope` and `--harness` (and `--harness` of `project`, `install` and `uninstall`) are checked where they are parsed and name the allowed values, so `deploy --scope porject` no longer deploys to user scope; `optimize` requires `<source>` and `--plan` at parse time.

  A capability's failure carries the same prefix as every other command's: `cratylus plan assay: …`, where it was `cratylus: plan assay: …`. The program's own failure, which names no command, stays `cratylus: <message>`.

  A flag that would change nothing is refused on one line instead of being accepted and dropped: `deploy --scope project --home`, `deploy --from` with all three directory flags, a directory or `--assets` flag the chosen `--kind` never reads, and `--config`, `--verbose` and `--dry-run` with `--check`.

  A reader that closes the pipe ends any command quietly with its exit code: `cratylus project --verbose | head -1` no longer dies with an unhandled EPIPE.

  The refusal of a verb a capability does not declare has one home, `verbOf`, in the command line's wording: the verb, the capability's verbs and `cratylus <capability> --help`. Every dispatcher, `eventTap` included, throws that text when called as a library, byte for byte what the command line prints.

  The commands are documented once, in the `cratylus` README, and a test holds that reference to the help: it fails when a command or verb the help lists is missing, named twice, or named without being listed. `docs/cli/USAGE.md`, a proposal for the command surface, is deleted, so the `cratylus` README is the one reference. The forge README keeps the library material and links there; the canon README's consumer setup installs `cratylus` and imports `defineConfig` from it.

  `@cratylus/forge/cli` now exports `projectorCommands`, the projector's commands as Commander commands, in place of `runCli`; `@cratylus/runtime/main` exports `capabilityCommands` in place of `runCli`. `cac` and `picocolors` are no longer dependencies; `commander` is, of `cratylus` and `@cratylus/forge`.

### Patch Changes

- Updated dependencies [731517e]
- Updated dependencies [d969e08]
- Updated dependencies [d041f73]
- Updated dependencies [42718fd]
- Updated dependencies [4cd276d]
- Updated dependencies [15a0b3a]
  - @cratylus/canon@0.12.4
  - @cratylus/runtime@0.9.0
  - @cratylus/forge@0.13.0

## 0.8.3

### Patch Changes

- e3aa516: The README's "Enforcement scope" entry now tells consumers that a guard refusal can be contested: state why, and the act proceeds with the contest logged for review.
- Updated dependencies [cd697a8]
- Updated dependencies [31a7cfc]
- Updated dependencies [3d8a735]
- Updated dependencies [a6a6a7e]
  - @cratylus/canon@0.12.3

## 0.8.2

### Patch Changes

- Updated dependencies [55ce06a]
  - @cratylus/canon@0.12.2

## 0.8.1

### Patch Changes

- Updated dependencies [79e6f36]
- Updated dependencies [c00b261]
- Updated dependencies [9e0e85e]
- Updated dependencies [e7fcc90]
  - @cratylus/forge@0.12.1
  - @cratylus/canon@0.12.1

## 0.8.0

### Minor Changes

- d65e7db: `cratylus install` is a short guided run. It asks only what the operator must decide — which harness, which of the corpus's optional personas (an agent may declare `optional`; kino and nico do, and every other agent is always installed), whether to link the persona launch commands, and which model each held role routes to — shows what it will place before placing anything, places it once confirmed, and ends with a few lines saying what was done and what to do next. Each decision has a flag (`--harness`, `--personas <name,…|none>`, `--link-persona-commands` / `--no-link-persona-commands`, `--model-roles <role=model,…|default>`) and a decision given by flag is never asked; with every decision given, with `--yes`, or with no terminal, nothing is asked and nothing waits for a confirmation. `--dry-run` prints the preview and stops; `--verbose` prints the per-file detail the run used to print by default. What install places is exactly what the operator decided and exactly what `cratylus uninstall` removes: an optional persona not chosen is left out (and one installed before and not chosen now is removed, with its launch command), and a chosen omp `modelRoles` entry is recorded for uninstall like the ones it seeds.

  A model chosen at install is the host's from then on. On Claude Code the deploy manifest now lists, beside `agentModels`, the agents whose `model:` line is the host's (`hostModels`): a chosen line stays when the rendering moves even where it equals the rendered one, a line the host edits stands, and a line the host removes stays removed. A line cratylus rendered and nobody chose follows the rendering, and a manifest written before the list reads as it did. A role the host already routed is never asked and never changed. On omp the same holds of a `modelRoles` entry the operator chose, which the manifest lists as `hostRoutes`; the entry install seeded itself for a role nobody chose is not the host's, so a later install asks that role again and moves the entry to the answer, and an uninstall still removes exactly the lines install put there.

  Projection takes `omitAgents`, leaving named agents out of the render entirely, and reports the plugin set's `optionalAgents` and, per held role, the agents holding it (`roleHolders`). `runDeploy` takes `models` (agent name to a model value) on claude, and a `warn` sink for every warning it and its placers print; a non-empty `models` fails on omp, whose routes live in its own config. The `RoleRouting` port lists the built-in roles an operator may route to (`offered`). A host's `settings.json` is written back in the style it was found in, so an install and the uninstall after it return a compact file byte for byte.

### Patch Changes

- Updated dependencies [3401124]
- Updated dependencies [d65e7db]
- Updated dependencies [2dd4cb1]
- Updated dependencies [3ebd9fc]
  - @cratylus/canon@0.12.0
  - @cratylus/forge@0.12.0

## 0.7.3

### Patch Changes

- Updated dependencies [1947c67]
- Updated dependencies [e6b58b6]
- Updated dependencies [63569f7]
- Updated dependencies [a38f423]
- Updated dependencies [a0e28a8]
  - @cratylus/canon@0.11.1
  - @cratylus/forge@0.11.4
  - @cratylus/runtime@0.8.1

## 0.7.2

### Patch Changes

- Updated dependencies [d3a9597]
- Updated dependencies [f4227d8]
- Updated dependencies [936d174]
  - @cratylus/canon@0.11.0
  - @cratylus/forge@0.11.3
  - @cratylus/runtime@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies [64af893]
  - @cratylus/forge@0.11.2
  - @cratylus/canon@0.10.0

## 0.7.0

### Minor Changes

- 5635979: A unit carries a ledger of what happens to it while it is worked. Four new `plan` verbs write it: `land` (the commit that holds its work), `assay` (a verdict, `achieved` or `not-achieved` with what was missing, on a commit), `whole` (the line's commit holding the unit) and `broke` (the check that failed). An event is admitted only while the unit's plan is bound and the unit is in flight, and is refused on a proposed or closed plan and on a unit not yet started or already done. `plan show <unit> --plan <p>` prints the ledger, each unit's line in `plan show` carries its latest event, and an event's own output prints the unit's line and its ledger and none of its spec. Revise, advance and reconcile carry the ledger over; a unit written before this change reads as an empty ledger.

### Patch Changes

- Updated dependencies [8fe0ea1]
- Updated dependencies [d922882]
- Updated dependencies [15b2e41]
- Updated dependencies [5635979]
  - @cratylus/canon@0.10.0
  - @cratylus/runtime@0.7.0
  - @cratylus/forge@0.11.1

## 0.6.0

### Minor Changes

- 164b9bd: The codex adapter is removed: cratylus projects to Claude Code and omp only.

  `@cratylus/forge` drops `adapters/codex` (the `./adapters/codex` subpath and `codexHarnessAdapter`), and the registry's `HarnessName` is `'claude' | 'omp'`, so `--harness codex` on `project` and `deploy` is refused with the known harnesses named. The port op `HarnessAdapter.scopeOrientation`, which only codex implemented, is removed along with its projection branch. The degrade-and-warn members `preloadsSkills`, `scopes`, `unnarrowed` and `agentExt` stay on the port.

  `@cratylus/canon` rewords the one codex reference left in the stance-judge worker's comment; the regenerated `stance-judge.sh` differs in that comment alone.

- 787d6c7: The persona badge now shows on Claude Code, and on omp it lands in the status line instead of beneath it. On Claude Code the badge is `<mark emoji> <name>` (the name alone for a persona with no mark, no color), in the status line of a session started with `--agent`, and never in a subagent's or a bare session's. `cratylus install` sets it as the status line where the host has none, through one worker that reads the running persona from the status line's own input (`agent.name`) and prints that persona's badge file, or nothing where none was placed. It needs `jq` and fails open without it.

  A status line the host already has is never replaced. Install leaves it byte-identical and prints one line offering `--wrap-status-line`; with that flag the command becomes the worker with the host's command as its one argument, the host's output keeps every byte and gains the badge in front of its first line, every other `statusLine` key such as `padding` is kept, and a second run wraps nothing twice. `--dry-run` writes nothing.

  On omp an extension's status renders inside the status line only where the host lists the `status` segment, and omp reads a segment list only under `statusLine.preset: custom`. Install now edits the config file omp reads (`config.yml`, else `config.yaml`) by the preset the host is on. With no preset set (a file with no `statusLine` included) it writes `preset: custom` with the default preset's own left segments plus `status`, its right segments and its segment options, so the line looks as before with the badge added, and keeps any layout key the host already wrote. On `preset: custom` it appends `status` after the last item of the host's `leftSegments` with no other byte changed, or writes omp's custom left list plus `status` where the host lists none. A host on any other named preset is left byte-identical and told the one addition that would show the badge. A shape it cannot extend is reported and left as it is.

  Where install leaves `status` in the live omp layout it also writes `statusLine.showHookStatus: false` unless the host set that key, so the badge shows once, inline, and not again on the row omp prints beneath the editor. The `status` segment draws every extension's status inline, so none is hidden. A host left on another named preset keeps that row and gets neither the segment nor the key.

  Install never activates a host's own layout. A host with no preset that wrote `leftSegments`, `rightSegments` or `segmentOptions` (ignored or only merged under omp's default preset, and made the whole line by `custom`) is left byte-identical and told what to write: the exact default-preset block that keeps its line and adds the badge, or its own layout made live. The advice replaces only the two lists, which are dormant; the host's own `segmentOptions` are live under every preset, so they are kept, with the default preset's options offered for any the host did not set. `preset: default` written out stays the host's named choice. The advice for a host on another named preset now says that `preset: custom` replaces that preset's layout and gives the whole block: exact lists for `default`, and for any other preset its own segments followed by `status`, and to write that preset's segment options. The host's `separator` setting applies under every preset, so the advice never asks for it.

  The persona-command prompt now says how many commands it will link and how many it will adopt, rather than counting both as one number.

  `@cratylus/forge` adds `HarnessAdapter.statusLine` (the Claude worker's file and the command that runs it) and `HarnessAdapter.statusSegment` (omp's config files, status segment, default layout and custom left list), the claude adapter's badge files and status-line worker in `launchSurface`, `deploy/status-line.ts` with `ensureBadgeStatusLine` and `ensureStatusSegment`, and `deploy/yaml-lines.ts`, the line helpers `model-roles.ts` and `status-line.ts` now share. `cratylus` adds the `install --wrap-status-line` flag.

- 6e6986b: `cratylus install` can make each installed persona a command. `--link-persona-commands` links `~/.local/bin/<persona>` to the harness's launcher, so `planner -p 'hi'` starts a session as the planner persona: on omp through the generated `omp-agent`, and on Claude Code through a new `claude-agent` launcher that starts `claude --agent <persona>` and refuses a name that is no persona with one stderr line and exit 2. Without the flag, install prints one `would place` line per persona and says how to add them; on a terminal it asks first and answers no by default. It says when `~/.local/bin` is not on `PATH`.

  It never overwrites. A name taken by a regular file, by another program's link, or by the other harness's launcher is left as it is and reported as blocked with what is there. A link made by hand to the harness's own launcher, as the interim recipe made them, is adopted: recorded in `personaLinks`, reported as adopted, and never re-created. A persona has one command across harnesses: whichever install links a name first owns it, and the other harness's install reports it as blocked by the first harness's launcher without suffixing a name.

  `@cratylus/forge` adds `HarnessAdapter.launcherFile`, the claude adapter's `launchSurface` (one session-scoped `claude-agent`, staged and deployed like omp's launcher), and `deploy/persona-commands.ts` with `planPersonaCommands`, `placePersonaCommands`, `removePersonaCommands` and `personaLauncherOf`. The links an install placed or adopted are recorded as `personaLinks` in the deploy manifest, and removal takes exactly the recorded links that still resolve to the launcher. There is no `cratylus uninstall` verb yet.

- f4f59d8: `cratylus uninstall --harness <claude|omp>` removes from a harness what `install` placed there, and leaves what the host placed or changed. It removes every recorded file whose bytes still match the digest taken when it was written, the hook registrations install added, the `modelRoles` entries and status line layout it added to omp's `config.yml` (the file comes back byte for byte, your own entries included), the persona commands it placed or adopted, and this harness's stanza of the runtime config. Claude Code's status line goes back to your own command, byte for byte, or is dropped where install set it. The deploy manifest goes last. It prints two lists: what it removed, and what it left because the host placed or changed it, each with its reason: a placed file you edited, a file recorded before digests were kept, a hook entry that now also runs a command of yours, a status line you pointed elsewhere, a config line you rewrote (and only that line: the rest of the run install added still comes out, one line at a time, keeping the headers a line of yours sits under), a persona command you replaced, a file another harness's install still records. `--dry-run` runs every step and writes nothing. `--harness` is required, and an unreadable manifest is refused rather than read as empty.

  `@cratylus/forge` adds to the deploy manifest a `digests` map (the sha-256 of each file a deploy wrote, carried across runs that did not write it) and `hostEdits` (the lines install added to a host-owned text file, as a line diff, so the host's bytes around them are never recorded), with `digestWritten`, `nextDigests`, `noteHostEdit`, `lineHunks`, `undoHunks`, `placedFileState` and `restoreHostStatusLine`. `addModelRoles` and `ensureStatusSegment` return the `edit` they made. A host installed before this release has no digests, so its files are left by an uninstall until an install records them, and no record of its `config.yml` edits: uninstall names the file and leaves it, and a re-install adopts the `modelRoles` lines and `statusLine` block it finds there byte for byte as it would write them (`adopt` on `addModelRoles` and `ensureStatusSegment`), so the next uninstall takes them.

### Patch Changes

- 13b8886: Every claim that cratylus reaches a harness beyond Claude Code and omp is removed, and the two it supports are described as they are.

  `cratylus` describes itself as projecting onto Claude Code and omp, not "any harness", and its README states the differences a user meets: 19 of the 31 canonical events have a native peer on Claude Code and 9 on omp, `eventTap` works on Claude Code only, and the persona badge, the launcher and `modelRoles` routing are omp's.

  `@cratylus/forge` documents `--harness claude|omp` on `deploy` as well as `project`, drops the `@iarna/toml` dependency whose only consumer was the removed codex adapter, and no longer calls omp "the third harness" or claims Cursor reads its neutral root.

- Updated dependencies [e944fac]
- Updated dependencies [2096105]
- Updated dependencies [9435068]
- Updated dependencies [91a71f8]
- Updated dependencies [d25f29f]
- Updated dependencies [164b9bd]
- Updated dependencies [8f1abc6]
- Updated dependencies [6469410]
- Updated dependencies [787d6c7]
- Updated dependencies [406cd7d]
- Updated dependencies [fe6756b]
- Updated dependencies [82de756]
- Updated dependencies [a945bf8]
- Updated dependencies [759518b]
- Updated dependencies [b27e94e]
- Updated dependencies [439e9f4]
- Updated dependencies [52d0b9c]
- Updated dependencies [3141eac]
- Updated dependencies [e53e720]
- Updated dependencies [8e4b59e]
- Updated dependencies [6e6986b]
- Updated dependencies [5d2fceb]
- Updated dependencies [7c7d49b]
- Updated dependencies [7f3e7fb]
- Updated dependencies [f4f59d8]
- Updated dependencies [13b8886]
  - @cratylus/canon@0.9.0
  - @cratylus/forge@0.11.0
  - @cratylus/runtime@0.6.0

## 0.5.2

### Patch Changes

- Updated dependencies [538b742]
  - @cratylus/canon@0.8.0
  - @cratylus/forge@0.10.0

## 0.5.1

### Patch Changes

- Updated dependencies [b8c0097]
- Updated dependencies [67b10c4]
- Updated dependencies [9cdfa03]
  - @cratylus/canon@0.7.0
  - @cratylus/runtime@0.5.0
  - @cratylus/forge@0.9.1

## 0.5.0

### Minor Changes

- eff81ef: The runtime ships four capabilities, built in, and nothing else

  `eventTap`, `design`, `plan` and `note` are the capabilities, each a module of the runtime and known when it is built. The runtime routes exactly these four, each to its own verb surface; nothing is discovered, registered or loaded, and nothing is scoped to a session. `memory` and `heartbeat` are no longer commands: `cratylus` hands any first word that is not one of the four to the projector. Every refusal the event tap raises now opens with `eventTap:` (`eventTap install:` and the like) rather than `event-tap:`.

  **Breaking for `@cratylus/runtime`.** The subpaths `./loader`, `./dispatch` and `./ports/memory` are removed, and with them `RuntimeHost`, `bootstrap`, `discoverConfigured`, `dispatch`, `parseArgs`, `verbsOf`, `MemoryStrategy`, `RuntimePlugin` and `defineRuntimePlugin`; the `heartbeat` port and capability are removed; `capabilities/event-tap` no longer exports `runtimePlugin`. `CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, and `SESSION_SCOPED` is removed. `runCli(argv)` takes no options. `RuntimeConfig` loses the provider keys `capabilities` and `resolveFrom`: a host config is live when it carries `events`, `harnesses` or `configuration`, and the provider keys in an existing `~/.cratylus.json` are ignored.

  **Breaking for `@cratylus/forge`.** `emitRuntimeConfig` and `runtimeConfigDocument` no longer take, write or carry over `capabilities` and `resolveFrom`, and `EmittedRuntimeConfig` loses both; a deploy drops them from an existing host config. `ResolvedSkill` loses `toolSection` and `skillDescription`; every projected skill's front-matter carries its `description`, and claude's carries its `trigger`. Projected SKILL.md bytes are unchanged.

  **Breaking for `@cratylus/schema`.** `SkillDeploy.deployAs` is removed.

  **Breaking for `@cratylus/canon`.** `RUNTIME_CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, so a cell naming `heartbeat` no longer compiles.

- 407ab9b: An unknown flag on `eventTap` is refused, and nothing is written

  Each `eventTap` verb declares, beside the verb, the flags it takes: `install`
  takes `--events`, `--sink` and `--settings`; `uninstall`, `read` and `status`
  take `--settings`. A flag the verb does not take used to be dropped without a
  word, so `eventTap install --evnets turn.end` failed only on the missing
  `--events`, and `eventTap status --sink x` ran as if the flag were not there.
  Each such flag, and a single-dash token such as `-x`, is now refused through
  `@cratylus/runtime/verb-flags` before the verb acts: before the host config is
  read, and before any settings file or sink is touched, so the call exits `1`
  whether or not the host is configured. The refusal names every such flag as
  given, the verb's nearest flag to each when one is close, and every flag the
  verb takes.

  `eventTap` now reads `--flag=value` as `--flag value`, as `design`, `plan` and
  `note` do: `install --events=turn.end` used to fail for want of `--events`, and
  now installs. An undeclared `--evnets=turn.end` is refused as `--evnets`.

- 7a75e6d: A flag that takes no value never takes the next token

  Each verb of `design`, `plan`, `note` and `eventTap` now declares, beside the
  verb, whether each flag it takes takes a value, and one reader in
  `@cratylus/runtime/verb-flags` reads every verb's arguments against that
  declaration. A flag that takes a value is given as `--flag value` or
  `--flag=value`, and takes the next token unless it begins with `--`. A flag
  that takes none, `plan`'s `--repin`, is given alone and never takes the next
  token: `plan revise u --plan p --repin -x …` used to read `-x` as `--repin`'s
  value and write, and now refuses `-x` and writes nothing. `--repin=x` is refused
  rather than having its value dropped.

  `@cratylus/runtime/verb-flags` carries `VerbFlags`, in which each verb maps each
  flag it takes to `'value'` or `'switch'`, the per-verb `Flags`, the reader
  `readArgv` and the `Argv` it returns, and `refused` and `nearest`, which take a
  verb's `Flags`.

- 5ee80c0: `cratylus memory` is gone

  The command no longer bundles the memory capability, so `cratylus memory`
  and every verb under it now refuse instead of running. Nothing is migrated:
  no verb of this command reads or writes a memory store any more, and a store
  already on disk is left where it is.

- 85df8f7: The host runtime config keeps one stanza of native event names per harness

  `~/.cratylus.json` (or `$AGENT_RUNTIME_CONFIG`) held one flat map of native event names, so the last deploy won: deploying for Claude and then for omp left Claude reading omp's names. Native names now live in one stanza per harness, `harnesses.<harness>.native`. A deploy writes the corpus's parts (`events.vocabulary`, `configuration`) and its own harness's stanza, and leaves every other harness's stanza as it found it. The deploy log names the stanza it wrote.

  `@cratylus/runtime`: `nativeEventsOf(config, harness)` is the one reader of native names. It returns that harness's stanza, or throws a refusal naming `cratylus install --harness <harness>` and `cratylus deploy --harness <harness>`. `RuntimeConfig` gains `harnesses`, and `RuntimeEvents` loses `native`. `cratylus eventTap` asks for `claude`'s names through it.

  `@cratylus/forge`: `emitRuntimeConfig` and `runtimeConfigDocument` take the harness's name (`harness`, the adapter's `name`) with its `nativeEvents`, and the result carries the `stanza` written. `EmittedEvents` loses `native`, and `EmittedRuntimeConfig` gains `harnesses`.

  **Breaking.** The old flat shape is not read. On a host deployed before this change, `cratylus eventTap` refuses until you run `cratylus install --harness claude` or `cratylus deploy --harness claude` once.

- 978e1a7: Every projected runtime shim is one plain forwarder, and none needs a session

  `cratylus project` now emits the same `scripts/<capability>.mjs` for every
  capability on every harness: it passes its arguments to `cratylus <capability>`
  with the caller's environment and exits with that command's status. A shim no
  longer copies a harness's session variable into `$AGENT_SESSION_ID`, and the omp
  shim no longer exits `3` asking for `$AGENT_SESSION_ID` or
  `$AGENT_SESSION_ID_FROM`.

  **Breaking for `@cratylus/forge`.** `HarnessAdapter.sessionEnvVars` is removed,
  so an out-of-tree adapter drops the field. `emitRuntimeShim(skillDir, capability)`
  takes no session-variable list. `PlaceReport` loses `seeded` and `present`, which
  deploy initialized and never wrote.

- 0a0af25: An unknown flag on `design`, `plan` or `note` is refused, and nothing is written

  Each verb of the three domain capabilities declares, beside the verb, the flags
  it takes. A flag the verb does not take used to be dropped without a word, and a
  single-dash token such as `-x` was read as a name; each is now refused before
  the verb acts, so nothing is written, and the call exits `1`. One refusal names
  every such flag as given, the verb's nearest flag to each when one is close
  (`--glose` and `-gloss` suggest `--gloss`), and every flag the verb takes, and
  asks for the call to be corrected and run again. `--name`, `--state` and
  `--repin` on `plan add`, and `--state` on `plan revise`, are refused the same
  way, as flags those verbs do not take.

  The refusal has one home, the new subpath `@cratylus/runtime/verb-flags`, which
  every capability's verbs read their arguments through.

### Patch Changes

- Updated dependencies [eff81ef]
- Updated dependencies [407ab9b]
- Updated dependencies [7a75e6d]
- Updated dependencies [85df8f7]
- Updated dependencies [978e1a7]
- Updated dependencies [0a0af25]
  - @cratylus/runtime@0.4.0
  - @cratylus/forge@0.9.0
  - @cratylus/canon@0.6.0

## 0.4.0

### Minor Changes

- bcc1411: omp: the persona badge — the running persona's mark emoji and name in the status line

  `cratylus project --harness omp` now emits one `cratylus-persona-badge.ts` extension module per projected persona, placed in that persona's own `agent/personas/<name>/extensions/`. In a top-level interactive session it sets the status line to the persona's mark emoji and name, or the name alone for an agent with no provenance; a subagent and a headless session show nothing. The text is baked at projection, and no hue is carried because omp strips color from an extension's status text.

  **Breaking for out-of-tree `HarnessAdapter` implementers.** `launchSurface` now takes the composed agents, `launchSurface(agents: readonly Agent[])`, instead of their names, `launchSurface(agentNames: readonly string[])`. An implementation that only needs the names reads `agents.map((a) => a.name)`.

### Patch Changes

- Updated dependencies [bcc1411]
  - @cratylus/forge@0.8.0
  - @cratylus/canon@0.5.0

## 0.3.0

### Minor Changes

- 8a906ae: `cratylus design`, `cratylus plan` and `cratylus note`: the design, plans and notebook as computed state

  Three new commands reach the runtime's record capabilities. Each shows its whole domain by default and one item when named (`design show [<concept>]`, `plan show [<plan> | <unit> --plan <p>]`, `note show [<title>]`), and writes through its own verbs: `design define | amend | retract | reconcile | trace`, `plan add | advance | retract | revise | bind | close | reconcile`, and `note capture | revise | retract | reconcile`. Every write carries `--author`, `--reason` and `--cause`. The state is computed from immutable records in the repository at the moment it is read, and nothing is cached.

  **Breaking.** `cratylus carryOn` is removed along with the runtime capability behind it.

### Patch Changes

- bf103d9: Plans live only in the plan records; the plan-folder layout is gone

  The state folders, the plan markers and the tooling that read them are
  deleted: canon's `plan-states.ts` (`PLAN_STATES`, `PLAN_FRONTIER`,
  `PLAN_MARKERS`), `tooling/plan-set.ts` and its CLI and shell mechanism, and the
  `plan-set` and `plan` scripts. Plan state has one home, the `plan` capability.

  **Breaking.** The runtime `carryOn` capability is removed: its verb surface,
  the `CarryOnHost` port, the `carryOn` member of `CAPABILITIES` and canon's
  `RUNTIME_CAPABILITIES`, the `RuntimePlugin.carryOn` field and the `carryOn`
  route. The `carry-on` skill is unchanged; it declares no capability.

  **Breaking.** Memory no longer treats plans specially. `PLAN.md` is not a
  boundary marker, so a directory holding one resolves like any other, and the
  audit's `plan-path` marker class is gone.

  `command-veracity` no longer carries the plan-path and designator laws, whose
  subject was the layout. It exempts the records root and changelogs as history.
  The owed-signification marker gate's sanctioned home for recorded debt is now
  the notebook's records.

- Updated dependencies [b34b1c5]
- Updated dependencies [43952d1]
- Updated dependencies [844ef6b]
- Updated dependencies [fcf5db6]
- Updated dependencies [52c73fd]
- Updated dependencies [7b71bc8]
- Updated dependencies [36a0511]
- Updated dependencies [85ec0ce]
- Updated dependencies [21e41e1]
- Updated dependencies [6f18d1c]
- Updated dependencies [c5bc3d9]
- Updated dependencies [bf103d9]
- Updated dependencies [eeab4cc]
- Updated dependencies [e2db96f]
- Updated dependencies [a12cf83]
- Updated dependencies [859d0fa]
- Updated dependencies [a66800e]
- Updated dependencies [0dcbc9a]
- Updated dependencies [235f77d]
  - @cratylus/runtime@0.3.0
  - @cratylus/forge@0.7.0
  - @cratylus/canon@0.5.0
  - @cratylus/memory@0.2.0

## 0.2.7

### Patch Changes

- Updated dependencies [64f6f7b]
  - @cratylus/canon@0.4.0

## 0.2.6

### Patch Changes

- Updated dependencies [a6dc4ec]
- Updated dependencies [a6dc4ec]
  - @cratylus/forge@0.6.0
  - @cratylus/canon@0.3.0

## 0.2.5

### Patch Changes

- Updated dependencies [317ba47]
- Updated dependencies [b0bc847]
- Updated dependencies [b0bc847]
- Updated dependencies [f1c41e1]
- Updated dependencies [848288e]
- Updated dependencies [4e6e7aa]
- Updated dependencies [e2b2263]
- Updated dependencies [a1944fc]
- Updated dependencies [94b3a7b]
- Updated dependencies [0cca8bc]
- Updated dependencies [fc9b334]
- Updated dependencies [415a112]
- Updated dependencies [693a056]
  - @cratylus/forge@0.5.0
  - @cratylus/canon@0.2.0

## 0.2.4

### Patch Changes

- Updated dependencies [985aa89]
  - @cratylus/canon@0.1.3

## 0.2.3

### Patch Changes

- Updated dependencies [805d19b]
- Updated dependencies [805d19b]
  - @cratylus/canon@0.1.2
  - @cratylus/forge@0.4.1

## 0.2.2

### Patch Changes

- Updated dependencies [ae56e1e]
- Updated dependencies [fee5ade]
- Updated dependencies [ca1b9aa]
- Updated dependencies [844811e]
  - @cratylus/canon@0.1.1
  - @cratylus/forge@0.4.0

## 0.2.1

### Patch Changes

- `--version` reports THIS package's version, not the projector's

  `cratylus` owns the `bin` key but delegated `--version` to `@cratylus/forge/cli`,
  which reports forge's own manifest. While both packages carried the same number
  that was invisible; this is the first release to bump them apart, and it would
  have shipped `cratylus@0.2.1` announcing itself as `0.3.0`. Caught by
  `version-single-home`, which runs the built bin exactly as a consumer's shell
  does. The owner of the bin now passes its version down, for the same reason it
  owns the command's name: neither is a fact the projector can compute about a
  consumer of it.

- d31a769: `install` no longer leaves a host without an event vocabulary

  The zero-config `install` path placed agents, skills and hooks and then warned that
  no `cratylus.config.ts` was found, so the host config was not emitted and runtime
  capabilities on that host could not validate an event name — leaving `carry-on` and
  `event-tap` inert. `install` IS the zero-config path; there is no config file by
  definition, and deploy was being sent to read the vocabulary back off disk from a
  file that cannot exist. It already resolves its plugins in memory, so it now hands
  the vocabulary to deploy as a parameter.

  Fixed in `d4a01b7c` and released here. The repair has been on `main` since
  2026-08-07 and shipped to nobody: the commit carried no changeset, so the release
  workflow ran, found no version to bump, published nothing, and reported success.
  Every host installed from `cratylus@0.2.0` carries the bug.

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

- Updated dependencies [d31a769]
  - @cratylus/forge@0.3.0
  - @cratylus/canon@0.1.0

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

- Updated dependencies [26f6fef]
- Updated dependencies [3e9c103]
  - @cratylus/canon@0.1.0
  - @cratylus/forge@0.2.0
  - @cratylus/runtime@0.2.0
  - @cratylus/memory@0.1.2

## 0.1.1

### Patch Changes

- a019716: Every CLI reports the version its manifest declares.

  `0.1.0` shipped with `cratylus-run --version` and `cratylus --version` answering `0.0.0`: the
  number was a literal in TypeScript, and `changeset version` rewrites manifests rather than
  source, so the two diverged at the first release and would have stayed diverged. Each now
  reads its own manifest by package self-reference, and a gate holds the shape.

- Updated dependencies [a019716]
  - @cratylus/runtime@0.1.1
  - @cratylus/memory@0.1.1

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
  - @cratylus/memory@0.1.0
  - @cratylus/runtime@0.1.0
