# @cratylus/forge

## 0.11.2

### Patch Changes

- 64af893: On omp, a guard whose judge stopped answering now asks it again after a cooldown instead of staying dark for the rest of the session: once three consecutive calls miss their deadline the judge is skipped for two minutes, the first fire after that asks it once, an answer clears the outage and a miss starts a new cooldown. A guard also says so again when a later outage follows a recovery, even when the notice reads the same as the first. A call that was answered no longer counts a miss when its deadline timer later fires.

## 0.11.1

### Patch Changes

- Updated dependencies [5635979]
  - @cratylus/runtime@0.7.0

## 0.11.0

### Minor Changes

- 91a71f8: `cratylus install` now wraps a host's own Claude Code status line in the persona badge by default, so a persona's name and mark stay visible in the status line of its session wherever the host has one. The host's command becomes the badge worker's one argument: in a session that runs no persona its output reaches the status line byte for byte, and in a persona's session the badge and a space go in front of its first line. Every other `statusLine` key such as `padding` is kept, install prints what it changed and how the host's output is kept, and a second install changes no byte. The `--wrap-status-line` flag is removed; it no longer chooses anything.

  The host's original command is recorded in the deploy manifest (`DeployManifest.statusLine`: the `command` install placed, and the host's own, `null` where the host had none), and a wrapped status line found on a host installed before the record is recorded on the next install, so an uninstall can restore the host's line exactly. A `statusLine` that is not a `command` one is left as it is and install says that Claude Code rejects such a settings file and runs no status line, so no badge can show there until it is fixed.

  `ensureBadgeStatusLine` drops its `wrap` option and the `offer` state, and its result now carries `placed` and `host`.

  On omp, a host on a named preset other than `custom`, or with a layout of its own and no preset, has no `status` segment in its line, so the row omp prints beneath the editor is where the badge shows. Where such a host had turned that row off (`statusLine.showHookStatus: false`), the badge showed nowhere while install said it rendered beneath the line; install now turns that one value to `true`, changes no other byte, and says so. The same holds for a `custom` list install cannot extend and for a `statusLine` it cannot read at all (a flow mapping on one line or over several, a `preset` that is not a plain value, a file with no block mapping): the key is found as text and turned on there too. Only a `statusLine` that is an alias to a mapping written elsewhere keeps it out of reach, and install says the badge shows nowhere then. `ensureStatusSegment`'s result carries `hookRowShown` for it.

- 164b9bd: The codex adapter is removed: cratylus projects to Claude Code and omp only.

  `@cratylus/forge` drops `adapters/codex` (the `./adapters/codex` subpath and `codexHarnessAdapter`), and the registry's `HarnessName` is `'claude' | 'omp'`, so `--harness codex` on `project` and `deploy` is refused with the known harnesses named. The port op `HarnessAdapter.scopeOrientation`, which only codex implemented, is removed along with its projection branch. The degrade-and-warn members `preloadsSkills`, `scopes`, `unnarrowed` and `agentExt` stay on the port.

  `@cratylus/canon` rewords the one codex reference left in the stance-judge worker's comment; the regenerated `stance-judge.sh` differs in that comment alone.

