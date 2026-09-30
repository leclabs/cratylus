# @cratylus/runtime

## 0.8.1

### Patch Changes

- a0e28a8: The loop's texts say each unit is built in its own isolated worktree off the plan's line and never on main, and no longer teach the mechanics: branch names, worktree paths and git pipelines are dropped, and `lacks` and `gather` are stated as the outcomes they check and bring about. The runtime's refusal of a bound plan whose line has no worktree says what is missing and no longer hands the reader a branch name, a path and a `git worktree add` command.

## 0.8.0

### Minor Changes

- f4227d8: `plan bind` now cuts the plan's line — the branch `plan/<plan>` from the HEAD of the checkout it runs in, in a worktree named after the main one, or the worktree that already holds that branch — copies into it every record of the plan and its units that the checkout holds and the line lacks, and writes the bind there. From then on every record written about a bound plan is written on its line from any checkout: each plan verb on the plan or one of its units, and each note write whose blocks name the plan or one of its units before or after it. Each such output ends by naming the branch and the worktree it wrote to. A write about a bound plan refuses, writing nothing, when no worktree holds its line — the branch kept without its worktree, or no branch at all, as when it was merged early, deleted, or bound before lines existed — and names the `git worktree add` that restores or cuts it. `plan show` and `note show` read the union of the checkout's records and every line's, so they print the same from the main checkout, the line and a branch cut from it; their header names the first line's commit. Design writes, writes about a plan that is not bound and notes naming no bound plan are written where they run, as before. No verb and no flag is added.

## 0.7.0

### Minor Changes

- 5635979: A unit carries a ledger of what happens to it while it is worked. Four new `plan` verbs write it: `land` (the commit that holds its work), `assay` (a verdict, `achieved` or `not-achieved` with what was missing, on a commit), `whole` (the line's commit holding the unit) and `broke` (the check that failed). An event is admitted only while the unit's plan is bound and the unit is in flight, and is refused on a proposed or closed plan and on a unit not yet started or already done. `plan show <unit> --plan <p>` prints the ledger, each unit's line in `plan show` carries its latest event, and an event's own output prints the unit's line and its ledger and none of its spec. Revise, advance and reconcile carry the ledger over; a unit written before this change reads as an empty ledger.

## 0.6.0

### Minor Changes

- 759518b: The event tap no longer pretends to attach to omp.

  `@cratylus/runtime`: `cratylus eventTap <verb>` now resolves which harness invoked it and refuses when that harness has no tap strategy. Only Claude Code has one today, so from an omp session every verb exits non-zero, names omp and Claude Code, and writes nothing. Before, `install` wrote `<cwd>/.claude/settings.json`, a file omp never reads, and `status` reported `attached: true` for a tap that captured nothing. The harness is read from the invoking environment, not the host config: the config holds one stanza per deployed harness, so on a host with both it cannot say which is calling. omp exports `OMPCODE` and also Claude Code's `CLAUDECODE`, so omp is tested first. A caller whose environment names no harness still gets Claude Code, as before. New exports from `@cratylus/runtime/capabilities/event-tap`: `EVENT_TAP_HARNESSES`, `hasEventTapStrategy`, `invokingHarness`; `EventTapDispatchOpts` gains `harness` and `env`.

  `@cratylus/forge`: `project` warns once when a corpus declares the `eventTap` capability and the target harness has no tap strategy, naming the skill, the capability and the harness and saying no events are captured there. The skill and its shim still ship as a declaration.

  `eventTap install` on Claude Code no longer drops events silently. The result's `events` lists only the events actually tapped, and any requested event Claude Code fires no native event for appears under `skipped`, each with its reason, and draws a stderr warning naming the event and Claude Code. When none of the requested events can be tapped, `install` refuses and writes nothing, instead of registering an empty hook block. `EventTapHostClaude.install` now returns the `EventTapInstall` report; `EventTapDispatchOpts` gains `warn`.

## 0.5.0

### Minor Changes

- 67b10c4: Drift and suspicion say what moved

  A drifted or suspect unit now names how its concept moved: withdrawn, diverged,
  or amended, and for an amendment which of anchor, gloss and factors differ
  between the pinned version and the one head, factors named as those added and
  those removed — `leaf amended in gloss and factors (added c1)` — or that none
  differ, `leaf amended, nothing differs`. Suspicion carries the same detail for
  each concept beneath: `beneath leaf, base amended in gloss since pinned`. The
  lines state facts about the design and never spell a response to them.

## 0.4.0

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

- 85df8f7: The host runtime config keeps one stanza of native event names per harness

  `~/.cratylus.json` (or `$AGENT_RUNTIME_CONFIG`) held one flat map of native event names, so the last deploy won: deploying for Claude and then for omp left Claude reading omp's names. Native names now live in one stanza per harness, `harnesses.<harness>.native`. A deploy writes the corpus's parts (`events.vocabulary`, `configuration`) and its own harness's stanza, and leaves every other harness's stanza as it found it. The deploy log names the stanza it wrote.

  `@cratylus/runtime`: `nativeEventsOf(config, harness)` is the one reader of native names. It returns that harness's stanza, or throws a refusal naming `cratylus install --harness <harness>` and `cratylus deploy --harness <harness>`. `RuntimeConfig` gains `harnesses`, and `RuntimeEvents` loses `native`. `cratylus eventTap` asks for `claude`'s names through it.

  `@cratylus/forge`: `emitRuntimeConfig` and `runtimeConfigDocument` take the harness's name (`harness`, the adapter's `name`) with its `nativeEvents`, and the result carries the `stanza` written. `EmittedEvents` loses `native`, and `EmittedRuntimeConfig` gains `harnesses`.

  **Breaking.** The old flat shape is not read. On a host deployed before this change, `cratylus eventTap` refuses until you run `cratylus install --harness claude` or `cratylus deploy --harness claude` once.

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

