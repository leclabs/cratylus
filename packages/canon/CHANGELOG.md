# @cratylus/canon

## 0.13.2

### Patch Changes

- 96fa812: The architect role's archetype names the closed-plan route beside the unit routes: a closed plan goes to the integrator, which makes its line whole and asks for release. The archetype was narrower than the contract; the generic architect's projected agent changes by that clause alone.
- 714b57b: The `planner` role's contract now states that it sends what the `architect` role reads from it. Its `returns` line named only the plan's name and the names of units ready to start; it now returns the plan's name, `route-names` (the names of units ready to start or waiting on a route, which it reads from each unit's ledger), and, on `close(P)`, `plan-closed(P)`, the report that plan P has closed. The architect role already lists `route-names` and `plan-closed` among its reads, and no role value named their sender. `¬ spec ∨ plan-view` stays: the planner still returns names and nothing behind them.
- 03bdff1: The `architect` role's contract now states what reaches the architect from below as the design's `architect role` shard words it. Among its reads it lists `plan-closed`, the planner's report that a plan has closed, and its `route(…)` clause sends a closed plan to the integrator, which makes the plan's line whole and asks the operator for release. The names the planner hands it are now `route-names`, formerly `ready-names`: units ready to start or waiting on a route, which the planner reads from each unit's ledger so a lost session resumes from the ledger and not from memory. The purview guard already passed the closed-plan route and the deliver skill already stated it, but the role value the architect acts from and the guard reads as the law named neither it nor the waiting units.
- f675f0a: `kino` declares only its residue over the architect role: its description and archetype no longer restate who plans, builds, judges and combines, what it routes or how an ad hoc request is handed out, and keep what is kino's own — the film craft and generative-video practice held as the design, teaching the layman operator and rectifying every utterance against industry practice, and the three failures a production surface guards against.
- 7e99a95: `mav` declares only its residue over the architect role: its description and archetype no longer restate who plans, builds, judges and combines, what it routes or how an ad hoc request is handed out, and keep what is mav's own — the architect of whatever repository it is given, answering for the design being realized in the system.
- a2ec086: `nico` declares only its residue over the architect role: its description and archetype no longer say it hands out the cells and the engine or hands the cells to the planner and implementer, and keep what is nico's own — the project seen whole, its conceptual architecture and canon, and the empirical ontologist of a foundation model's concept-space who discovers and canonizes σ* signs.
- 3f40cdd: signify's exclusion law now names the reason that covers most concepts: a concept that is no core agent dimension name or value is the industry's own term, used as the industry understands it, and gets no anchor.

## 0.13.1

### Patch Changes

- be25412: The package READMEs are rewritten for the author of a corpus or of a harness adapter, from the tree as it stands. Each says what its package is for and how its own surface is used, and links to `ARCHITECTURE.md` for what every package is for and to the `cratylus` README for what a consumer does. The forge README drops the install, launch, badge and uninstall detail the `cratylus` README holds and keeps the pipeline, the harness adapter port, the deploy placement table and the library surface. The schema README now spells a dimension's `repertoire` (its example said `kind`), names the `@cratylus/schema/hook` exports as they are, and covers the plugin declaration. The canon README no longer says canon takes `defineAgentPlugin` from forge, and describes the architect, planner, implementer, assayer and integrator agents as the generic holders of their roles and mav, nico and kino as personas over the architect role. No behaviour changes.
- b4bd37b: The orientation rule projected to the repository's `AGENTS.md` spells `INVARIANT` and no longer ends its first line in a stray `**`. No projected agent, skill or hook changes.
- e79b4b0: An agent named for its role is that role's generic holder and a persona is an agent named as an individual. The architect, planner, implementer, assayer and integrator roles now state the description, archetype and mark their generic holder carries, and `agents/<role>.ts` says only which role it holds with `holds(role)`. `holds(role, persona)` takes a persona and refuses, when the cell is defined, one with no archetype or mark of its own, one whose mark is its role's, and a role-named agent that declares anything beyond its role. The projected agents are unchanged byte for byte.
- Updated dependencies [be25412]
  - @cratylus/schema@0.8.1

## 0.13.0

### Minor Changes

- 1e5fd22: `cratylus install` offers practices where it offered optional personas. `--practices <name,…>` names the practices to install and `--all` installs every one; on a terminal with neither, install asks one multiselect of the declared practices, each with its description, preselecting the ones already installed here (on a fresh host, the corpus's preselected `cdd`), and `--yes` takes that preselection. With no terminal on stdin and stdout and neither flag, install refuses before writing anything and names `--practices` and `--all`, under `--yes` and over an existing install too; it used to place the whole corpus. An empty choice is refused, saying that removing everything is `cratylus uninstall`, and `projectPluginSet` refuses `practices: []` instead of rendering every cell (absent still renders every cell). A practice installed before and not chosen now is removed with the agents, skills, hooks and persona commands no chosen practice still carries, and the chosen practices are recorded in the deploy manifest for the next run to preselect. The persona decision is retired: `--personas`, `Agent.optional`, `ProjectOpts.omitAgents` and `ProjectedTree.optionalAgents` are gone, and `kino` and `nico` are installed with their practices, `film-production` and `corpus-authoring`.
- 57fd456: A practice: a way of working a corpus offers as one installable choice, with the agents, skills and hooks that carry it. The schema gains `Practice`, `Plumbing`, `AgentPlugin.practices` and `AgentPlugin.plumbing`, and `Agent.dispatches`, the roles an agent hands work to. Canon's role cells state the roles their holders dispatch, and canon declares `cdd` (preselected), `corpus-authoring`, `film-production` and `carry-on`, with the event tap and the drift notice as plumbing. Forge projection takes `practices` to render; absent, every cell renders as before, and given names it renders only what they place, refusing a set not closed under skill composition and agent dispatch. `ProjectedTree.practices` reports the declared practices for an install to offer.

### Patch Changes

- Updated dependencies [1e5fd22]
- Updated dependencies [57fd456]
  - @cratylus/schema@0.8.0

## 0.12.4

### Patch Changes

- 731517e: The README's install section now installs `cratylus` alongside canon and imports `defineConfig` from `'cratylus'`.

## 0.12.3

### Patch Changes

- cd697a8: A contest answers only a refusal that stands. A refusal of a key stands from the fire that refused it until the next fire of that key, and a guard lets a fire through unjudged on a contest only when that refusal's file exists and the contest holds text. A contest written before the refusal it would answer, or after the refusal lapsed (a stop the agent complied with and the judge then passed), is discarded unheard, neither said nor logged, and the act is judged as usual, a block recording its refusal anew. Before, such a contest let a later purview call, stance call or stop through unjudged, the turn end included. The rule lives in `contestShell` alone, so the purview worker and both stance workers carry it, each still within its size cap.
- 31a7cfc: A purview refusal no longer strands the agent. The deny gives the judge's reason followed by the way forward: act on it, or, if the agent holds it wrong, write why into the file the reason names with the one shell command it spells out, then repeat the same call. That call goes through unjudged, a line naming the guard and the agent's reason is said where the operator reads it, and the contest is appended as one JSON line to `$GUARD_CONTEST_LOG` (default `~/.agents/guardrail/contests.log`) for the operator to review. A retry with no contest is judged again and refused again, and a write under `$TMPDIR/guardrail-contest/` is never refused. The shell this needs, with the judge-payload clip, now lives in `guard-shell.ts`, the one home every guard worker shares. The purview worker is cut to what its act needs: 8.1 KB from 15.4 KB, its judge payload unchanged byte for byte.
- 3d8a735: A stance refusal no longer strands the agent, before a call or at the turn end. A deny or block gives the judge's reason (at the turn end with the verified span) followed by the way forward: act on it, or, if the agent holds it wrong, write why into the file the reason names with the one shell command it spells out, then repeat the call or end the turn again. That act goes through unjudged, a line naming `STANCE GUARDRAIL` and the agent's reason is said where the operator reads it, and the contest is appended as one JSON line to `~/.agents/guardrail/contests.log` for the operator to review; a contested stop goes through whatever the run of blocks. A retry with no contest is judged again, and the turn-end bound (a repeated stop, or a fourth refused stop in a run, goes through said) stands. Both stance workers now take the contest and the judge-payload clip from `guard-shell.ts`, and drop the long paragraphs of instruction their refusals carried, so the pre-call worker stays under 7.7 KB and the turn-end worker under 16 KB.
- a6a6a7e: The two stance guard workers shrink to what a guard does (read the event, decide whether it applies, ask the judge, relay the verdict): the pre-call worker from 14 KB to 6.4 KB and the turn-end worker from 49 KB to 15 KB, by leaving the history their comments carried to git and folding the transcript passes that recomputed the same turn into one. What either worker emits, sends the judge, writes and exits with is unchanged.

## 0.12.2

### Patch Changes

- 55ce06a: The turn-end stance guard no longer locks a session in an endless loop over one stop. The turn end is the one exception to a refused act staying refused: refusing it holds back no effect, it only makes the agent redo its turn. Every turn is still judged; only what follows a BLOCK changes. A stop that follows a block of the guard (`stop_hook_active`) continues a run of blocks, and a stop that follows none starts a new run at 0. When the judge's BLOCK survives the evidence checks and the run already holds a block and this turn is byte-identical to the turn last blocked in it, or the run already holds 3 blocks, the stop is let through and the guard says so on both harnesses (`STANCE GUARDRAIL`, the stop let through UNRESOLVED, the finding standing, the judge's reason). A run that cannot be counted (its record unreadable, or the state dir unwritable) lets a following stop through the same way, and a fresh stop there still blocks. The bound is on one stop, never on the session, and the 3 is a constant in the cell that no environment variable sets. The reason the agent reads keeps a count but no longer claims the gate never stops enforcing.