- 8f1abc6: The scope-enrolled guards now judge on Claude Code, and only the agents that compose them. They fired from `settings.json` on every turn and exited at their scope gate, because the gate read only the `stance_scope` that omp's dispatcher supplies, so a Claude Code session was never judged and nothing said so.

  `@cratylus/schema` adds the projection facts `harness-persona-root` and `stance-manifest`, and `HookCell.binds`: the composition (a dimension and optionally one value's anchor) that makes a cell a guard and binds an agent to it. A cell without `binds` binds nobody.

  `@cratylus/forge` builds the stance manifest once, in `core/enrollment.ts`, and the projector stages it for every adapter that declares `scopedRel`. Each persona's manifest lists exactly the guards its composed agent includes, never every cell for every persona and never the drift notice, so omp's rendered manifests drop the `deploy-drift-notice` gate they used to carry. The claude adapter now declares `scopedRel`, placing a persona scope at `personas/<name>/` under `.claude`. `OMP_STANCE_MANIFEST` is now `STANCE_MANIFEST` in that module, and `install` logs the file as a stance manifest rather than as mechanism. A harness with no `scopedRel` cannot name the running agent, so projection warns once per guard and carries it as a steer, withholding its registration and workers. On omp, `tool.use.pre` now reaches its worker with the real `tool_name` (mapped from omp's `write`, `edit`, `task` and `ask`) instead of an empty one. `deploy` also stops dropping a cell's second matcher group on one event when it merges `settings.json`, which had left the stance dispatch guard and purview's every-tool group unregistered on a deployed host; an identical group is still added once.

  `@cratylus/canon` resolves the scope in all three guard workers as `stance_scope` when present, and otherwise as `<harness home>/<persona root>/<agent_type>` when the payload names an agent. A bare session and an agent with no manifest stay silent, and an `agent_type` that is not one directory name is refused. The turn-end worker now judges a subagent's own transcript (`agent_transcript_path`) rather than its parent's, and takes the closing message from the payload's `last_assistant_message`, because Claude Code fires Stop before that message reaches the transcript, so a turn that was only text went unjudged. Purview now reads the shared judge seam (`STANCE_EMIT_PAYLOAD`, `STANCE_VERDICT_FILE`) like its siblings; under its own `PURVIEW_` names the omp bridge got no payload back and it judged nothing there. The workers take the manifest path from the `stance-manifest` fact, and the regenerated `.sh` targets differ accordingly.

- 6469410: A Claude Code `--agent` main session now starts with the persona's composed skills, as a dispatched holder of the same position does. Claude preloads an agent definition's `skills` only for a subagent, so a persona launched by name (`claude --agent mav`) held none of them.

  Every projected agent that has skills now carries a `SessionStart` entry, in the same single `hooks:` block as any enforcing entries, on the sources `startup|clear|compact` (a resumed session already holds them). The entry holds one command per skill, in the agent's `skills` order. Each prints the line `Base directory for this skill: <dir>` and that skill's `SKILL.md` with its front matter stripped, read from `$HOME/.claude/skills/<name>` when the session starts. The hook does not fire when the agent is dispatched as a subagent, so no skill loads twice. A skill whose `SKILL.md` is absent is named under `## Required reading`, one stderr line names the agent and the skill, and the command still exits 0. An agent with no skills gets no entry. A project-level `.claude/skills/<name>` that shadows the user-level copy is not consulted.

  Each skill is its own command because Claude Code caps one hook's output at 10,000 characters and, over that, hands the model a 2,000-character preview and a file path instead: a single command printing mav's four-skill closure (25,603 characters) reached the model as that preview. The cap is measured per hook, so every body arrives whole. Claude runs an event's hooks in parallel, so the order the bodies reach the model in is not guaranteed to be the `skills` order (observed in one of four live runs); each skill is self-contained and names its own base directory.

  A skill whose output would exceed the cap is never trimmed and never printed. Projection weighs each skill an agent is given against the adapter's declared cap and, for one over it, warns once by name, size and cap, and its hook handler prints a `## Required reading` notice naming the skill in place of the body, so the Skill tool loads it on demand. The notice is a hook and not a section of the definition, so it reaches the `--agent` main session only: a dispatched holder of the same position has the skill preloaded (it stays in `skills`, at any size) and is never told to load it again.

  The hook prints each skill's directory, so the size depends on the host's home. `cratylus project` does not know it and counts `$HOME` as written, a lower bound; `cratylus install` weighs against the home it installs under, and its warning names that home. The largest shipped skill, `plan`, prints 9,953 characters with `$HOME` unexpanded, 47 under the cap, so a home path longer than 52 characters degrades it at install, with the warning, rather than silently at run time. `canon`'s `skill-hook-cap` gate prints every size against the cap. A home that differs at run time from the one installed under is not measured.

  `@cratylus/forge` adds `adapters/claude/persona-launch.ts` (`personaSkillCommand`, `personaSkillOutputSize`, `personaRequiredReadingCommand`, `PERSONA_LAUNCH_MATCHER`, `CLAUDE_HOOK_OUTPUT_CAP`, `PersonaSkillRoots`). The adapter port gains `HarnessAdapter.mainSessionSkillHook` (its `cap`, and the `size` of what the hook prints for a skill under a given host home), `AgentDefContext.oversizedSkills` and `ProjectOpts.hostHome`.

- 787d6c7: The persona badge now shows on Claude Code, and on omp it lands in the status line instead of beneath it. On Claude Code the badge is `<mark emoji> <name>` (the name alone for a persona with no mark, no color), in the status line of a session started with `--agent`, and never in a subagent's or a bare session's. `cratylus install` sets it as the status line where the host has none, through one worker that reads the running persona from the status line's own input (`agent.name`) and prints that persona's badge file, or nothing where none was placed. It needs `jq` and fails open without it.

  A status line the host already has is never replaced. Install leaves it byte-identical and prints one line offering `--wrap-status-line`; with that flag the command becomes the worker with the host's command as its one argument, the host's output keeps every byte and gains the badge in front of its first line, every other `statusLine` key such as `padding` is kept, and a second run wraps nothing twice. `--dry-run` writes nothing.

  On omp an extension's status renders inside the status line only where the host lists the `status` segment, and omp reads a segment list only under `statusLine.preset: custom`. Install now edits the config file omp reads (`config.yml`, else `config.yaml`) by the preset the host is on. With no preset set (a file with no `statusLine` included) it writes `preset: custom` with the default preset's own left segments plus `status`, its right segments and its segment options, so the line looks as before with the badge added, and keeps any layout key the host already wrote. On `preset: custom` it appends `status` after the last item of the host's `leftSegments` with no other byte changed, or writes omp's custom left list plus `status` where the host lists none. A host on any other named preset is left byte-identical and told the one addition that would show the badge. A shape it cannot extend is reported and left as it is.

  Where install leaves `status` in the live omp layout it also writes `statusLine.showHookStatus: false` unless the host set that key, so the badge shows once, inline, and not again on the row omp prints beneath the editor. The `status` segment draws every extension's status inline, so none is hidden. A host left on another named preset keeps that row and gets neither the segment nor the key.

  Install never activates a host's own layout. A host with no preset that wrote `leftSegments`, `rightSegments` or `segmentOptions` (ignored or only merged under omp's default preset, and made the whole line by `custom`) is left byte-identical and told what to write: the exact default-preset block that keeps its line and adds the badge, or its own layout made live. The advice replaces only the two lists, which are dormant; the host's own `segmentOptions` are live under every preset, so they are kept, with the default preset's options offered for any the host did not set. `preset: default` written out stays the host's named choice. The advice for a host on another named preset now says that `preset: custom` replaces that preset's layout and gives the whole block: exact lists for `default`, and for any other preset its own segments followed by `status`, and to write that preset's segment options. The host's `separator` setting applies under every preset, so the advice never asks for it.

  The persona-command prompt now says how many commands it will link and how many it will adopt, rather than counting both as one number.

  `@cratylus/forge` adds `HarnessAdapter.statusLine` (the Claude worker's file and the command that runs it) and `HarnessAdapter.statusSegment` (omp's config files, status segment, default layout and custom left list), the claude adapter's badge files and status-line worker in `launchSurface`, `deploy/status-line.ts` with `ensureBadgeStatusLine` and `ensureStatusSegment`, and `deploy/yaml-lines.ts`, the line helpers `model-roles.ts` and `status-line.ts` now share. `cratylus` adds the `install --wrap-status-line` flag.

- 406cd7d: A Claude Code agent definition now names the model tier of the role its agent holds, so a dispatched implementer no longer runs on whatever model its parent session uses, and a `claude --agent planner` session no longer runs on the account default. The definition carries `model: <tier>` right after its `description`: `sonnet` for an implementer, `opus` for a planner, assayer or architect. An agent holding any other role, or none, carries no `model` and runs on the session's model. Only a tier alias is emitted, never a model id or version, so the alias resolves to whatever Claude currently serves for that tier.

  The host's own choice outranks the definition. For a `--agent` main session it is `--model`. For a dispatched subagent it is `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` together with `CLAUDE_CODE_SUBAGENT_MODEL=<model>`; `CLAUDE_CODE_SUBAGENT_MODEL` alone leaves the definition's tier standing (observed on Claude Code 2.1.285).

  The table lives in the claude adapter alone, and canon names no tier. `roleRouting` stays absent on claude, since `install` seeds no claude config and the omp projection and install are unchanged. The `RoleRouting` doc on the adapter port no longer says an absent table means definitions carry no route: a harness may route by tier in its own definitions.

- 759518b: The event tap no longer pretends to attach to omp.

  `@cratylus/runtime`: `cratylus eventTap <verb>` now resolves which harness invoked it and refuses when that harness has no tap strategy. Only Claude Code has one today, so from an omp session every verb exits non-zero, names omp and Claude Code, and writes nothing. Before, `install` wrote `<cwd>/.claude/settings.json`, a file omp never reads, and `status` reported `attached: true` for a tap that captured nothing. The harness is read from the invoking environment, not the host config: the config holds one stanza per deployed harness, so on a host with both it cannot say which is calling. omp exports `OMPCODE` and also Claude Code's `CLAUDECODE`, so omp is tested first. A caller whose environment names no harness still gets Claude Code, as before. New exports from `@cratylus/runtime/capabilities/event-tap`: `EVENT_TAP_HARNESSES`, `hasEventTapStrategy`, `invokingHarness`; `EventTapDispatchOpts` gains `harness` and `env`.

  `@cratylus/forge`: `project` warns once when a corpus declares the `eventTap` capability and the target harness has no tap strategy, naming the skill, the capability and the harness and saying no events are captured there. The skill and its shim still ship as a declaration.

  `eventTap install` on Claude Code no longer drops events silently. The result's `events` lists only the events actually tapped, and any requested event Claude Code fires no native event for appears under `skipped`, each with its reason, and draws a stderr warning naming the event and Claude Code. When none of the requested events can be tapped, `install` refuses and writes nothing, instead of registering an empty hook block. `EventTapHostClaude.install` now returns the `EventTapInstall` report; `EventTapDispatchOpts` gains `warn`.

- 6e6986b: `cratylus install` can make each installed persona a command. `--link-persona-commands` links `~/.local/bin/<persona>` to the harness's launcher, so `planner -p 'hi'` starts a session as the planner persona: on omp through the generated `omp-agent`, and on Claude Code through a new `claude-agent` launcher that starts `claude --agent <persona>` and refuses a name that is no persona with one stderr line and exit 2. Without the flag, install prints one `would place` line per persona and says how to add them; on a terminal it asks first and answers no by default. It says when `~/.local/bin` is not on `PATH`.

  It never overwrites. A name taken by a regular file, by another program's link, or by the other harness's launcher is left as it is and reported as blocked with what is there. A link made by hand to the harness's own launcher, as the interim recipe made them, is adopted: recorded in `personaLinks`, reported as adopted, and never re-created. A persona has one command across harnesses: whichever install links a name first owns it, and the other harness's install reports it as blocked by the first harness's launcher without suffixing a name.

  `@cratylus/forge` adds `HarnessAdapter.launcherFile`, the claude adapter's `launchSurface` (one session-scoped `claude-agent`, staged and deployed like omp's launcher), and `deploy/persona-commands.ts` with `planPersonaCommands`, `placePersonaCommands`, `removePersonaCommands` and `personaLauncherOf`. The links an install placed or adopted are recorded as `personaLinks` in the deploy manifest, and removal takes exactly the recorded links that still resolve to the launcher. There is no `cratylus uninstall` verb yet.