## 0.3.0

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

- fcf5db6: The runtime gains the design domain: the concept lattice computed from the design records

  `@cratylus/runtime` holds each concept as an entity of the record store's `design` domain, whose
  payload is its anchor, gloss and factors, with factors stored by entity so that relabelling an
  anchor never breaks a reference. Concepts are named by anchor at the domain's boundary, and no
  caller ever names a record. An anchor is held by the live concept carrying it, by a withdrawn
  concept that keeps it, and by a diverged concept for every anchor its heads carry. Where a merge
  leaves an anchor held by more than one concept, each holder's identity is shown and accepted beside
  the anchor, as a separate field no anchor can ever spell, and only there. The domain defines a
  concept, amends it (a new version of the same concept over every current head, which reinstates a
  withdrawn concept), retracts it, and reconciles a diverged concept over every head. Amending or
  retracting a diverged concept refuses and names reconciliation. Heads that carry the same payload
  have converged and read as one.

  A write refuses an empty anchor, gloss or reason, a factor named twice, and a factor it newly adds
  on a diverged concept (reconcile that concept first). It also refuses to introduce a violation of
  the design's relational laws: an anchor held by two concepts, a factor cycle, or a factor on a
  withdrawn concept, which covers retracting a concept others factor on. A violation counts as
  introduced when its concepts were not already bound together in a standing violation of the same
  law. A write that shrinks a violation or leaves it standing is allowed, so a merge's incoherence
  can be repaired one write at a time. The domain's reads compute, at the moment of the read, every
  live concept, divergence, and incoherence. They also answer the `design` skill's `closure` and
  `blast`, and give a concept's history with reasons. The module is internal: the `design`
  capability composes it.

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