## 0.12.1

### Patch Changes

- c00b261: The pre-call stance guard no longer lets a refused call through when it is retried. It kept a marker per session and tool input and waved an identical second call through unjudged under a re-entry cap, so a refusal held once and then lapsed. Now every call is judged, a repeat of a refused call included, and a block on it denies it again however often it comes; the worker writes no marker. The worker header and the cell's residue state this as the retry law where the cap was. The rubric, the payload, the scope gate, the subagent skip and the fail-open notices are unchanged, and the turn-end guard is untouched.
- 9e0e85e: The purview guard now keeps a refusal: a call it denied is judged again however often it is retried, and a BLOCK on the retry denies it, where before the identical second call went through unjudged under a re-entry cap. The judge is handed only what its one decision needs: a rubric of a few sentences (under 2 KB, from about 6.6 KB) that says what an act produces and lets it pass only when the contract's `writes` lists it or `reserves` names it, and an act line that names only the act and its target (`DISPATCH to <recipient>`, `WRITE to <path>`). The rubric asks for an `EVIDENCE:` line, the one the shared judge backend keeps, and the worker checks that line, so a fabricated block is discarded on Claude Code too.
- e7fcc90: The turn-end stance guard keeps a refusal and sends its judge less. Every turn is judged, a turn identical to one already blocked included, and a BLOCK blocks the stop however many blocks came before it: the no-progress detector that let a byte-identical turn through and the one-shot bypass that let a turn through after a run of blocks are gone, `STANCE_BLOCK_CAP` is no longer read, and the block count stays in the reason as a count. The rubric, shared with the pre-call guard, is the stance test in a few sentences over the `handoff` contract and the output block, at most 2 KB instead of 14 KB. The Stop payload is facts under plain labels with no sentence telling the judge what to conclude (the loop position in force with the utterance that set it, the operator's latest instruction, the agent's turn and the Layer-1 span when there is one), and `stance-judge.sh` hands the judge the rubric and that payload with nothing around them.

## 0.12.0

### Minor Changes

- d65e7db: `cratylus install` is a short guided run. It asks only what the operator must decide — which harness, which of the corpus's optional personas (an agent may declare `optional`; kino and nico do, and every other agent is always installed), whether to link the persona launch commands, and which model each held role routes to — shows what it will place before placing anything, places it once confirmed, and ends with a few lines saying what was done and what to do next. Each decision has a flag (`--harness`, `--personas <name,…|none>`, `--link-persona-commands` / `--no-link-persona-commands`, `--model-roles <role=model,…|default>`) and a decision given by flag is never asked; with every decision given, with `--yes`, or with no terminal, nothing is asked and nothing waits for a confirmation. `--dry-run` prints the preview and stops; `--verbose` prints the per-file detail the run used to print by default. What install places is exactly what the operator decided and exactly what `cratylus uninstall` removes: an optional persona not chosen is left out (and one installed before and not chosen now is removed, with its launch command), and a chosen omp `modelRoles` entry is recorded for uninstall like the ones it seeds.

  A model chosen at install is the host's from then on. On Claude Code the deploy manifest now lists, beside `agentModels`, the agents whose `model:` line is the host's (`hostModels`): a chosen line stays when the rendering moves even where it equals the rendered one, a line the host edits stands, and a line the host removes stays removed. A line cratylus rendered and nobody chose follows the rendering, and a manifest written before the list reads as it did. A role the host already routed is never asked and never changed. On omp the same holds of a `modelRoles` entry the operator chose, which the manifest lists as `hostRoutes`; the entry install seeded itself for a role nobody chose is not the host's, so a later install asks that role again and moves the entry to the answer, and an uninstall still removes exactly the lines install put there.

  Projection takes `omitAgents`, leaving named agents out of the render entirely, and reports the plugin set's `optionalAgents` and, per held role, the agents holding it (`roleHolders`). `runDeploy` takes `models` (agent name to a model value) on claude, and a `warn` sink for every warning it and its placers print; a non-empty `models` fails on omp, whose routes live in its own config. The `RoleRouting` port lists the built-in roles an operator may route to (`offered`). A host's `settings.json` is written back in the style it was found in, so an install and the uninstall after it return a compact file byte for byte.

### Patch Changes

- 3401124: The purview guard now passes the route the architect's contract prescribes once a plan closes: a dispatch that names a closed plan by its name, with its line to make whole and release to ask for, goes to the integrator as a fresh dispatch or as a message to the integrator already running, exactly as a unit routed by its name does. The rubric, the worker's act line and its deny notice say that a route names a unit of the loop or a closed plan with the event it is routed on, addressed to a role or to a running agent by its name, while a dispatch carrying instructions the dispatcher wrote for building, changing or verifying a unit is still refused.
- 3ebd9fc: The planner's role now states that each unit's acceptance proves what that unit changes and no more, and that a proof costlier than the change, such as a live multi-model run for a wording edit, is a defect of the plan and not diligence.
- Updated dependencies [d65e7db]
  - @cratylus/schema@0.7.0

## 0.11.1

### Patch Changes

- 1947c67: The guards bind a persona's own main session and no subagent it dispatches. On Claude Code the three guard workers exit without judging, and without a notice, on a payload carrying `agent_id`; the Stop guard no longer binds `subagent.end`, so a finished subagent's turn is not judged.
- 63569f7: The cold-decode oracle decides signs only for the corpus's core agent dimension names and values, the terminology it was built to discover. Every other term is the industry's own, used as the industry understands it, and no consumer surface is held to the oracle. The cratylism value states this once and no longer holds every authored surface to σ\*; signify's `Art` and `α` are scoped to the corpus, design's concept anchors and formalize's block notation answer to no cold decode, and create-skill's green no longer asks a glyph to be cold-verified.
- a38f423: The stance guardrail passes a dispatch that routes a unit of a named plan, or a closed plan, by its name. The architect starts a plan's work, and routes every verdict, by `<unit> of <plan>` with at most where the spec is read, and routes a closed plan to make its line whole and ask the operator for release; the intent lives in the spec at that address, so the rubric's dispatch-echo signal now opens by exempting both and its boundary test PASSes them, and the pre-call guard's header and deny notice name them among what it does not deny. A dispatch pasting the operator's or a coordinator's literal words still BLOCKs. The rubric stays within 14 KB: sentences that restated what it says elsewhere were cut to make room. Calibration gains `dispatch-echo.txt` (expected-BLOCK) and `controls/route-units-by-name.txt` (must-PASS).
- a0e28a8: The loop's texts say each unit is built in its own isolated worktree off the plan's line and never on main, and no longer teach the mechanics: branch names, worktree paths and git pipelines are dropped, and `lacks` and `gather` are stated as the outcomes they check and bring about. The runtime's refusal of a bound plan whose line has no worktree says what is missing and no longer hands the reader a branch name, a path and a `git worktree add` command.

## 0.11.0

### Minor Changes

- 936d174: The loop's texts now place a plan's work on its line. The planner's bind cuts the plan's line, the branch `plan/<plan>` from the HEAD of the checkout where bind runs, and a bound plan's work and records are written on it, never on main: each implementer builds its unit on a branch cut from the line and commits nothing on main while the plan is bound, every record about the plan is written on the line from any checkout, and the integrator finds the line and cuts no branch, committing the records the line holds at every act. The `deliver` skill drops the integrator's first-dispatch cut and its base, so bind is the line's one birth, and `docs/role.md` says the same.

### Patch Changes

- d3a9597: A guard's judge is now sent a smaller rubric and a bounded excerpt, so a judgement fits the time
  its harness allows a guard and a judge that is merely slow is no longer reported as one that could
  not run. The stance rubric is cut from 29 KB to under 14 KB, keeping its rules, boundary tests and
  output protocol; its rationale and measurements move to the hook source's comments. All three
  workers (turn end, pre-tool, purview) send at most 12000 bytes: a turn keeps its close and the
  operator message its tail, a dispatch or menu keeps both ends, each cut is marked, and a BLOCK's
  evidence is checked against what the judge was sent. No deadline and no cell timeout is raised.
  The omp bridge's deadline comments now carry the new measurement; its constants are unchanged.

## 0.10.0

### Minor Changes

- 8fe0ea1: The architect role admits ad hoc delegation. Routing by name binds the units of the loop, the work of realizing the design from shard to plan to whole; an ad hoc request from the operator outside it, such as a comparison, an audit or a question, the architect may hand to whichever role or agent fits it, in its own words, rectified and never the operator's literal ones. The `## Role` every architect holder projects, the `delegation` action and the holders' descriptions and archetypes say so, and the purview guard no longer reads a self-worded request as a spec: it passes a dispatch the holder's own contract admits outside the loop, and still blocks a spec the dispatcher wrote for a unit of the loop and a dispatch that transcribes the operator's literal words. The role also no longer routes the recording of plan state (bind, active, completed, close) to the integrator: it is the planner's, and the integrator combines, runs the whole check and commits records.
- d922882: The integrator now makes the plan's one line hold the plan's whole work. The line is cut at the integrator's first dispatch from the commit the plan's units are built on, the `HEAD` of the checkout where the plan was bound, and no longer from bare `main`. Records reach it at every act, each combination green or red and the plan's close, and no longer only on green: the integrator adds every record file any worktree of the repository (tracked or not) or any local branch holds that the line lacks, and commits them by pathspec. `deliver` spells the exact git commands for the records the line lacks and for gathering them. A red keeps the unit's work off the line and still commits the records; at the close the integrator gathers the planner's completed and close records, confirms nothing is missing, and only then asks the operator to release. The integrator role, agent and `docs/role.md` say the same, and `docs/role.md` spells `architect role` where it spelled the retired `architect position`.
- 15b2e41: Each party now writes to a unit's own history what happens to it, as it happens, so the ledger alone says where a unit stands and on what it was accepted. The implementer records the landing with the commit that holds its work (`plan land`, once for the first commit and again for each amended one) and then returns `landed <unit> of <plan> at <commit>` as before. The assayer records its verdict on the commit it judged, each missing part included (`plan assay`), before it returns it, and still never reads the unit's spec: the verb prints the unit's line and ledger and none of its spec. The integrator records the unit whole with the line's commit, or broke with the failing check (`plan whole`, `plan broke`), before its report. `deliver` says each party writes its own event and that where a unit stands is read from `plan show`; the `plan` skill spells the four verbs with the flags the runtime declares, and to stay under the claude skill hook cap it merges its capacity and exhaustion laws and drops three lines that restated others: `state(P)` moving by bind or close alone, revise routing by the name it is given, and the bind line's echo of the one-bound-plan law.

