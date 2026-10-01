# @cratylus/invoke

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