- 6f18d1c: The runtime gains the notebook: notes held as records, folded at read time

  A note is an entity in the record store's `notebook` domain. Its payload is its title, kind, topic,
  body and the plans or units it blocks. Its title is its name, and its identity is the store's
  minted one, never a sequence number. One live note per title: a live note holds its title, a
  diverged note holds every title its heads carry, and a withdrawn note holds none. One title held
  by two notes is incoherence, which only a merge produces, and `notebook` reports it. `capture`,
  `revise` and `reconcile` refuse only a write that introduces a duplicate, meaning one whose notes
  were not already bound together in a standing duplicate. A write that shrinks a duplicate or
  leaves it standing proceeds, so a merge-produced collision can be repaired one retitle at a time.
  Anyone may capture, revise, retract or reconcile a note. `capture` has no admission bar and refuses
  only a malformed shape (a field missing or of the wrong type) or an introduced duplicate. It never
  judges content. `revise` writes a whole-state version over every head of the note, and `retract`
  writes a retraction that becomes its head. Heads that carry the same payload have converged and
  read as one live note. `notebook` computes the live notes, reports every diverged note with all its
  heads without ever picking one, and reports duplicate titles. `revise` and `retract` refuse a
  diverged note and point to `reconcile`, which writes one whole-state version superseding every
  head. A note's kind is a label the runtime never interprets. `owedRulings` names each plan or unit
  that a live note blocks, or that any head of a diverged note blocks, together with the notes
  blocking it. The module is internal and is exported through neither the `.` barrel nor a subpath.

- c5bc3d9: The runtime gains the pin: a unit's reference to the concept version it realizes

  `take` pins a concept only when the concept and its whole closure are settled and live. It holds
  a head of the concept, a version, together with a head of every other concept in the closure at
  that moment; heads carrying one payload have converged and read as one settled head. It refuses
  when the concept or any concept in its closure is unknown, diverged or withdrawn, since there is
  then no single version to pin. `drifted` reads a pin whose version is no longer the concept's
  only settled head: the concept was amended, withdrawn or has diverged, even when the pinned
  version is still one of its heads. A concept whose converged heads include the pinned version has
  not drifted. A pin that has not drifted is `suspect` when any other concept in the closure has
  diverged, been withdrawn or gained a newer version since the pin was taken, so the two readings
  are disjoint. Both are
  computed from the design domain's fold at the moment of the read. The caller supplies the closure
  through a port, so the pin imports nothing from the design domain. The pin is internal to the
  runtime and is exported through neither the `.` barrel nor a subpath.

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

- eeab4cc: The runtime gains the plan as an entity over the record store

  A plan's records hold its name, the set of concepts it realizes and its lifecycle state. Propose
  writes its first version; revise, bind and close supersede every head of it. Revise may change its
  name or its concepts, never its state; bind and close move it forward along its lifecycle. The
  final state is final: a closed plan is never revised, keeps its name, and stays readable in the
  fold, and a diverged plan with a closed head reconciles to closed only. A plan's concepts form a
  set, and a duplicate is refused.

  Two laws bind plans together: one live plan per name, and at most one plan bound — binding a plan
  returns whichever plan was bound to the first state. A merge can still break either; each such
  incoherence is reported. Every write passes one gate, which refuses it only when it introduces a
  violation — one whose plans were not already bound together in a standing violation of the same
  law — so a write that shrinks a violation or leaves it standing is allowed, and every incoherence
  can be repaired one write at a time. An owed ruling naming a plan blocks binding it. A plan whose
  heads carry more than one payload has diverged: it refuses revise, bind and close and is settled by
  reconcile, one version superseding every head; heads carrying one payload have converged, and the
  next write names them all. The lifecycle's states are received as a parameter (the states in order,
  the one at most one plan holds, the final one), never spelled in the runtime. The module is
  internal and not yet exported.

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