- 7c7d49b: The prime principle is carried only by the cells whose laws apply it, no longer stamped on every projected cell.

  `AgentPlugin.preamble` is removed from `@cratylus/schema`, along with `ProjectOpts.preamble` and the plugin-wide stamping in `@cratylus/forge` (agent and skill projection, `resolveSkills`). A plugin that set `preamble:` must move the block onto the cells that need it. `Skill` gains an optional `preamble`, the same shape `Agent.preamble` already had, and projection emits it as the first section of that skill's SKILL.md.

  `@cratylus/canon` drops `preamble` from its plugin and sets `primePrinciple` on the ten skills that name concepts by anchor, optimal sign or cold decode: `create-skill`, `deliver`, `design`, `exemplify`, `formalize`, `introspect`, `materialize`, `plan`, `probe` and `signify`. The other six skills carry no `## Prime Principle`, and no agent does: each agent already carries cratylism once through its held role's engineering-principles, where it previously carried it twice. The stance-guardrail operator-slot filter now recognizes a skill body by its verb H1 over the fenced formal block instead of by `## Prime Principle`.

- 7f3e7fb: `cratylus install --harness claude` no longer overwrites the model a host chose for an agent. Claude Code sets a subagent's model in one place, the `model:` line of its definition, and every install used to write the tier back. The deploy manifest now records, per placed claude definition, the `model:` value it rendered (`agentModels`); a deployed definition whose `model:` line differs from that record keeps the host's line in the definition placed over it (a line the host removed stays removed, and one it added stays), every other line is replaced as before, and the install output names each agent whose model it kept. A root installed before the record existed has none: its definitions were written without a `model:` line, so a `model:` line found there is the host's and is kept, and a definition with none takes the rendered tier.

  Install also shows the roles as settable on Claude Code: one line per held role with its tier and the `model:` line that sets it, and the `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` with `CLAUDE_CODE_SUBAGENT_MODEL=<model>` override for every subagent.

  The new integrator role routes like the implementer's spec-bounded work: `model: sonnet` on Claude Code, and the built-in `@task` role on omp. omp's `modelRoles` entries stay the host's and are never changed.