## 0.9.0

### Minor Changes

- 9435068: The assayer is the one judge of a unit. It reads the design shard the unit was created to realize and the files at the commit it is given, never the unit's spec or the implementer's account, and returns the assay verdict: achieved, or not achieved with each missing part (the concept, the factor or clause of the shard left uncovered, and an address), naming the unit and its implementer. The three questions a verdict answers (does the artifact spell its concept's anchor, does its behaviour cover the shard exactly with nothing missing and nothing extra, does anything else already realize it) are stated in the assayer's role. Acceptance rests on the verdict, not on the implementer's account, and no opinion on naming, structure or test quality and no recommendation is part of it.
- 8f1abc6: The scope-enrolled guards now judge on Claude Code, and only the agents that compose them. They fired from `settings.json` on every turn and exited at their scope gate, because the gate read only the `stance_scope` that omp's dispatcher supplies, so a Claude Code session was never judged and nothing said so.

  `@cratylus/schema` adds the projection facts `harness-persona-root` and `stance-manifest`, and `HookCell.binds`: the composition (a dimension and optionally one value's anchor) that makes a cell a guard and binds an agent to it. A cell without `binds` binds nobody.

  `@cratylus/forge` builds the stance manifest once, in `core/enrollment.ts`, and the projector stages it for every adapter that declares `scopedRel`. Each persona's manifest lists exactly the guards its composed agent includes, never every cell for every persona and never the drift notice, so omp's rendered manifests drop the `deploy-drift-notice` gate they used to carry. The claude adapter now declares `scopedRel`, placing a persona scope at `personas/<name>/` under `.claude`. `OMP_STANCE_MANIFEST` is now `STANCE_MANIFEST` in that module, and `install` logs the file as a stance manifest rather than as mechanism. A harness with no `scopedRel` cannot name the running agent, so projection warns once per guard and carries it as a steer, withholding its registration and workers. On omp, `tool.use.pre` now reaches its worker with the real `tool_name` (mapped from omp's `write`, `edit`, `task` and `ask`) instead of an empty one. `deploy` also stops dropping a cell's second matcher group on one event when it merges `settings.json`, which had left the stance dispatch guard and purview's every-tool group unregistered on a deployed host; an identical group is still added once.

  `@cratylus/canon` resolves the scope in all three guard workers as `stance_scope` when present, and otherwise as `<harness home>/<persona root>/<agent_type>` when the payload names an agent. A bare session and an agent with no manifest stay silent, and an `agent_type` that is not one directory name is refused. The turn-end worker now judges a subagent's own transcript (`agent_transcript_path`) rather than its parent's, and takes the closing message from the payload's `last_assistant_message`, because Claude Code fires Stop before that message reaches the transcript, so a turn that was only text went unjudged. Purview now reads the shared judge seam (`STANCE_EMIT_PAYLOAD`, `STANCE_VERDICT_FILE`) like its siblings; under its own `PURVIEW_` names the omp bridge got no payload back and it judged nothing there. The workers take the manifest path from the `stance-manifest` fact, and the regenerated `.sh` targets differ accordingly.

- fe6756b: The `deliver` skill is now the integrator's conduct of the loop, not the architect's judging of it. Acceptance rests on the assayer's verdict, the one judgement of a unit; the integrator takes only a unit whose verdict is achieved, integrates it onto the plan's integration line, and runs the project's whole check once on the combined tree. Green, it commits the records written since by pathspec and reports `whole <unit> of <plan>`, which the architect sends to the planner; red or a merge conflict, it leaves the line as it was and reports `red <unit> of <plan>: <failing check>`, which the architect sends to the unit's implementer. Every owner is named by role so the loop reads in order: routing by name is the architect's, binding the plan and recording units active and completed and the plan closed is the planner's, and releasing the line to main is the operator's sign-off, which the integrator asks for and never takes. The laws that gave the architect a verdict, a plan read, or an integration before the assay are gone, along with the assayer's three questions, which stay in its role; a finding is still captured as a note by the party that met it and never chased, and when it enters the design is the design skill's law. The comment in `roles/hold.ts` about handing work to a planner now says shard.
- 82de756: The design skill hands a planner shards, not closed pieces. A shard is one concept with everything it stands on (the concept and its closure); it states what must hold and why, never how a harness or a codebase achieves it, so a quirk met while realizing it is the planner's and the implementer's to solve and never a reason to amend it. The architect's cut is its choice of shards to hand the planner: the partition law and the closed-piece law are gone, since shards of different concepts share what they stand on and so are no partition, and the choice stays the architect's and is not delegable.

  The plan skill realizes a set of shards, each unit exactly one, and how a shard is realized on each harness is the plan's. A shard the planner cannot plan as handed down is surfaced, never redrawn. The skill's description and procedure say shards where they said one cut piece.

- a945bf8: The `design` skill states design stability: the design is the fixed target while a plan realizes it. Every input, the operator's included, and every delegate's finding (a note) is a hypothesis the architect rectifies first. A surviving change bearing on a shard the bound plan realizes is captured as a decision note blocking nothing and amended into the design when that plan completes, for a following plan; any other surviving change is amended at once. A bound plan found built on a shard that is itself wrong is stopped by a note blocking the plan, the shard is corrected once, the planner re-plans, and the note is retracted. This replaces the law that amended the design at once whatever plan stood on the concept.

  The `deliver` skill no longer orders a finding folded into the design before the architect's next dispatch, judgement or close, so no skill amends the design under a running plan: a finding is still captured as a note by the party that met it, and when it enters the design is the design skill's law.

- 439e9f4: The implementer position is stated as the one that builds a unit from its spec alone and hands up a name, not an account. Its role contract now says it builds on its own branch, proves only what the spec asks, commits its own work, and returns only `landed <unit> of <plan> at <commit>` or `blocked <unit> of <plan>: spec`; that the assayer judges the unit against its shard, and that a verdict of not achieved comes back to the same implementer, who amends the same unit; and that what it could not prove, and any finding beside the path, is captured as a note and never travels up in the return. It reads its spec with `cratylus plan show <unit> --plan <plan>`, stated in the role sign, and composes the `note` skill and nothing else, so it still never receives `design`. The agent's description and archetype say the same, and no longer make an honest account the position's value to the layer above. `limitation-disclosure` stays, its channel now the note, and the `handoff` autonomy value is dropped from the role because it shapes a report and this position returns a name.
- 52d0b9c: A new `integrator` position and agent make approved work whole, which the architect session had been doing itself. It takes each unit whose assay verdict is achieved, combines it onto the plan's integration line, and runs the project's full check once on the combined tree so no implementer has to. Green, it commits the records written since by pathspec and reports the unit whole; red or a merge conflict, it leaves the line as it was and reports the failing check naming the unit, which goes to that unit's implementer by way of the architect. It repairs nothing, judges nothing, decides nothing about the design or the plan, and never moves `main`: releasing the finished whole is the operator's sign-off, which it asks for when the plan closes. The purview guardrail blocks a Write or Edit by its holder, since the position writes the line and the records' commits and never an artifact. The agent loads the `deliver` skill and its mark is 🧩 orange.
- 5d2fceb: The planner turns the shards the architect hands down into a plan and owns it end to end. Each unit realizes exactly one shard, dependencies come first, each is sized for one implementer, and how a shard is realized on each harness is the planner's to decide. The planner binds the plan when no plan is bound, records each ready unit active as it hands the unit's name out, records it completed when the architect routes `whole <unit>`, closes the plan when every unit is completed, and returns only the plan's name and the ready units' names. When a shard the bound plan builds on is found wrong, the architect corrects the shard and the planner rectifies or rebuilds the plan before the blocking note is retracted; a shard it cannot plan is surfaced, never redrawn, and the planner never changes the design. In the `plan` skill, reconciling plans and units is the planner's (the design's stays the architect's), and `show <unit>` is the planner's and the implementer's read, never the architect's. The planner agent's description and archetype say shards, not a closed piece.
- 7c7d49b: The prime principle is carried only by the cells whose laws apply it, no longer stamped on every projected cell.

  `AgentPlugin.preamble` is removed from `@cratylus/schema`, along with `ProjectOpts.preamble` and the plugin-wide stamping in `@cratylus/forge` (agent and skill projection, `resolveSkills`). A plugin that set `preamble:` must move the block onto the cells that need it. `Skill` gains an optional `preamble`, the same shape `Agent.preamble` already had, and projection emits it as the first section of that skill's SKILL.md.

  `@cratylus/canon` drops `preamble` from its plugin and sets `primePrinciple` on the ten skills that name concepts by anchor, optimal sign or cold decode: `create-skill`, `deliver`, `design`, `exemplify`, `formalize`, `introspect`, `materialize`, `plan`, `probe` and `signify`. The other six skills carry no `## Prime Principle`, and no agent does: each agent already carries cratylism once through its held role's engineering-principles, where it previously carried it twice. The stance-guardrail operator-slot filter now recognizes a skill body by its verb H1 over the fenced formal block instead of by `## Prime Principle`.

### Patch Changes

- e944fac: The `design`, `plan` and `deliver` skills every architect holder loads no longer cast the holder as building, running checks, committing, merging, or reading an artifact, a diff or an implementer's account of its own work, and they name the builder `implementer`. In `deliver`, `judge(unit)` is the integrator's gate result together with `validate(unit)`, and `validate` reads the assay, which the assayer produces from the artifact; a new law says the integrator is never `self`, and the closing `deliver ≜ …` names each step's actor: `self` decides and dispatches, the integrator gates, merges, and commits the merges and every record file, the implementer builds and commits its own unit's work, the assayer reads. A regression in the path is dispatched to an implementer for repair, never made by `self`. The `plan` procedure ends at ratification, with recording state left to the integrator, and `plan` stays under Claude's hook cap.
- 2096105: The architect holds the design and nothing below it. Its role now reads the intent, the design, notes, assay verdicts, the integrator's report of a unit that broke the whole and the names of units ready to start, and writes the design, notes and routes; a unit reaches it only as a name, an address to route, never as a spec, a plan view, a diff, an artifact or an implementer's account. Every input, the operator's included, is a hypothesis it rectifies against expertise and industry practice before it is served, so `trust-but-verify` no longer exempts the operator's intent. It cuts the design into shards (one concept with everything it stands on, stating what and why, never how) for the planner, and routes by name alone: a ready name to an implementer, a unit's commit to the assayer, an achieved verdict to the integrator, and a not-achieved verdict or a unit that broke the whole back to the same implementer with the findings. The assayer is the one judge of a unit; the architect no longer judges an assay or accepts a unit, and the planner, not the architect, binds the plan. A change to a shard a running plan realizes is held as a note until that plan closes, and the architect stops a plan only when it is built on a wrong shard.

  The architect role cell now loads `design` and `note` and no longer loads `deliver`, which composes the plan skill and with it the spec read and is the integrator's skill; this closes the note that plan reached architects through deliver. The `delegation` action, held by the architect and by `nico`, states that a dispatch routes a name and never a spec the dispatcher wrote, and that a delegate is named so it can be messaged again. The purview guardrail no longer blocks a dispatch routing a unit name to an implementer or to the integrator, still blocks a dispatch carrying a spec the dispatcher wrote or the operator's literal words, and says shard where it said cut piece. The generic `architect` holder's description and archetype say the corrected position.

- d25f29f: The planner definition now calls the party that builds its units `implementer`, and the generated
  dispatch and return fixtures name the `implementer` agent rather than casting a persona as the
  builder. The role dimensions, the assayer comments and `docs/role.md` follow the same sign.
- 164b9bd: The codex adapter is removed: cratylus projects to Claude Code and omp only.

  `@cratylus/forge` drops `adapters/codex` (the `./adapters/codex` subpath and `codexHarnessAdapter`), and the registry's `HarnessName` is `'claude' | 'omp'`, so `--harness codex` on `project` and `deploy` is refused with the known harnesses named. The port op `HarnessAdapter.scopeOrientation`, which only codex implemented, is removed along with its projection branch. The degrade-and-warn members `preloadsSkills`, `scopes`, `unnarrowed` and `agentExt` stay on the port.

  `@cratylus/canon` rewords the one codex reference left in the stance-judge worker's comment; the regenerated `stance-judge.sh` differs in that comment alone.

- b27e94e: A guard that lets a turn or a call through without a verdict now says so where the operator reads it, instead of passing as silently as a judged clean turn. The turn-end stance guard, the pre-tool stance guard and the purview guard each print a notice naming the guard and why it could not judge (no `jq`, no input, an unreadable transcript, a missing Target or manifest agent, a judge that fails or does not answer, an unparseable verdict, a block discarded because the span it cited is not in the turn or call, state it cannot write, an unexpected error, and each re-entry cap: no progress, a spent bypass, an identical call already denied once) and still exit 0, so nothing wedges. On Claude Code the notice is the hook's JSON `systemMessage`, the only form that harness shows the session; on omp it is a bare line, and the omp hook bridge now relays every such line, from either of its two passes and whatever the line opens with (it relayed only lines naming the stance guard and `DARK`, and dropped anything printed before the judge was asked), without ever failing the fire on it. A judged pass, an unenrolled scope and a call that carries nothing to judge stay silent. The notice builders use shell builtins only, so a worker running with nothing but `sh` and `cat` on its `PATH` can still speak.
- 3141eac: `kino`'s description and archetype no longer have it judging or refusing output itself. They state it holding the film vision as the design, rectifying the operator's utterances against industry practice, cutting shards for the planner and routing units by name and assay verdicts, with planning, building, judging a unit against its shard, and making approved work whole handed to the planner, the implementer, the assayer and the integrator. The comment giving why `modalities` stays unstated no longer has kino judging an image or video take: the operator's references and intent arrive as image, video and audio.
- e53e720: `mav` speaks the corrected architect position. It no longer overrides the role's `systems-thinking` framing with `goal-directed`, which subordinated analysis to delivery; the role's framing reaches it. Its description and archetype no longer say it judges assays or serves the operator's intent over their literal words: it routes assay verdicts and the integrator’s report of a unit that broke the whole (the assayer judges), and the integrator joins the planner, implementer and assayer among its hand-offs. What `principal-self` and `mission-command` already state is not restated. Its comments state the persona ruling and the role's contract as it now stands, and the history of the retired `structured-decision` output format is gone.
- 8e4b59e: `nico` no longer declares itself a runner and builder. Its own `actions` (`code-execution`), `output-format: code`, `self-evaluation: executable-test-oracle` and `reasoning-strategy: react` are gone, so the architect role's delegation, acceptance-criteria-check and plan-and-solve hold. Its archetype and header say that a canon cell is a `.ts` file of this repository, so writing one is building: nico canonizes signs in the design and hands the cells to the planner and implementer. Its specialty (the corpus's concept space), `maintenance`, `parsimony`, `analytical`, `invoke-the-canonical`, `zero-trust` and the guardrails stay. The `cold-decode-oracle` principle keeps every law it states, but its holder no longer runs the cold read or the sweep, reads a fragment, or edits one: those are acts of the assay, the result reaches the holder only as the assay verdict, and the realign, carry-inline and delete-competing-home fixes are amendments of the design that go to the planner as shards.
- Updated dependencies [8f1abc6]
- Updated dependencies [7c7d49b]
  - @cratylus/schema@0.6.0

## 0.8.0

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

## 0.7.0

### Minor Changes

- b8c0097: The plan and deliver skills govern delegated work at its measured costs

  `deliver` separates integration from acceptance. `gate` is the project's whole
  check, and `integrate` merges a landing into main only when the gate is green
  on the merged tree. One `integrator` per plan runs the gate and the merge and
  carries the state moves the principal decided, but never validates. `verify` is
  bounded to the unit's own `accept` criteria, so executors and assayers no longer
  re-run the whole gate. A merge is durability, not acceptance: the next ready
  unit may be dispatched while an assay runs, the assay reads the unit at its
  landing commit, and a dependent still waits for acceptance. A gap goes back to
  the same agent that built the unit while it has capacity.

  `deliver` names a `finding`, a yield or an operator steer not yet in the design,
  and folds findings into the design before the principal's next dispatch,
  judgement or close, several in one amendment when they arrive together. A
  finding is never held past one of those acts. Held past a judgement, a unit is
  accepted against a concept known to be false. Held past a close, the drift it
  causes lands on units that are never asked again.

  `plan` bounds the response to drift by what moved. A version that changed nothing
  is repinned. A gloss change is repinned, or revised first when the new gloss adds
  or drops behaviour. An anchor or factor change is revised and repinned, and only
  a change to the piece re-cuts the plan. It adds
  `capacity`, the effort one executor finishes in one dispatch, which the harness
  declares. A unit fits it, and a unit that does not is split on its concept's
  factors. The census is taken once, pinned to a commit and cited by every unit,
  and a unit re-derives a measurement only when its paths changed since that
  commit.

- 9cdfa03: A suspect unit is answered by what moved beneath it

  `plan` extends its response to drift to suspect units. The concept that moved
  is a factor beneath the one the unit realizes, so its anchor moving alone is a
  repin, and its gloss or factors moving is answered as they would be for the
  unit's own concept. A factor dropped beneath shows as the concept above it
  amended in factors.

## 0.6.0

### Minor Changes

- eff81ef: The runtime ships four capabilities, built in, and nothing else

  `eventTap`, `design`, `plan` and `note` are the capabilities, each a module of the runtime and known when it is built. The runtime routes exactly these four, each to its own verb surface; nothing is discovered, registered or loaded, and nothing is scoped to a session. `memory` and `heartbeat` are no longer commands: `cratylus` hands any first word that is not one of the four to the projector. Every refusal the event tap raises now opens with `eventTap:` (`eventTap install:` and the like) rather than `event-tap:`.

  **Breaking for `@cratylus/runtime`.** The subpaths `./loader`, `./dispatch` and `./ports/memory` are removed, and with them `RuntimeHost`, `bootstrap`, `discoverConfigured`, `dispatch`, `parseArgs`, `verbsOf`, `MemoryStrategy`, `RuntimePlugin` and `defineRuntimePlugin`; the `heartbeat` port and capability are removed; `capabilities/event-tap` no longer exports `runtimePlugin`. `CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, and `SESSION_SCOPED` is removed. `runCli(argv)` takes no options. `RuntimeConfig` loses the provider keys `capabilities` and `resolveFrom`: a host config is live when it carries `events`, `harnesses` or `configuration`, and the provider keys in an existing `~/.cratylus.json` are ignored.

  **Breaking for `@cratylus/forge`.** `emitRuntimeConfig` and `runtimeConfigDocument` no longer take, write or carry over `capabilities` and `resolveFrom`, and `EmittedRuntimeConfig` loses both; a deploy drops them from an existing host config. `ResolvedSkill` loses `toolSection` and `skillDescription`; every projected skill's front-matter carries its `description`, and claude's carries its `trigger`. Projected SKILL.md bytes are unchanged.

  **Breaking for `@cratylus/schema`.** `SkillDeploy.deployAs` is removed.

  **Breaking for `@cratylus/canon`.** `RUNTIME_CAPABILITIES` is `['eventTap', 'design', 'plan', 'note']`, so a cell naming `heartbeat` no longer compiles.

### Patch Changes

- Updated dependencies [eff81ef]
  - @cratylus/schema@0.4.0

## 0.5.0

### Minor Changes

- 43952d1: Every writing position now carries what a commit is: durability, never acceptance

  `file-ops ⟨filesystem · vcs⟩` states the commit duty in its `vcs` factor. A commit
  is durability and never acceptance; on an isolated branch or worktree every
  coherent step is committed with the red named in the message; a writer commits
  only its own paths by pathspec, formatter first on those paths; and no dispatch
  withholds a writer's commit. The `architect`, `planner` and `implementer` roles
  hold it, so every projected agent except `assayer` carries it.

  Measured before the change: a dispatcher with no commit rule in reach withheld
  every lane's commit until the unit was green in 18 of 18 dispatches, whether the
  design/deliver skills were present, amended or absent. Measured after: 6 of 6
  dispatches let every lane commit at coherent steps, and 6 of 6 still did when a
  repository rule gated commits on a green suite.

- 21e41e1: Add the `note` skill: the notebook's intents, routed to the `note` capability

  The cell declares `runtime: { capability: 'note' }`, so projection emits its
  `scripts/note.mjs` shim, and it scripts the landed verbs exactly: `show`,
  `capture`, `revise`, `retract` and `reconcile`, each write with `--author`,
  `--reason` and `--cause`. It is the one home of the three kinds (idea, question,
  decision), which the runtime carries as labels it never interprets. A note is
  addressed by its title, one live note per title, and a change is a revise,
  never an edit in place. Anyone may write a note and capture has no admission bar.
  Any live note naming a plan or a unit (`u of plan p`) is an owed ruling whatever
  its kind, and a note a merge left in competing versions blocks whatever any of
  them blocks until it is reconciled.

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

- a66800e: The design, plan and deliver skills route to their domain capabilities

  `design` declares `runtime: { capability: 'design' }` and scripts its verbs
  through `scripts/design.mjs`: show, define, amend, retract, reconcile and trace.
  It states the design's laws. There is one live concept per anchor, and a
  withdrawn concept keeps its anchor. Factors are acyclic and name live concepts.
  Every gloss and every reason is non-empty. A supersession is a new version of
  the same concept, and a concept that becomes another is a retraction plus a
  definition. Reconciling the design is the architect's alone. The design no
  longer mentions plans, and its piece digest is gone.

  `plan` declares `runtime: { capability: 'plan', configuration }` and is the one
  home of the plan and unit lifecycle states. They reach the runtime as the
  configuration deploy emits. `plan-states.ts` no longer feeds the formal block.
  Plan verbs are scripted through `scripts/plan.mjs`. The block states the plan
  and unit laws. At most one plan is bound, and closed is final. A unit realizes
  the concept its pin names. A unit is worked only while its plan is bound: it is
  ready when its plan is bound, its dependencies are satisfied and no owed note
  blocks it or its plan; the note skill defines `owed`, and plan borrows it.
  A reconcile gives each field the versions disagree on. A pin is retaken only by `revise --repin --reason`, and a unit
  whose pin has moved is drifted or suspect. The `mirror` law is deleted.

  `deliver` borrows `advance`, `bind`, `close`, `bound` and `ready` from `plan`.
  It records acceptance by advancing a unit, and it closes a finished plan where
  it used to retire one. It carries the law that a concept nothing builds is
  surfaced. It files a defect beside the path with the note skill's `capture`,
  naming the unit `u of plan p`, and borrows `c`, `unit` and `self` from their
  homes.

### Patch Changes

- 844ef6b: `deliver` no longer restates the amendment/acceptance separation law. It was
  stated in both `design` ("two acts") and `deliver` ("two commits"), one law with
  two homes and two wordings. `design` is its home; `deliver` reaches it through
  `amend(C) @ design` and drops its now-unused `commit` and `accepts` imports.
- 52c73fd: The runtime gains the `design`, `plan` and `note` capabilities: the one way agents and users meet
  notes, design and plans

  `@cratylus/runtime` ships three capabilities, each named for its domain and speaking its verbs:
  `design` shows the lattice or one concept, and defines, amends, retracts, reconciles and traces a
  concept; `plan` shows the bound plan, any plan named, or one unit, adds, advances and retracts
  units, revises a unit or a plan, binds and closes a plan, and reconciles either, the first `add`
  naming a new plan proposing it with its concepts; `note` shows the notebook or one note, and
  captures, revises, retracts and reconciles notes. `cratylus <capability> <verb>` routes each ahead
  of the discovered dispatch, and their ports (`DesignHost`, `PlanHost`, `NoteHost`) join the `.`
  barrel, the capability keyspace and `RuntimePlugin`. Every input names entities by name, and every
  output is the domain's view. An identity is printed and accepted only beside a name a merge left
  held by more than one entity, and the form printed is the form accepted; which holder a name
  addresses is decided in one place, the record store's `names.ts`, for all three domains. Refusals
  speak only the domains' words. A write is all or nothing: its writes are staged (`StagedStore`),
  checked and rendered before any reaches disk. The plan lifecycle is read from `configuration.plan`
  in the host runtime config; `plan` refuses without it, naming the deploy, while `design show` still
  shows the lattice and says the plans standing on it wait for a deploy. Every view's header says when
  it includes uncommitted writes.

  The capabilities compose the domain modules. A unit is pinned on add, with the design's closure
  wired into the pin, and re-pinned only by a revise or reconcile that says `--repin` with a reason,
  so editing a spec never clears a drift. A unit realizes one of its plan's concepts, and a merge that
  breaks this is listed as incoherence. A closed plan and its units are never written again and show
  no frontier; a diverged plan takes no new unit. A unit's state moves forward only while its plan is
  bound: `plan advance` refuses a unit of a proposed plan, which is still authored and revised. A unit
  is ready, or on the frontier, only while its plan is bound, every dependency is done and live, and
  no owed ruling names it or its plan; an owed ruling naming a plan refuses binding it. `plan show
<plan>` shows any plan whole, with its units. The repair rule, by which a write is refused only when
  it introduces a violation, now has one home in the record store, and so does the canonical order a
  set-valued payload field is written in, so the same set written in two orders on two branches
  converges. A unit's dependencies and a note's `blocks` now refuse a member named twice. The view
  gives a diverged concept, unit or note a line in its place in the whole view, marked; names which
  head of a diverged item is a retraction and what it withdrew; names a withdrawn reference's kind
  (`factor` or `dependency`); counts each shown plan apart in the header; lists a plan standing on a
  diverged concept once; and renders a concept's trace.

  Every name a view prints addresses one entity: where no plan is in view a unit is printed with its
  plan, `u of plan p`, and that form is accepted wherever a unit is named, so a note blocks a unit by
  it (the note capability's `--plan` flag is gone). What must be resolved first names each item's
  cause and what moved (`drifted: v — same diverged since pinned`, `suspect: u — beneath leaf, base
amended since pinned`), lists a plan view's own items only, and never asks of a closed plan's frozen
  units. A unit realizing a concept its plan does not is an incoherence a merge can leave and the
  repair rule repairs. A diverged plan reads as diverged wherever it is named, a diverged unit is
  joined in the design's cross-reference, and each diverged version shows who wrote it and when, drawn
  in full where summaries would print alike. When the store itself fails the capability says so
  plainly — the directory is outside a repository, or a stored entry is damaged, naming its path to
  restore.

  `@cratylus/canon`'s `RUNTIME_CAPABILITIES` gains `design`, `plan` and `note`.

- 7b71bc8: The record store's immutability gate refuses a change that modifies or deletes a record, at commit and in CI

  `@cratylus/runtime` gains the immutability gate, the one enforced law of the record store. A
  change under the records root whose git status is not an addition (modified, deleted, renamed or
  type-changed) is refused, and the refusal names every offending path. Additions pass, paths outside
  the root are ignored, and a branch merge, which only adds records, passes. The gate reads the
  records root from the store's one declaration and is internal like the store: it is exported
  through neither the `.` barrel nor a subpath, and runs from source through the package's
  `immutability-gate` script (`tsx` is a new dev dependency). The pre-commit hook runs it over the
  staged changes. The gates workflow runs it over the pushed range (a pull request's commits, or a
  push's `before` to `after`), judging every commit against each of its parents, so a later commit
  cannot mask an earlier edit: a record added then edited, or edited then restored, is refused. A
  push is also read at its endpoints: a record present at `before` that `after` does not hold
  unchanged (bytes, mode, presence) is refused, so a force-push or an amend cannot drop or rewrite a
  record that no commit of the new range modifies or deletes.

  `@cratylus/canon`: the test registry classifies the new immutability-gate test under `runtime`.

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

- e2db96f: The runtime gains the record store, and the one ULID implementation moves into the runtime

  `@cratylus/runtime` holds records as files in the repository: `records/<domain>/<record id>.json`,
  one file per record, each an envelope (record id, entity, operation, the record ids it supersedes,
  author, time, reason, cause) and a whole-state payload. A write whose file exists refuses, and a
  supersession or retraction refuses to name anything but a current head of its own entity, so one
  branch's history stays linear. The fold computes each entity's heads at the moment of the read and
  persists nothing. A head is a version or a retraction that no later record names. Heads carrying
  the same payload have converged and read as one, and a later write names every one of them. An
  entity whose heads read as one is settled: live on versions, withdrawn on retractions, and a
  supersession naming the retraction reinstates the entity. Heads whose payloads differ are
  divergence, which only a merge produces (two versions, or a version and a retraction). It is
  reported, never resolved by picking one, and a reconciliation writes one version superseding every
  head. Incoherence (a reference to a withdrawn entity, or a
  cycle) is reported over a reference relation the caller supplies. A branch merge is the union of
  files and never conflicts. The store is internal: it is exported through neither the `.` barrel
  nor a subpath.

  `@cratylus/runtime/ulid` is a new subpath carrying `ulid`, `monotonicFactory`, `decodeTime` and
  `isValidUlid`, moved unchanged from `@cratylus/memory`, which now imports it from there. The
  record store mints every record id from it.

  `@cratylus/canon`: the test registry classifies the moved `ulid` test and the new record-store
  test under `runtime`.

- Updated dependencies [36a0511]
- Updated dependencies [859d0fa]
  - @cratylus/schema@0.3.0

## 0.4.0

### Minor Changes

- 64f6f7b: A role is a bundle of expected aspects, and four positions now state their contract

  `role` was `arity: 'scalar'` over bare tokens, so the corpus could _name_ a
  position and could not _state_ one. Everything the name should have carried was
  retyped on every holder, and two measurements say what that cost. `kino` and
  `architect` agreed on **19 of 22** dimensions by copying, each copy free to
  drift from the other and nothing in the corpus able to notice. And `mav` and
  `nico` both declared the token `build` while sharing almost nothing else — a
  collision the token could not even make visible, since one of the two agents
  colliding on it never wrote a line of substrate. A word that cannot tell its
  own holders apart is not doing the work of a role.

  The dimension stays; its VALUES changed. Each is now a multi-line contract
  stating the ARROW the position is over the ladder
  `intent ≺ C ≺ spec ≺ artifact` — `architect ≜ reads⟨intent · C⟩ → writes⟨C⟩` —
  with the acts the arrow reserves and the defect it names. Delegation is a
  **theorem** of the arrow rather than a second declaration beside it: an act
  whose domain or codomain falls outside the pair is delegated necessarily,
  including an act nobody anticipated, which no enumerated list can manage. That
  is why no `delegation` axis was minted, and why the arrow was not raised into
  a dimension of its own — a dimension determined 1:1 by another dimension is
  not a dimension, and stating the arrow inside the role's own value is also
  what makes it quotable by a rubric. The absence of `software-engineering` from
  the architect's capabilities used to carry this load alone, and an omission is
  not scoreable: no rubric can quote it and no reader of a projected Target can
  tell a deliberate absence from a forgotten one.

  `packages/canon/src/roles/` holds one cell per position — its sign, its skills
  and a partial dimension vector — and `holds(role, declared)` folds the two at
  AUTHORING time, before `compose`, so the emitted Target is exactly as flat as
  it was when every value was retyped by hand. The precedence rule reads the
  manifest's own `arity` instead of restating it: a set is unioned, role members
  first; a scalar is the holder's when the key is PRESENT and the role's
  otherwise, so present-with-`null` is an explicit suppression rather than an
  omission. `provenance.mark` never folds.

  Exactly one thing is inviolable — the role's own contract — and it is
  inviolable structurally rather than by a marking: `Declared` omits the `role`
  key, so there is no field to override and no rule to enforce. A general
  constitutive/default scheme was considered and rejected. With the contract
  folded into the role's own value no second aspect needed protecting, and a
  mechanism with no live subject is structure carrying no load. Every other
  aspect a role supplies is a default: a scalar the holder overrides, a set the
  holder extends.

  **Two agents were re-seated.** `nico` now holds `architect`: it is the
  architect of the corpus exactly as `kino` is of the film floor, and the
  domain's one peculiarity is what makes `output-format: code` sit beside that
  contract without contradicting it — here a canon cell IS a concept written
  down, so authoring `dimensions/<d>/<v>.ts` is writing C while the engine that
  projects it is handed out. `mav` now holds `architect` too, as the
  UNSPECIALIZED one: it is pointed at whatever repository it is given, so its
  lattice is that project's rather than a standing domain of its own, and it
  declares only `maintenance` and `goal-directed` over the position.

  **`assay` is the arrow no role expressed**, and it closes a real contradiction
  rather than adding a position. `deliver` is right that
  `validate ⊨ artifact ⟨NEVER r⟩`, and reading artifacts is reading files, which
  the architect contract calls a descent; left there, the skill obliged the
  design-holder to descend on every wave. The split is that the READ is
  delegable and the VERDICT is not. `assay ≜ reads⟨C · artifact⟩ → writes⟨C⟩` is
  the adjoint of `plan` — substrate enters the loop at `plan` and leaves at
  `assay` — and the new `assayer` agent holds it: it holds C and never the
  executor's spec, so there are still two descriptions and two witnesses, and it
  emits unachieved **concepts**, never a verdict and never prose about naming,
  structure or test quality. `deliver` gained `assay`, `assayer`, `achieved`,
  `unachieved` and the redispatch law. `validate ⊨ artifact ⟨NEVER r⟩` and
  `validate ⊨ self` are byte-identical to what they were, because they are the
  laws this change protects.

  **Nine role tokens are deleted** — `converse`, `curate`, `diagnose`,
  `document`, `operate`, `orchestrate`, `research`, `review` and `test`. Every
  one was composed by no agent. With no bundle to hold them they had drifted into
  different registers, which is the same anemia read from the catalog side:
  `curate ≜ ⟨canonical-corpus⟩` sat unheld while the actual curator declared
  `build`.

  **Two capabilities left the architect role**, because the written contract
  convicted them. `planning-decomposition` was glossed as the decomposition that
  hands work out while the contract says `⟨C → spec⟩ ↦ plan`, and an agent
  holding a capability exercises it.
  `review-critique ≜ ⟨adversarial threat-modeling severity-triage⟩` is a
  substrate act under a name that sounded conceptual; the critique this rung
  performs is `judge`, which the contract reserves by name. One edit on the role
  corrected both `architect` and `kino`, which is the mechanical proof that the
  fold works.

  **`purview-guardrail` makes the contract a bound rather than a steer.** A
  declared arrow that nothing scores is a steer, which is the floor and not the
  goal, so a pre-fire hook cell lands beside `stance-guardrail-pre` on
  `subagent.dispatch.pre` and `tool.use.pre` — descending is a mid-turn act and
  the turn-end guard is structurally blind to it. It carries its own rubric at
  the vendor-neutral `.agents/` root and its own entry under `gates`, because one
  gate means one contract and `gates` is keyed by owning cell precisely so a
  second guarded dimension is a second entry.

  The rubric carries **no role text and names no agent**. The worker reads the
  `## Role` section out of the holder's own deployed Target at run time and hands
  it to the judge as the law, so the gate scores what the corpus declares and a
  sixth role is judged with no edit to the gate — which is the allowlist failure
  the stance guard already paid for once, refused in advance. It blocks a
  dispatch whose codomain is `spec` from a holder whose arrow excludes it, a
  write whose codomain is `artifact` from a holder whose arrow excludes it, and a
  dispatch transcribing the operator's literal words; it passes every read, every
  dispatch the contract's own routing names, and every act its `reserves` clause
  names. Fail-open, evidence-checked and re-entry-capped, all three inherited
  from the sibling: a block whose cited span is not literally in the payload is
  discarded, because a fabricated refusal is not a lesser error than a missed
  one.

  **A position that reinstated the defect the ladder removes was authored and
  then retired in the same change**, and it is recorded rather than quietly
  dropped because the reasoning is the instructive part. `mav` was re-seated
  first onto a `contractor` position —
  `reads⟨intent · C · spec · artifact⟩ → writes⟨spec · artifact⟩` — which is the
  ladder collapsed into one agent. Paired with `principal-self` and a human ON
  the loop, that is the long-horizon case: precisely where an agent that also
  edits files spends its context on the cheapest act in the system, drifts into
  mechanical churn, and loses the conceptual objective it was dispatched to hold.
  The position had been authored to preserve `mav` as it already was rather than
  derived from the design, which is the grey-field move one level up from the
  register defect below. It is deleted, and no role in the corpus writes two
  layers.

  **"End-to-end" survives and its meaning moves.** Before the ladder, owning an
  outcome and performing every act were the same thing, so `mav`'s archetype
  fused them. They are separate now, and `architect` is the more powerful half:
  the only position carrying `principal-self`, the only one that may author and
  amend C, and the only one whose `judge` decides that anything advances.
  Reaching the substrate adds nothing to that and costs the one thing no other
  rung can supply.

  **Every role is the NOUN for the one who holds it**, and this correction is the
  first pass of this same work catching its own relapse. D3 diagnosed the old
  catalog as mixed registers — a job (`architect`), an act sequence (`build`), a
  target (`operate`) — and the repair fixed the anemia while inheriting the
  register verbatim from the token set it replaced, leaving one noun beside four
  verbs. Carrying an accreted corpus forward as a constraint is the grey-field
  relapse, and it survived the whole build. A role is a POSITION and a position
  is a WHO, so the catalog is `architect`, `planner`, `implementer` and
  `assayer`. Acts keep their verbs: `deliver` declares
  `assay : artifact → ℘(C)` beside `assayer : unit ⇀ agent`, because the two are
  different kinds of thing and each wears the register its kind takes.

  **`build` is deleted rather than renamed.** It was the worst of the verbs
  because it also failed to say what it named, and the position it was reaching
  for turned out to be one the design forbids: an agent that reads intent and
  writes the artifact is the collapsed ladder, whatever noun is put on it. The
  function the word was protecting — end-to-end ownership — is the architect's
  loop, and the hands it also implied belong to the implementer.

  **The cost, stated plainly: projected order changed.** The set fold emits role
  members before the holder's own, so `kino`'s capabilities now read
  system-design and research-investigation before its two film capabilities
  rather than after them, and `nico`'s capabilities, engineering principles and
  guardrails are likewise reordered against what it declared by hand. Nothing was
  dropped by the reordering — `nico` gains `separation-of-concerns` and the
  `design`/`deliver` apparatus from the position — but the Targets are not
  byte-identical to their predecessors, and order is visible to a reader.

## 0.3.0

### Minor Changes

- a6dc4ec: The stance guardrail is enrolled by placement, and it says when it did not run.

  **Breaking.** Three ways of deciding who gets judged are gone. The per-repo
  opt-in `agentfactory.stanceGuard` is deleted, with `stance-guard:on`, `:off` and
  `:status` — it asked whether a guard may run in a _directory_, and a stance
  belongs to the agent, not the checkout. The agent allowlist and its
  `STANCE_GUARD_AGENTS` override are deleted — a runtime self-filter over an
  enrollment the corpus already derives, which had drifted so far that `architect`
  and `kino` held principal authority and were never once judged. Enrollment is
  now the presence of `<scope>/stance/manifest.json`, which the projection places
  in each persona's own scope. The off switch is launching the harness without a
  persona.

  **Breaking.** `praxis-continuity` and `targets/continuity/` are retired with the
  praxis plan mirror they nudged about, along with the `continuity:install`,
  `continuity:uninstall` and `continuity:status` scripts. The plan-set mechanism
  survives its cell: `tooling/praxis/praxis.sh` is now
  `tooling/plan-set/plan-set.sh`, reached as `pnpm plan`.

  A turn the judge could not answer now leaves a `DARK` row in the per-session
  verdict log rather than nothing at all, so an unjudged turn and an absent
  session stop reading identically off disk.

  The evidence check no longer discards the collapse it exists to catch. It
  compared a quoted span to the turn with `grep -qF` and no `--`, so evidence
  opening with a markdown bullet was parsed as an option — and a tail-enumeration
  collapse _is_ a bullet list. Both sides are now flattened identically and
  compared with `--`, authenticating the judge's words rather than its list
  syntax.

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

- b0bc847: design, plan and deliver supersede praxis, and three agent rungs carry them

  `praxis` carried three activities with three different ends — capturing understanding,
  specifying work, and governing execution — with no seam between them. An agent asked to switch
  telos three times with nothing marking the switch settles into whichever posture its last tool
  call left it in, which in a tool-driven session is always the making.

  The deeper defect was verification. Acceptance keyed to a unit's own criteria is a **closed
  loop**: the author writes the unit, writes its criteria, and checks the return against them, so
  every term comes from one source. An executor satisfying the letter passes while the design goes
  unmet, and no instruction to "actually verify" repairs it — verification is a two-description
  operation and there was only ever one description.

  - **`design`** is the durative concept lattice, amended only by append-only supersession and cut
    into closed pieces. It is the second witness, and the one artifact that outlives every plan.
    praxis measured its own absence: sixteen retired plans, twenty-five laws established, zero
    surviving into any corpus.
  - **`plan`** decomposes ONE piece into units that each cite the concept they realize. Totality is
    a refusal, not a warning. Units are sliced on the design's seams rather than on file adjacency,
    because files are a lagging proxy for modularity — a file-cut yields units each touching a
    fragment of several concepts, which is exactly the state in which an executor finishes
    correctly and the system stays incoherent.
  - **`deliver`** dispatches, then validates the landed artifact against the design — never the
    report against the plan. `verify` is the executor's proof that it built to spec; `validate` is
    the principal's proof that it is what the design called for. Neither substitutes. It also
    carries the conduct: one plan bound at a time, finish before starting, repair what blocks the
    path and merely file what sits beside it.

  The laws that were paid for survive verbatim, including the output-array law and its measurement
  (six under-declared arrays in one plan, one cause: a footprint read off where a sign is DEFINED
  while the work is bounded by where it is USED).

  `architect`, `planner` and `implementer` are one ladder differing first in decision authority —
  principal at the top, withheld below — and sharing `mission-command`, whose escalation clause is
  the single law every rung obeys: surface the fork, do not resolve it. `architect` omits
  `software-engineering`, which is the delegation boundary made structural: the rung cannot
  conceive of itself as the builder.

  `kino` is the ai-film specialization of the architect rung, and needed two minted capabilities:
  `film-production` (identity and continuity are different problems needing different instruments;
  an art-bible entry is approved once and applied everywhere) and `generative-video` (reference
  conditioning is stateless, so whatever carries identity across a production is the ledger and
  never the model).

### Patch Changes

- f1c41e1: A handoff ends every turn, and an undefined `output-format` was fighting `plain`

  An operator reported that replies were still verbose and gave no clear indication of what was
  theirs to do — after `plain` had shipped. Measured cold, the deployed persona complies:
  5 runs on the deployed prompt scored a body bullet ratio of 0.0, no headings, and a
  well-formed action-item tail in 5 of 5. Two defects explain the gap between that and a live
  session, and neither is the register.

  **`check-in` scoped away most of its own extension.** Cold decode, asked whether a rule
  labelled `check-in` governs every message a worker sends: _"It applies only to some — the
  messages that actually are check-ins; it doesn't reach ordinary questions, replies,
  reports."_ The value's referent is EVERY operator-facing reply, and the rubric that enforces
  it had already written the scoping into law (`L1 · these govern operator-facing check-ins
only`). `handoff` decodes to the act this is — _"transfer of responsibility … at the boundary
  — when one person's or agent's part ends and another's begins … must contain current state,
  what was done, what remains, and who now owns the work"_ — and every agent turn IS that
  boundary, with the tail already in the sign's priors. The definiens is unchanged; only the
  sign moved. `L1` now says every turn that ends back at the operator is a handoff.

  **`output-format: structured-decision` was a layout, not a kind, and it had no definiens.**
  Its repertoire names artifact KINDS — code · document · natural-language · structured-data ·
  visualization · action. Cold decode of a prompt whose entire Output-Format section is that
  token: _"a bare label, not a spec … it fixes no headings, no field names, no ordering, no
  format … the best I can infer is: don't answer in freeform prose; separate the decision from
  its supporting reasoning in some labeled way."_ That is `plain` negated, emitted by the one
  section with nothing to hold it. `549d5d48` adopted it to give the rationale "a slot with a
  size"; the cell has neither. The bound on rationale volume is `plain`'s own "no more length
  than the decision carries", and the reply's shape is `handoff`'s — so mav's `output-format`
  is null and the cell is deleted.

  The carry-on skill's `check-in` is untouched: there it means the operator-interrupt act, which
  is a different concept and keeps the name.

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

- 94b3a7b: `stance-guardrail-pre` resolves its judge from its own hooks root, not from `~/.claude`

  The pre-guard named `$HOME/.claude/hooks/stance-guardrail` outright for its judge, its rubric
  and its miss log. The copy deployed under `~/.omp/hooks/` therefore reached across into the
  CLAUDE tree at fire time, and on a host with no claude deployment found nothing, failed open,
  and appended its misses to a directory that does not exist — a cell whose whole claim is
  harness-neutrality, coupled to one vendor's home by four literals.

  Every hooks root holds both hook dirs as siblings, so `../stance-guardrail` is true at every
  site this file can land. The sibling Stop worker already derives its own directory this way;
  this is the same derivation, one level up. The `STANCE_GUARD_DIR` / `STANCE_RUBRIC` /
  `STANCE_JUDGE_CMD` / `STANCE_GUARD_LOG` overrides are unchanged and still win.

  Traced on the omp-deployed copy after redeploy: `HOOKS_ROOT=/home/lex/.omp/hooks`,
  `JUDGE_CMD=sh /home/lex/.omp/hooks/stance-guardrail/stance-judge.sh`, where it previously
  resolved `/home/lex/.claude/hooks/stance-guardrail/stance-judge.sh`.

- fc9b334: The stance guard is told which loop-position is in force, derived from the transcript

  `carry-on` declares `loop-position ∈ {on-the-loop, out-of-the-loop}` as **live session state**, and
  nothing anywhere wrote it down. Every turn was therefore judged as though the session had just opened:
  a check-in is CORRECT at rest ("a session opens in orientation · intent is the operator's to set") and
  a COLLAPSE under an elevation the operator already granted, and the judge could not tell those apart
  because it was never told which one it was in.

  **The defect was total blindness, and it had a second cause that made it airtight.** The operator slot
  takes `| last` and filters out skill bodies — a filter added for a real reason, because 2.8 kB of a
  skill definition once reached the judge as "the operator's most recent instruction". A `/carry-on`
  invocation arrives wrapped in `<command-name>`, which is exactly what that filter drops. **The one
  utterance that establishes an elevation was the one utterance guaranteed never to reach the judge.**

  **Derived, not stored.** The transcript IS the record: the operator's own utterance is what established
  the elevation, it is already on disk, it is session-scoped by construction, and it cannot desync from
  what was actually said. A store would have needed a session id this worker is not always given, a write
  path, and a lifecycle — all to hold a fold over messages already present. The scan runs BEFORE the
  operator-slot filter and takes only the utterance (a `<command-message>`'s contents, never the body), so
  the grant crosses and the skill definition still does not.

  The payload now opens with a `=== STANDING DIRECTIVE ===` block naming the position, the verbatim grant,
  and how many operator turns have passed since. The rubric reads it first, and the semantics are the
  cell's: an elevation **RAISES** the bar rather than lowering it — the operator has said they are out of
  the loop, so a check-in or handed-back in-remit decision is a plainer collapse than usual — and it
  excuses exactly one thing, surfacing a fork the principal cannot resolve, which the elevation itself
  reserves. At rest, surfacing options where no mandate exists is correct and must not be blocked.

  **Measured honestly: this changes the judge's GROUNDS, not its verdicts.** Across three fixture pairs
  against the live rubric and a local model, the elevated run cites the directive ("despite the operator's
  'carry on' directive") and the resting run does not, but both reach the same decision — the structural
  turn-close rules catch those turns in either position. The gate therefore pins the PAYLOAD, which is the
  thing that was broken and that this corpus controls; pinning a flip would pin one judge sample.

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

- Updated dependencies [b0bc847]
- Updated dependencies [e2b2263]
- Updated dependencies [415a112]
  - @cratylus/schema@0.2.0

## 0.1.3

### Patch Changes

- 985aa89: A check-in ends on the operator's action items, and `emission-definiens` covers
  both values that govern a reply

  The operator asked for two things: a tighter `formality` prose, and a closing tail
  listing THEIR action items. Those are two dimensions, not one.

  **`plain` keeps the register; `check-in` owns the tail.** What a reply must CONTAIN at
  the end is report structure, so it belongs to `autonomy/check-in` — whose σ\*
  predecessor, `⟨conclusion-first · owed ↦ recommendation-bearing-tail⟩`,
  under-specified exactly here. A recommendation is something the agent holds; what the
  operator needs is the list of decisions and acts that are theirs.

  **ρ GENERALIZES FROM ONE DIMENSION TO A SET OF VALUES.** `check-in`'s referent is a
  reply the operator reads, so the same ruling applies and it becomes prose. The class
  is renamed `formality-definiens` → `emission-definiens`, and membership is now per
  VALUE rather than per dimension: every `formality` member governs the reply, but
  `autonomy` is a set dimension whose siblings — `decision-authority`,
  `mission-command`, `human-on-the-loop` — govern what the agent DOES and stay σ\*. ρ is
  a fact about an artifact, and the artifact is a value.

  **TWO PHRASINGS WERE MEASURED AND REJECTED.** Trimming `plain` for concision dropped
  `never standing alone` and body fragmentation rose sharply — the prohibitions are the
  binding clauses, and the positive halves alone read as a preference. Then, because a
  mandated list hands out general license to use lists, stating the limit inside
  `check-in` as "the report's only bulleted or numbered list" cost the tail itself: a
  prohibition beside a requirement reads as list-aversion and the tail vanished from 3
  of 4 runs. The shipped split carves the single permitted list IN, positively, from
  `plain`, and leaves `check-in` to require the tail.

  **THE FIRST INSTRUMENT WAS WRONG, and the cells now say so.** It scored every
  markdown line matching a list OR HEADING marker, so a reply of long prose paragraphs
  under two section headings scored as fragmented. Direction held under both
  instruments and the effect was large, so the ρ ruling stands, but magnitudes recorded
  earlier are not comparable. Current instrument — body bullet/numbered lines only,
  with the mandated action-item tail excluded — measures 0.11 over five runs, three of
  them zero, tail present in 4 of 5.

  `targets/guardrail/stance-judge-prompt.md` moves because it quotes the `check-in`
  value verbatim; regenerated by `project:targets`, not hand-edited.

## 0.1.2

### Patch Changes

- 805d19b: ρ(`formality-definiens`) = human — a value that governs the operator's prose is written in it

  An operator reported that both agents' check-ins "obfuscate important information within
  high cog, high verbosity, fragmented prose." The cause was `formality: formal ⟨terse ·
dense · symbol-bearing⟩`, carried by mav since 2026-06-24 and by nico since. `expansive`
  was not the repair: it negates the glyphs and pays for it with `unhurried`, licensing the
  volume the register was meant to cut.

  **COMPREHENSION WAS NEVER THE GAP.** The first attempt minted `plain ⟨prose · economical ·
¬symbol-bearing⟩` and it barely moved: measured on `omp/18.1.17` / `claude-opus-5:high`,
  one probe, n=3, scoring the share of reply lines that are bullets, headings, or numbered
  items, the baseline was 0.69 and the new value scored 0.73. Loading the residue with the
  full clause set reached 0.45 at best and 0.81 at worst. Asked to quote its own `formality`
  value, the same session returned it byte-for-byte with every glyph intact — so the value
  was parsed, stored, recitable, and disobeyed. A declaration whose own surface contradicts
  its content does not bind emission, however well the model reads it.

  Relocation was tested too, and it is not the driver: the whole declaration loaded through
  omp's personality slot instead of `--append-system-prompt` scored 0.71 against 0.69 for
  the append carrier, inside the noise band.

  **THE RULING.** ρ binds on `readers(a)`. Every other dimension's definiens is read by the
  model about the model, but a `formality` value's referent IS the text the operator reads,
  so the register it must be written in is the register it describes. `llm-native` already
  said so — `register-resolution ∉ signifier-derivation`: register resolves from the reader
  of what a value GOVERNS, never inherited from the notation its siblings are signified in.
  `formality-definiens` is therefore split out of `dimension-definiens` as ρ=human, and the
  whole five-member repertoire — `casual`, `neutral`, `plain`, `formal`, `expansive` — is
  rewritten as prose. Shipped configuration measures 0.22 (n=4, range 0.17–0.27), with zero
  notation glyphs in the reply.

  **BOTH GATES NOW READ ρ INSTEAD OF ASSUMING IT.** AC-RESIDUE's governing invariant already
  reads "every deployed artifact THE MODEL READS is formal σ*, never human prose — under ρ",
  so it consults `RHO` rather than treating every dimension value as a σ* payload; the
  density gate's unclaimed-class assertion narrows to ρ=LLM, the exemption its own header
  already grants `readme` and `human-doc`. One table, two gates, no drift.

  **AND THE RULING BITES.** `conform` exempts ρ=human, so the declaration alone would have
  let a value regress to σ* silently. The new leg gates formality by AC-RESIDUE's own
  predicate INVERTED — every ρ=human dimension value must be inadmissible as σ*, proving it
  is prose. `registerOf` is the wrong instrument and was tried first: it witnesses the
  tutorial-gloss register (hedges, second person, first-person walkthrough), which is a
  defect signal rather than evidence of prose, and clean prose carries none of those markers.
  Verified non-vacuous by reverting `formal` to its σ\* form and watching the leg convict it.

  mav also regains `llm-native`, dropped in `f7cf5d58`. Its `¬human-prose` clause is guarded
  by `reader = LLM ⟨¬inferred⟩` and so never reaches an operator reply; excluding the
  principle on that basis read the clause outside its own guard.

- 805d19b: omp launcher resolves its own path through symlinks

  `omp-launch` computed `dirname "$0"` and passed `--config <that dir>/omp.yml`.
  Linked into a `PATH` dir - the one way an operator runs a persona by name - `$0`
  is the link, and omp refused to start: `Config overlay not found:
~/.local/bin/omp.yml`. The script now walks `readlink` to the real file before
  resolving its directory, with hops capped so a link cycle fails instead of
  hanging.

## 0.1.1

### Patch Changes

- ae56e1e: `introspect` enumerates its subject instead of recalling it, and may not infer absence

  Two defects found by running the skill on a host with no corpus on disk, where recall
  has nothing to fall back on.

  **It dropped 2 of 20 dimensions and reported a denominator it never counted.** The run
  enumerated 18, silently omitting `Prime Principle` — the first section, and `cratylism`
  itself — and `Learning`, then concluded "2 of 18 dimensions diverge". The cell invited
  it: `O` was written as an illustrative membership list closing in an ellipsis, which
  reads as the definition rather than as an example. `O` is now
  `enumerate(## sections @ A's live Target) ⟨READ · ¬ recalled⟩`, the cardinality `|O|` is
  a declared term carried into `report`, and `|{row(o)}| ≠ |O| ⇒ ⊥`. A self-audit that
  miscounts its own subject reports a clean bill over an unread remainder.

  **It reported a capability as overridden when it had merely not been invoked.** `memory`
  came back `harness-override` — "no persistent memory across sessions" — while the store
  sat readable on that host and had been round-tripped through it the same day. The cell
  now states `rt(o) ⊨ EXERCISED ⟨¬ inferred-from-absence⟩` and
  `¬ exercised(o) ⇒ why(o) = unobservable ∧ why(o) ≠ harness-override`. `unobservable` was
  already in the taxonomy for exactly this; nothing routed to it.

## 0.1.0

### Minor Changes

- 26f6fef: The corpus is published, because a projector with no installable corpus is not installable software.

  `@cratylus/canon` was `ignore`d in the changesets config and sat at `0.0.0` while its five siblings
  reached `0.1.1`. The consequence was not cosmetic: `@cratylus/forge` ships the `cratylus` bin but
  deliberately does not depend on a corpus — it receives one as data through `cratylus.config.ts` — so
  with canon unpublished there was **no way for anyone to install a working cratylus at all**.

  It also decides a design question in the open. A globally installed corpus does not resolve from a
  config outside any `node_modules` (`ERR_MODULE_NOT_FOUND`, measured), and ESLint's answer to that —
  "plugins and shareable configs must still be installed locally" — defeats the model this project is
  built on, where an agent is a being that exists out-of-band from any one repository. So the corpus
  becomes a dependency of the CLI: always resolvable, wherever the CLI is installed.

  **Depending on the corpus is not assuming it.** The dependency makes canon resolvable; the config
  still names it. `init` writes `extends: [canon]`, a replacement corpus is installed and named the
  same way, and the projector continues to hold no opinion of its own about what an agent is.

### Patch Changes

- Updated dependencies [3e9c103]
  - @cratylus/schema@0.1.2