- 0dcbc9a: The runtime gains the unit: one unit of work in a plan, as records in the `unit` domain

  A unit's payload is its plan, its full spec (name, intent, static inputs, deps, outputs, acceptance
  criteria), its lifecycle state and its pin. The concept a unit realizes is the one its pin names,
  held once, so the two can never disagree. Add writes its first version in the lifecycle's first
  state, revise supersedes its spec and pin, advance moves it exactly one step forward and refuses any
  other move, retract withdraws it, and reconcile writes one version over every head of a diverged
  unit. An ordinary write on a diverged unit refuses and points to reconcile; a unit whose heads
  converged on one payload reads settled, and a write names every head.

  The unit laws: one live unit per name within its plan, dependencies acyclic and naming live units
  of the same plan, and a plan that is not withdrawn. A write is refused only when it would introduce
  a violation, one whose units no standing violation of the same law already binds together, so
  incoherence, like divergence, arises only from merges, the owner keeps working while one stands,
  and a write that shrinks it (fewer namesakes, a shorter cycle) is allowed, so every incoherence is
  repaired one write at a time. Incoherence is reported: a dep on a withdrawn unit, a
  unit of a withdrawn plan, a dep cycle, one name on two live units of a plan. A withdrawn concept is
  not incoherence; it drifts the pins naming it.

  Readiness is computed at the read and never written into a record: a unit is ready when it has not
  started, every dep has reached the state that satisfies a dependency or moved past it, and no owed
  ruling names it or its plan. The frontier (ready and in-flight units) and the waves are computed the
  same way. The unit lifecycle vocabulary, plan liveness and the entities owed rulings name are
  received as parameters; the runtime spells no lifecycle state.

- 235f77d: The runtime gains the view: each domain's current state rendered for its reader in three layers

  `@cratylus/runtime` renders the design, a plan and the notebook, each through one function
  (`designView`, `planView`, `notebookView`). The first line names the commit the state was computed
  at, with counts. Then comes everything to resolve before the rest is trusted: divergence and
  incoherence in every domain, drifted and suspect units and owed rulings in a plan, owed rulings in
  the notebook. Incoherence has four kinds, each naming what it involves: a reference to a withdrawn
  entity, a cycle, one name on two or more live entities, and more than one plan in the state that
  admits one. Last comes the whole domain, one line for every live item, including one the structure
  cannot yet place, which prints with the reason. The view orders the lattice root to primitive from
  the factors it is given: the roots are the concepts nothing live factors on, and a concept in or
  beneath a factor cycle prints after the lattice, naming the concepts above it. Each concept shows
  every plan standing on it with that plan's state. A plan is its whole state (its name, the concepts
  it realizes and its lifecycle state), and when a merge leaves more than one plan in the state
  admitting one, the view shows each of them with its own units. A plan's units print in wave order
  with the frontier marked on their lines, each naming its concept; a unit given no wave prints after
  the waves with the deps that hold it. Notes group by kind, then topic, one line per note led by its
  title, which is its name; the view never interprets a kind.

  Every item and every reference arrives by name. A name is held by every live entity carrying it,
  by a withdrawn entity keeping it, and by a diverged entity for every name its heads carry. Where a
  merge left a name held by more than one entity, the name arrives with the entity's identity, and the
  view prints that identity beside the name everywhere the name prints and never otherwise; the
  incoherence line lists each holder with how it holds the name (live, withdrawn or diverged). Naming
  an item drills into it in full, or into every version of it when it is diverged, matching a diverged
  item by any of its names; a bare shared name drills into each item carrying it, and a withdrawn
  holder drills to its last version, marked withdrawn, so no printed identity is a dead end. The
  view receives states, kinds, waves, frontier, drift and suspicion already computed, and spells no
  lifecycle state or note kind. It is internal: exported through neither the `.` barrel nor a subpath.

### Patch Changes

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

## 0.1.1

### Patch Changes

- a019716: Every CLI reports the version its manifest declares.

  `0.1.0` shipped with `cratylus-run --version` and `cratylus --version` answering `0.0.0`: the
  number was a literal in TypeScript, and `changeset version` rewrites manifests rather than
  source, so the two diverged at the first release and would have stayed diverged. Each now
  reads its own manifest by package self-reference, and a gate holds the shape.

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