- f4f59d8: `cratylus uninstall --harness <claude|omp>` removes from a harness what `install` placed there, and leaves what the host placed or changed. It removes every recorded file whose bytes still match the digest taken when it was written, the hook registrations install added, the `modelRoles` entries and status line layout it added to omp's `config.yml` (the file comes back byte for byte, your own entries included), the persona commands it placed or adopted, and this harness's stanza of the runtime config. Claude Code's status line goes back to your own command, byte for byte, or is dropped where install set it. The deploy manifest goes last. It prints two lists: what it removed, and what it left because the host placed or changed it, each with its reason: a placed file you edited, a file recorded before digests were kept, a hook entry that now also runs a command of yours, a status line you pointed elsewhere, a config line you rewrote (and only that line: the rest of the run install added still comes out, one line at a time, keeping the headers a line of yours sits under), a persona command you replaced, a file another harness's install still records. `--dry-run` runs every step and writes nothing. `--harness` is required, and an unreadable manifest is refused rather than read as empty.

  `@cratylus/forge` adds to the deploy manifest a `digests` map (the sha-256 of each file a deploy wrote, carried across runs that did not write it) and `hostEdits` (the lines install added to a host-owned text file, as a line diff, so the host's bytes around them are never recorded), with `digestWritten`, `nextDigests`, `noteHostEdit`, `lineHunks`, `undoHunks`, `placedFileState` and `restoreHostStatusLine`. `addModelRoles` and `ensureStatusSegment` return the `edit` they made. A host installed before this release has no digests, so its files are left by an uninstall until an install records them, and no record of its `config.yml` edits: uninstall names the file and leaves it, and a re-install adopts the `modelRoles` lines and `statusLine` block it finds there byte for byte as it would write them (`adopt` on `addModelRoles` and `ensureStatusSegment`), so the next uninstall takes them.

### Patch Changes

- b27e94e: A guard that lets a turn or a call through without a verdict now says so where the operator reads it, instead of passing as silently as a judged clean turn. The turn-end stance guard, the pre-tool stance guard and the purview guard each print a notice naming the guard and why it could not judge (no `jq`, no input, an unreadable transcript, a missing Target or manifest agent, a judge that fails or does not answer, an unparseable verdict, a block discarded because the span it cited is not in the turn or call, state it cannot write, an unexpected error, and each re-entry cap: no progress, a spent bypass, an identical call already denied once) and still exit 0, so nothing wedges. On Claude Code the notice is the hook's JSON `systemMessage`, the only form that harness shows the session; on omp it is a bare line, and the omp hook bridge now relays every such line, from either of its two passes and whatever the line opens with (it relayed only lines naming the stance guard and `DARK`, and dropped anything printed before the judge was asked), without ever failing the fire on it. A judged pass, an unenrolled scope and a call that carries nothing to judge stay silent. The notice builders use shell builtins only, so a worker running with nothing but `sh` and `cat` on its `PATH` can still speak.
- 13b8886: Every claim that cratylus reaches a harness beyond Claude Code and omp is removed, and the two it supports are described as they are.

  `cratylus` describes itself as projecting onto Claude Code and omp, not "any harness", and its README states the differences a user meets: 19 of the 31 canonical events have a native peer on Claude Code and 9 on omp, `eventTap` works on Claude Code only, and the persona badge, the launcher and `modelRoles` routing are omp's.

  `@cratylus/forge` documents `--harness claude|omp` on `deploy` as well as `project`, drops the `@iarna/toml` dependency whose only consumer was the removed codex adapter, and no longer calls omp "the third harness" or claims Cursor reads its neutral root.

- Updated dependencies [8f1abc6]
- Updated dependencies [759518b]
- Updated dependencies [7c7d49b]
  - @cratylus/schema@0.6.0
  - @cratylus/runtime@0.6.0

## 0.10.0

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

### Patch Changes

- Updated dependencies [538b742]
  - @cratylus/schema@0.5.0

## 0.9.1

### Patch Changes

- Updated dependencies [67b10c4]
  - @cratylus/runtime@0.5.0

## 0.9.0

### Minor Changes

- eff81ef: The runtime ships four capabilities, built in, and nothing else

  `eventTap`, `design`, `plan` and `note` are the capabilities, each a module of the runtime and known when it is built. The runtime routes exactly these four, each to its own verb surface; nothing is discovered, registered or loaded, and nothing is scoped to a session. `memory` and `heartbeat` are no longer commands: `cratylus` hands any first word that is not one of the four to the projector. Every refusal the event tap raises now opens with `eventTap:` (`eventTap install:` and the like) rather than `event-tap:`.

  **Breaking for `@cratylus/runtime`.** The subpaths `./loader`, `./dispatch` and `./ports/memory` are removed, and with them `RuntimeHost`, `bootstrap`, `discoverConfigured`, `dispatch`, `parseArgs`, `verbsOf`, `MemoryStrategy`, `RuntimePlugin` and `defineRuntimePlugin`; the `heartbeat` port and capability are removed; `capabilities/event-tap` no longer exports `runtimePlugin`. `CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, and `SESSION_SCOPED` is removed. `runCli(argv)` takes no options. `RuntimeConfig` loses the provider keys `capabilities` and `resolveFrom`: a host config is live when it carries `events`, `harnesses` or `configuration`, and the provider keys in an existing `~/.cratylus.json` are ignored.

  **Breaking for `@cratylus/forge`.** `emitRuntimeConfig` and `runtimeConfigDocument` no longer take, write or carry over `capabilities` and `resolveFrom`, and `EmittedRuntimeConfig` loses both; a deploy drops them from an existing host config. `ResolvedSkill` loses `toolSection` and `skillDescription`; every projected skill's front-matter carries its `description`, and claude's carries its `trigger`. Projected SKILL.md bytes are unchanged.

  **Breaking for `@cratylus/schema`.** `SkillDeploy.deployAs` is removed.

  **Breaking for `@cratylus/canon`.** `RUNTIME_CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, so a cell naming `heartbeat` no longer compiles.

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

### Patch Changes

- Updated dependencies [eff81ef]
- Updated dependencies [407ab9b]
- Updated dependencies [7a75e6d]
- Updated dependencies [85df8f7]
- Updated dependencies [0a0af25]
  - @cratylus/runtime@0.4.0
  - @cratylus/schema@0.4.0

## 0.8.0

### Minor Changes

- bcc1411: omp: the persona badge — the running persona's mark emoji and name in the status line

  `cratylus project --harness omp` now emits one `cratylus-persona-badge.ts` extension module per projected persona, placed in that persona's own `agent/personas/<name>/extensions/`. In a top-level interactive session it sets the status line to the persona's mark emoji and name, or the name alone for an agent with no provenance; a subagent and a headless session show nothing. The text is baked at projection, and no hue is carried because omp strips color from an extension's status text.

  **Breaking for out-of-tree `HarnessAdapter` implementers.** `launchSurface` now takes the composed agents, `launchSurface(agents: readonly Agent[])`, instead of their names, `launchSurface(agentNames: readonly string[])`. An implementation that only needs the names reads `agents.map((a) => a.name)`.

## 0.7.0

### Minor Changes

- b34b1c5: Session scope belongs to the capability, not to every runtime shim

  `@cratylus/runtime/capability` declares every capability once with whether its
  state belongs to one agent session (`SESSION_SCOPED`); `CAPABILITIES` is derived
  from it. Only `memory` is session-scoped today. A projected shim bridges or
  demands a session id only for a session-scoped capability, so the `design`,
  `plan` and `note` shims now forward from any harness, omp included, with no
  session id. Every generated shim carries a signature line,
  `// cratylus-shim: <capability>`, and the omp launcher states a route only for a
  script that carries it. `omp-agent` now inlines no skills under `--no-skills`
  and warns once when a `--skills` filter is passed.

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

- 85ec0ce: An omp main session starts with its skills' bodies, as a dispatched subagent does

  `omp-agent <name>` used to append only `skill://<name>` references for the
  definition's `autoloadSkills`. It now asks omp for each, in listed order, with
  `omp read skill://<name>` run from the launch directory, and inlines the
  `SKILL.md` omp resolves without its front matter, so user and project roots and
  omp's own settings all apply. Each skill arrives as a `# Skill: <name>` section
  that opens with one line per shim, saying the CLI command its route runs as
  (`scripts/plan.mjs <verb>` runs as `cratylus plan <verb>`), in place of a base
  directory omp does not expose. A skill omp cannot resolve is named under
  `## Required reading` instead, and the launcher prints one `omp-agent:` line to
  stderr for each one. The launcher's doc now names the real size limit, the
  per-argument `MAX_ARG_STRLEN` of 128 KiB.

- a12cf83: The project scaffold no longer lays down a `plans/` tree

  A plan is an entity whose lifecycle (proposed, bound, closed) is recorded in and read
  from the `plan` domain, so there is no folder layout to scaffold. `scaffoldProject`
  now writes only the projected culture and `AGENTS.md`; it no longer creates
  `<target>/plans/founding/{PLAN.md, pending, ready, active, completed}`.

  Breaking for `@cratylus/forge`: `ProjectTemplate` loses `planMd` and `planStates`
  and carries only `agentsMd`, and `ScaffoldProjectResult` loses `planDir`. A corpus
  that supplied its own template drops those two fields.

  In `@cratylus/canon`, the project template no longer imports the plan-state set, and
  the Work-tracking section of the scaffolded `AGENTS.md` says work is planned with the
  `plan` skill instead of describing a stored layout. The default template in
  `@cratylus/forge` names no skill: its Work-tracking section is gone, since the engine
  carries no corpus doctrine.

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
- Updated dependencies [fcf5db6]
- Updated dependencies [52c73fd]
- Updated dependencies [7b71bc8]
- Updated dependencies [36a0511]
- Updated dependencies [6f18d1c]
- Updated dependencies [c5bc3d9]
- Updated dependencies [bf103d9]
- Updated dependencies [eeab4cc]
- Updated dependencies [e2db96f]
- Updated dependencies [859d0fa]
- Updated dependencies [0dcbc9a]
- Updated dependencies [235f77d]
  - @cratylus/runtime@0.3.0
  - @cratylus/schema@0.3.0

## 0.6.0

### Minor Changes

- a6dc4ec: The omp adapter projects a per-persona stance manifest, and the deploy audit
  stops lying in both directions.

  The omp projection now emits `<scope>/stance/manifest.json` for every persona,
  keyed by the cell that owns each gate and carrying that cell's moments, so a
  second gated dimension is a second entry rather than a new field, a new file, or
  a line in any caller. The emitted extension derives its own scope directory from
  its placement and passes it in the envelope, so a worker resolves its own gate
  and the dispatcher learns nothing about who is enrolled.

  **Breaking.** The emitted bridge no longer returns early when the judge produces
  nothing. It writes the empty verdict file and fires the worker anyway, which
  reaches the worker's own `dark` announcement and forwards it once per session to
  agent and operator alike. Failing open is the correct enforcement posture;
  failing open silently is the bypass — measured at five hours of one session
  judged nothing while the endpoint behind `modelRoles.advisor` accepted
  connections and never answered.

  The judge deadline moves from 12 s to 22 s and its away-latch from the first
  timeout to three consecutive misses, cleared by any answer. The old budget came
  from a local judge answering in two seconds; re-measured against a cloud model,
  one 9 KB payload against the 29 KB rubric takes 9.3 s, so a healthy judge
  brushed the deadline and a single transient blacked out a whole session.

  Three placement defects in deploy are fixed. `renderedFiles` never enumerated
  the shared stage, so the audit reported the stance rubric as ours-and-retired
  and the prune borrowed that set as its candidates — an audit condemning the
  artifact it exists to protect. The same pass compared rendered bytes raw while
  the placer resolves `SCOPE_DIR_TOKEN` at write, leaving six persona overlays
  permanently and falsely stale. And both scoped placement and scoped audit walked
  a persona directory one level deep, silently dropping any nested artifact.

## 0.5.0

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

- a1944fc: An omp agent is ONE definition omp itself discovers, read back by ONE launcher

  `cratylus project --harness omp` projected each persona to `~/.agents/<name>/APPEND_SYSTEM.md` — a
  file omp reads only when a flag names it — plus a per-agent `omp-launch` script to name it. Two
  consequences, both silent:

  - **The composed agent could be launched and could not be DISPATCHED.** omp discovers user-level
    task agents from `~/.omp/agent/agents/*.md` and nowhere else, so a persona carried as a launch
    ARGUMENT was invisible to `task`. The same name meant an agent in one direction and nothing in
    the other.
  - **N agents shipped N byte-identical launchers.** Every `omp-launch` differed only in the
    directory it happened to sit in, so each one was a copy the deploy had to keep converging, and
    each new agent added another.

  Both close on the same artifact. The definition is now `~/.omp/agent/agents/<name>.md`: YAML
  front-matter carrying the `name` and `description` omp requires, and a body that IS the system
  prompt. Dispatched as a subagent, omp parses it natively. Launched as a MAIN session — for which
  omp has no `--agent` flag at all — the generic `~/.omp/agent/omp-agent` reads the same bytes.

  The launcher resolves the agent at RUN time, from `$1` or, when reached through a symlink named
  after the agent, from argv[0] itself (busybox-style, and it does not consume `$1`, so
  `mav --model x` passes the flag through). It splits the front-matter off, prepends the identity
  assertion omp's own base prompt would otherwise win, renders any `autoloadSkills` as required
  reading — omp honours that field ONLY for a spawned subagent, so without this one definition would
  mean two different things depending on how it was reached — and hands the result to
  `--append-system-prompt` as an argument. A definition that is not there is a named refusal and a
  nonzero exit, never a fall-through to a bare `omp` wearing the persona's name.

  **The description is now a quoted YAML scalar.** A plain one may not contain `: `, and `nico`'s
  description does ("its conceptual architecture and canon: dimension catalogs") — unquoted, the
  document is a scanner error omp survives only by falling back to a naive `key: value` line parser,
  warning once per discovery pass and invisible until a description grows something the fallback
  loses too.

  **Per-persona scopes moved in with the harness**, from `~/.agents/<name>/` to
  `~/.omp/agent/personas/<name>/`. What was left out there once the persona file moved was an
  `omp.yml` and a TypeScript module omp alone loads — harness-specific bytes in a harness-NEUTRAL
  root, and a directory the one launcher could only reach by hard-coding the harness home's own depth
  into shell. The scoping guarantee is unchanged and is still the whole point: nothing scans
  `personas/`, so a mechanism module there loads under that persona's own `--config` overlay and
  under no other, and a bare `omp` reads only the session root's own `extensions/`.

  Skills are untouched: still one copy at `~/.agents/skills/<name>`, which omp reads natively on
  every launch.

### Patch Changes

- 317ba47: The omp stance judge has a deadline of its own, and an absent one is asked once

  An unreachable judge does not fail — it **hangs**. `askJudge` awaited `completeSimple` with no
  bound, and omp kills an extension handler at 30 s, so a judge that had stopped answering cost
  every turn end the full budget and then surfaced as `Extension error: handler timed out` — which
  reads as the guard being broken rather than the judge being away.

  Found by a plain status check rather than by a test: launching a persona through `omp-launch`
  printed the extension error, and isolating it showed the worker returning in **30 ms** while a
  **one-word** prompt to the configured `advisor` role did not return in 20 s. The endpoint was
  down; the code had no way to say so.

  Two bounds, both on the fail-open path a judge that cannot answer belongs on:

  - **`JUDGE_TIMEOUT_MS = 12_000`** — a deadline well inside omp's 30 s handler kill. A healthy
    local judge answers this rubric in about two seconds, so the margin is wide enough that a
    slow answer is still heard, and a dead one no longer reaches the host's killer.
  - **`judgeAway`** — tripped when the deadline fires and read on every later turn. An endpoint
    that is away stays away; re-proving it on each turn end buys nothing and taxes the whole
    session. One timeout, not one per turn.

  Verified against a live down endpoint: the same launch that printed
  `handler timed out after 30000ms` now completes with no extension error and no refusal, the
  guard having correctly declined to judge what it could not reach.

- 848288e: The omp stance gate reads its verdict where the worker writes it, and fails open again

  The gate did not merely miss collapses on omp — it **refused every `ask` and every `task` call
  without judging one**, with an empty reason. `ExecResult` is `{stdout, stderr, code, killed}`;
  the emitted module read `r.exitCode`, which is not a member. `undefined === 127` is false and
  `undefined !== 0` is TRUE, so both guards inverted and every blocking registration returned
  `{block: true, reason: ""}` whatever the worker decided. Measured against the installed binary:
  `pi.exec("sh", ["-c", "exit 3"])` answers `{"stdout":"","stderr":"","code":3,"killed":false}`.

  The `127` line existed to prevent exactly this — its own comment names "a governance mechanism
  bricking the session it was supposed to govern" — and it was reading the same absent field, so
  the guard against the catastrophe _was_ the catastrophe. A persona whose `ask` and `task` are
  both bricked is unusable, which is how the deployed modules came to be deleted by hand from
  `.agents/<name>/extensions/`, leaving the whole gate dark on the harness.

  Four defects, one seam:

  - **the verdict is on STDOUT.** The workers speak the Claude hook contract — JSON on stdout and
    `exit 0` on every path, allow and deny alike. A nonzero `code` is a malfunction, never a
    refusal (`fail-open ∀error`), and the two verdict shapes (`permissionDecision: "deny"`,
    `decision: "block"`) are what a refusal looks like. Anything unparseable is silence.
  - **every worker-reading registration gets an envelope.** `OMP_PAYLOAD_EVENTS` held `agent_end`
    alone, on the argument that a `tool_result` "stays a bare fire rather than being handed a turn
    that is not one". A bare fire hands the worker an EMPTY stdin — the exact failure the previous
    changeset was written to fix. Measured: a registration with no envelope runs the worker with
    `read_bytes=0`, so the `ask`, `task` and subagent legs judged nothing while reading as coverage.
  - **the envelope names the tool the WORKER matches on.** `tool_name: "ask"` reaches the worker's
    `case` and falls through to its `*)` allow branch, so the pre-guard permitted every call it was
    installed to judge. omp's `task` arguments are `{context, tasks[]}` and the worker reads
    `.prompt`, so a dispatch also arrived with nothing judgeable — a pass indistinguishable from a
    considered verdict. Both are translated, because the worker's wire format is the contract and
    the shim is what writes it here.
  - **a finished dispatch IS a turn.** `subagent.end` lands on `tool_result`, whose event carries
    no message list. The prompt that launched the delegate plus the text it returned is exactly the
    pair the rubric judges.

  Verified against the live binary, driving the deployed module's own registered handlers: an
  in-remit `ask` menu and a dispatch-echo `task` both come back `{block: true, reason: "STANCE
GUARDRAIL (pre) — denied …"}` with the judge receiving the assembled menu and the normalized
  dispatch; a subagent result arrives as a `sendUserMessage` continuation. Fail-open holds on all
  three paths that previously refused: judge PASS, guard opted out, and worker absent each return
  no block, where the old form returned `{"block":true,"reason":""}`.

- 4e6e7aa: The omp shim hands the stance worker its payload, so `agent_end` judges the turn

  The stance guardrail has never judged an omp turn. It is deployed, opted in
  (`agentfactory.stanceGuard=true`), scoped to `mav` and `nico`, and registered on `agent_end` —
  and it was firing `sh stance-guardrail.sh` with no stdin. The workers are written to the Claude
  hook contract: a JSON envelope on stdin naming a JSONL transcript. `input="$(cat)"` read empty,
  the worker exited at its first guard, and every turn of every omp session reported nothing.
  A gate that is installed, enabled, and judging NOTHING is indistinguishable from a gate that
  finds no fault, which is how the agents' declared laws went unenforced without anyone noticing.

  `ExecOptions` is signal · timeout · cwd — there is no stdin — so the shim materializes the
  envelope itself: a temp dir per fire, the turn written as the transcript lines the worker's
  `jq` already parses, and the envelope arriving by redirect. Only the SHAPE is translated;
  the extraction semantics (whole turn since the last real user message, tool activity marked,
  text-only projection for the evidence check) stay in their one home inside the worker.

  The identity in the envelope is read from PLACEMENT — the module's own grandparent directory
  names the scope — so a persona copy reports that persona and the session root reports a name
  that matches no allowlist. No runtime identity check was added.

  omp takes no result from `agent_end`, so a verdict reaches the session by queueing a
  continuation, which is the same shape as refusing the stop. Delivery is bounded to a CHANGED
  verdict: `dark` says the judge is unreachable and keeps saying it, and re-opening the turn
  forever on an informational fact is a livelock. A block's reason carries a per-session count
  and the worker's no-progress detector turns a genuine repeat into a different notice, so a real
  block is never suppressed.

  Verified end to end on a live `mav` session: the judge received a correctly assembled
  `=== OPERATOR === / === AGENT ===` payload, a stub BLOCK produced
  `{"decision":"block",…}` through the evidence check, and an interactive session took the
  continuation (two `agent_end` fires). With the real judge the worker now reports
  `STANCE GUARDRAIL — DARK: the judge did not answer` instead of silence.

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

- 0cca8bc: A persona's overlay sets `personality: none` — the cell is the only voice

  omp's default prompt renders a personality block chosen by the `personality` setting
  (`default`, `friendly`, `pragmatic`, `none`). A composed persona already states its register
  completely: `formality` carries the prose contract, `audience-adaptation` sets density against
  the interlocutor, and `transparency` and `handoff` fix what a reply discloses and how it ends. A
  preset rendered beside those is a second, uncoordinated statement of the same thing — two homes
  for one concept, in the same prompt.

  `none` rather than a better-fitting preset, because **omp runs every subagent with `none`
  regardless**. Left at a preset, one definition means two different voices depending on whether it
  was launched as a main session or dispatched as a subagent — the exact defect that the single
  agent definition closes for identity and that the launcher's `autoloadSkills` rendering closes
  for required reading. Closing it on the register axis too is what makes a persona sound the same
  from either direction.

  The setting lands in the generated `--config` overlay and not in the agent cell, because it is
  genuinely a session setting rather than a dimension of the persona. Conflating the two is the
  category error this change exists to correct.

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

- 693a056: `turn.end` binds omp's `session_stop`, so the turn-end bound is a bound again

  `agent_end` is documented _"notification-only"_ and takes no result. A turn-end cell mapped there
  cannot REFUSE — the best the shim could do was queue a `sendUserMessage` continuation, which is a
  steer wearing a bound's name. `MODEL.md` calls that a degradation; nothing reported one, because
  the adapter believed the event was realizable.

  omp has the real thing and the adapter was not using it. `session_stop` is _"awaited before
  settle"_, and its result type is `{decision?: "block"; reason?: string}` whose own doc-comment
  reads **"Claude/Codex-compatible block decision"**. The event carries `messages`,
  `last_assistant_message`, `session_id`, and — decisively — **`stop_hook_active`**, the re-entry
  flag the workers read and which `agent_end` has no field for, so the guard's own loop-safety was
  dead on this harness.

  Measured against the installed binary: a handler returning `{decision: "block", reason}` re-opened
  the turn and fired again with `stop_hook_active=true`, exactly as the claude `Stop` contract does.
  Then end to end with the deployed worker and the real rubric on a `mav` overlay — the first
  `session_stop` blocked, omp re-opened the turn, the agent re-assumed the stance, and the second
  fire settled.

  Also here:

  - **Two refusal shapes, one table.** A tool wrapper reads `{block, reason}`; the stop pass reads
    `{decision: "block", reason}`. Emitting either at the other site is silently ignored — a gate
    that returns and refuses nothing. `OMP_REFUSAL_SHAPE` maps each blocking event to its spelling
    and replaces `OMP_BLOCKING_EVENTS`, whose keys were the same list in a second place.
  - **`subagent.end` keeps the continuation channel**, because `session_stop` never fires for
    subagents (`agent-session.ts`: `if (this.#agentKind === "sub" || …) return false`) and
    `tool_result` takes no verdict.
  - **The emitted module imports `ExtensionAPI`, not `HookAPI`.** omp's `docs/hooks.md` states the
    package root does not re-export `HookAPI`. Type-only, so the wrong name was erased before it
    could throw; it would have failed the first person to typecheck an emitted module.

- Updated dependencies [b0bc847]
- Updated dependencies [e2b2263]
- Updated dependencies [415a112]
  - @cratylus/schema@0.2.0

## 0.4.1

### Patch Changes

- 805d19b: omp launcher resolves its own path through symlinks

  `omp-launch` computed `dirname "$0"` and passed `--config <that dir>/omp.yml`.
  Linked into a `PATH` dir - the one way an operator runs a persona by name - `$0`
  is the link, and omp refused to start: `Config overlay not found:
~/.local/bin/omp.yml`. The script now walks `readlink` to the real file before
  resolving its directory, with hops capped so a link cycle fails instead of
  hanging.

## 0.4.0

### Minor Changes

- fee5ade: the omp persona is a launch spec under `~/.agents/`, not a profile

  **The profile carrier is withdrawn.** Projecting a persona into `~/.omp/profiles/<n>/agent/`
  carried identity in an ENVIRONMENT: an omp profile silos auth, MCP, model prefs, sessions and
  config, inheriting nothing from the default profile but keybindings. Measured — ten
  deploy-created profiles on one host held zero credential rows each and could not see that
  host's own MCP servers, and on another the persona's `mcp.json` was a byte-duplicate of a
  17-server org config, copied by hand because profile scope silos it.

  Identity is now the LAUNCH SPEC and environment stays the profile:

  | artifact         | destination                                     |
  | ---------------- | ----------------------------------------------- |
  | skills           | `~/.agents/skills/<skill>` (read natively)      |
  | face             | `~/.agents/<agent>/APPEND_SYSTEM.md`            |
  | overlay          | `~/.agents/<agent>/omp.yml`                     |
  | mechanism module | `~/.agents/<agent>/extensions/<bin>-session.ts` |
  | session module   | `~/.omp/agent/extensions/<bin>-session.ts`      |
  | launcher         | `~/.agents/<agent>/omp-launch` (0755)           |

  `~/.agents/` is not cratylus's invention: omp reads it through a vendor-neutral `.agent[s]`
  provider, and Cursor reads `~/.agents/skills/` too. So skills land ONCE instead of being fanned
  into every profile scope, and `omp --profile work` goes back to meaning what it says.

  **Two runtime defects in the emitted mechanism, both caught by running the real binary.** The
  module called `pi.exec(cmd, { shell: true })`, but `HookAPI.exec(command, args, options?)`
  requires `args` and spreads it — so every registration in every module threw at load; it now
  calls `pi.exec("sh", ["-c", cmd])`. And a missing worker exited 127, which the blocking branch
  read as a refusal, so `ask` and `task` were blocked with `No such file` as the reason; 127 now
  fails open, as the cells themselves specify.

  Port changes, breaking for anyone implementing `HarnessAdapter` outside this package:
  `enforcingRel` is now **`scopedRel`** (it places modules, overlays and launchers),
  `HarnessProjection` gained `executable?`, and `skillRel` returns a single destination for omp.

  **Deploy no longer seeds memory sidecars.** The canon's memory cells are gone, so
  `SEMANTIC.md` / `PROCEDURAL.md` / `EPISODIC.jsonl` are no longer written into `~/.agents/<name>/`.
  Files a previous deploy already seeded are LEFT IN PLACE — deploy never recorded them in its
  prune manifest, deliberately, and an operator's stored memory is not ours to delete.

- ca1b9aa: omp deploys its mechanism, and its skills land where omp reads them

  Three defects on one seam, all measured on hosts running the canon under omp.

  **No mechanism reached an omp host.** `project` branched on `HarnessAdapter.hooks` alone,
  so a harness whose hook surface is a program rather than a config file looked like a
  harness with no surface: all five scope-activated cells (stance gate, its pre-gate, the
  deploy-drift notice, the memory-consolidation nudge, the resume notice) were warned about
  and dropped. The port gains `scopeActivatedSurface(hooks, agentNames)` beside `hooks()` —
  `hooks()` keeps meaning "a settings fragment a host merges" — and omp realizes it as one
  extension module per scope: the session root plus every projected agent's profile, because
  its native config root is profile-scoped. `enforcingRel(file, scope)` is the destination
  map deploy asks, and scoped artifacts stage under `enforcing/<scope>/` in the render tree.

  **Skills were deployed to a path omp never scans.** The placer used the render tree's own
  staging layout (`skills/<name>`) as every harness's destination; omp's native provider
  reads `<agent-dir>/skills`, profile-scoped. `HarnessAdapter.skillRel(name, agents)` is now
  required and PLURAL, and the placer, the audit and `deploy --check` all ask it.

  **The runtime shim asserted a claude bridge inside every harness's projection.**
  `sessionEnvVars` is now an adapter fact; the emitter takes it and names no vendor. omp
  declares `[]` — it sets no session variable for a child process — so its shim refuses with
  exit 3 naming `$AGENT_SESSION_ID` / `$AGENT_SESSION_ID_FROM` instead of running
  sessionless, which is what the phantom-sibling lock failures were made of.

  `deploy --check` also passed only `agentExt`, so it audited claude's destinations on every
  harness; it now passes the whole layout. The claude and codex projections are byte-identical
  across this change.

  BREAKING for anyone implementing `HarnessAdapter` outside this package: `skillRel` and
  `sessionEnvVars` are required members, and `runtimeShimContent` / `emitRuntimeShim` take
  the harness's session-variable list rather than defaulting to claude's.

- 844811e: the canon ships two agents, and both inherit the harness's memory

  The roster is `mav` and `nico`. `arch-doc-writer`, `boz`, `developer`, `investigator`,
  `planner`, `principal-engineer-reviewer`, `principal-ic` and `tester` are deleted — not
  deprecated, not moved behind a flag.

  Both survivors declare `memory: null`, the explicit omit-to-inherit sentinel: the dimension is
  OMITTED from the projected face, so the agent has whatever memory its harness provides. The
  corpus used to declare `long-term-memory ⟨episodic · semantic · procedural⟩` and fund it with
  the `wake` and `dream` cells; those cells are retired, and a host with a real backend does this
  better than a projected claim. `dimensions/memory/*` stays on disk as an unreferenced axis
  library — four of its five fragments already were.

  Consumers of the published corpus lose eight agent definitions. The retired faces and their
  launch specs ARE swept from a host on the next `cratylus deploy` — but only because this
  release also fixes the prune: its containment guard took ONE root, and omp's destinations are
  `../.agents/…`, a sibling of the harness home, so every record resolved outside that root and
  was silently skipped. Measured on a sandbox host — ten projected personas, redeployed from a
  two-agent corpus, kept all ten faces, all ten launch specs and every retired skill, and the
  deploy reported success. `applyPrune` now takes the neutral root as a second entitled root, and
  attribution is still by manifest record, so a file this tool never wrote is untouchable in
  either root.

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
