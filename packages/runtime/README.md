# @cratylus/runtime

The **mechanism** concern of [cratylus](../../README.md) — the per-host runtime contract leaf.

A skill has two faces: what it _means_, which is canon's, and the programmatic thing it routes to,
which is this package's. `runtime` is the generic platform beneath that second face, plus the
lifecycle guardrails an agent would otherwise drift out of.

It **depends on nothing** in this system — zero `@cratylus/*` dependencies — and knows no harness and
no corpus. It ships with the agent and runs on the host; anything corpus-specific reaches it as
configuration the projection emitted.

What every package is for is [ARCHITECTURE.md](../../ARCHITECTURE.md)'s. The commands a consumer
types, with their flags, are [the `cratylus` README](../cli/README.md)'s; this README is for the
author of a corpus whose skills route here, and for a library user of the package.

## Capabilities

The runtime ships exactly four capabilities, each a module of this package and each known when the
runtime is built — nothing is discovered, registered or loaded. `CAPABILITIES` (`./capability`)
names them: `eventTap`, `design`, `plan` and `note`. A corpus's skill names one of them as
`runtime: { capability: … }`.

| capability | port           | verbs                                                                                                          |
| ---------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `eventTap` | `EventTapHost` | `install`, `uninstall`, `read`, `status`                                                                       |
| `design`   | `DesignHost`   | `show`, `define`, `amend`, `retract`, `reconcile`, `trace`                                                     |
| `plan`     | `PlanHost`     | `show`, `add`, `advance`, `retract`, `revise`, `bind`, `close`, `reconcile`, `land`, `assay`, `whole`, `broke` |
| `note`     | `NoteHost`     | `show`, `capture`, `revise`, `resolve`, `retract`, `reconcile`                                                 |

The abstraction is a **port**; an implementation of it is a **strategy**. Each capability codes
against its port, and the event tap's Claude strategy is `EventTapHostClaude`. The `.` barrel is pure
contracts: no implementation.

## Subpaths

| subpath                    | what it carries                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`                        | `EventName` and the `EventTapHost`, `DesignHost`, `PlanHost` and `NoteHost` ports                                                                                                                                                                                                                                                       |
| `./events`                 | `EventName` — an event is a name; which names are valid is the corpus's, read from the host runtime config                                                                                                                                                                                                                              |
| `./ports/event-tap`        | `EventTapHost` — a harness-neutral passive observer contract                                                                                                                                                                                                                                                                            |
| `./capabilities/event-tap` | the event-tap capability: `dispatchEventTap`, `EventTapHostClaude`, `EVENT_TAP_ID`                                                                                                                                                                                                                                                      |
| `./capability`             | `CAPABILITIES`, `Capability`, `CAPABILITY_SUMMARIES` — the four capabilities the runtime ships, and a line on each                                                                                                                                                                                                                      |
| `./main`                   | `capabilityCommands` — one Commander command per capability, its verbs' help printed from the declarations, each routed to its verb surface                                                                                                                                                                                             |
| `./runtime-config`         | `loadRuntimeConfig`, `runtimeConfigPath`, `nativeEventsOf`, `nativeActsOf`, `RuntimeConfig`                                                                                                                                                                                                                                             |
| `./bin-name`               | `CLI_BIN` — the one home for the executable's name on PATH                                                                                                                                                                                                                                                                              |
| `./ulid`                   | `ulid`, `monotonicFactory`, `decodeTime`, `isValidUlid` — the one ULID                                                                                                                                                                                                                                                                  |
| `./verb-flags`             | `VerbFlags`, `Verb`, `Flags`, `Flag`, `valueFlag`, `switchFlag`, `Argv`, `readArgv`, `refused`, `nearest` — each verb's summary, positional and flags (whether each takes a value, and its description), the one reader (a flag that takes no value never takes the next token), and the one refusal of an untaken flag or surplus word |
| `./package.json`           | the manifest                                                                                                                                                                                                                                                                                                                            |

## The three domains

Notes, design and plans are immutable records in the repository, folded when someone asks. Agents
and users meet them only through the `design`, `plan` and `note` capabilities, each routed by
`capabilityCommands` to its own verb surface and each with its port in the `.` barrel.

Every input names an entity by name, and every output is the domain's view, in the domain's own
words. Where a merge left one name held by more than one entity, the view prints each holder's
identity beside it as `name (identity <id>)`, and that printed form is exactly the input that
addresses one holder. A write is all or nothing: it is checked and its view rendered before anything
reaches the repository, so a refusal writes nothing and exits `1` naming the verb that would succeed.
A view's header says when it includes writes not yet committed. Where no plan is in view, a unit is
printed with its plan, `u of plan p`, and that form is accepted wherever a unit is named. When the
store itself fails — no repository, a damaged stored entry — the capability says so plainly and names
what to repair.

`plan show <plan>` shows any plan whole, and a unit's pin is kept by every revise until one says
`--repin` with a reason. The plan lifecycle arrives as `configuration.plan` in the host runtime
config, which deploy emits; without it `plan` refuses and names the deploy, and `design show` shows
the lattice and says the plans standing on it wait for that deploy.

A unit carries a ledger of what happens to it while it is worked, written as it happens: `plan land`
records the commit that holds its work, `plan assay` an assay's verdict on a commit (`--verdict`
`achieved` or `not-achieved`, with `--missing` once per part a not-achieved verdict names),
`plan whole` the line's commit holding it, and `plan broke` the failing `--check` when it broke the
whole.
`plan land` refuses, writing nothing, a commit the main checkout or the plan's line already holds, a
commit whose history does not run from the plan's line, and a commit the repository cannot resolve:
a unit is built in a worktree of its own, off the line.
Each event carries its author and time, and is admitted only while the unit's plan is bound and the
unit is in flight — past its lifecycle's first state and short of the one that satisfies a
dependency. `plan show <unit> --plan <p>` prints the ledger in order, and each unit's line in
`plan show` carries its latest event. A revise, an advance and a reconcile carry the ledger over, a
reconcile of units that recorded different events carrying their union in time order.

A bound plan's records live on its line, the branch `plan/<plan>`. `plan bind` cuts it from the
HEAD of the checkout it runs in into a worktree named `<main worktree path>.plan-<plan>` (or uses
the worktree that already holds the branch), moves onto it every record of the plan, its units and
the notes blocking either that the checkout holds — each is no longer in the checkout or its index
afterwards, whether the line lacked it or already held it, unless the checkout's HEAD tracks it,
since a committed record is never removed — and writes the bind there. While
the plan is bound, every write about it — each plan verb on the plan or one of its units, and each
note write whose blocks name the plan or one of its units, or that resolves a note to one of its units,
before or after the write — is written
into the line's worktree from whichever checkout runs it, and its output ends by naming the branch
and worktree it wrote to. A bound plan with no worktree holding its line refuses the write, writes
nothing, and says what is missing; `bind` refuses a branch no worktree holds the same way.

The runtime commits nothing: committing the line stays with whoever works it, and the main line
receives the records only when the closed plan is released. A read is the union of the checkout's
records and those of every line's worktree (a line no worktree holds is read from what its branch
commits), so `plan show` and `note show` print the same state from the main checkout, from the
line and from a branch cut from it. Design writes, writes about a plan that is not bound and notes
naming no bound plan are written where they run.

## Verbs and their flags

Each verb declares, beside it, a one-line summary, the positional it acts on, and the flags it
takes, each with whether it takes a value and a one-line description; a flag cannot be taken
undescribed, since the declaration does not compile without it, and each capability's one-line
summary is declared once in `CAPABILITY_SUMMARIES` (`./capability`). One reader in
`./verb-flags` reads the verb's arguments against that declaration. A flag that takes a value is
given as `--flag value` or `--flag=value`, taking the next token unless it begins with `--`; a flag
that takes no value (`plan`'s `--repin`) is given alone and never takes the next token, so in
`--repin -x` the `-x` is read as the attempted flag it is. A verb takes at most its declared
positional: a second word where it declares one, any word where it declares none, is refused, so
no word a consumer types is silently dropped. An unknown flag is refused before the
verb acts: nothing is written, and the call exits `1`. A single-dash token (`-x`) is an attempted
flag and is refused too, as is a flag that takes no value given one (`--repin=x`). One refusal,
homed in `./verb-flags`, names every such flag as given, the verb's nearest flag to each when one is
within an edit for every three letters (`--glose` and `-gloss` get `--gloss`), every surplus word,
and the verb's positional and every flag it takes, and asks for the call to be corrected and run
again, or for the verb's `--help`, in one line.

## Routing

`capabilityCommands` builds one Commander command per capability, and routes
`<capability> <verb> [args]` through one table typed over `Capability`, so a capability without a
route does not compile. Each capability's verb surface owns its verbs' flag grammar: `eventTap`
prints its JSON result, and `design`, `plan` and `note` print their view. A refusal exits `1` as
`cratylus <message>` (the message opens with the capability and the verb, as `cratylus plan assay: …`),
and a verb the capability does not declare is refused by `verbOf` in the one wording every dispatcher
throws when called as a library. Never a silent no-op.

`capabilityCommands` exports commands and builds no program. The program lives in
[`cratylus`](../cli/README.md), which adds them to one tree beside the projector's commands, so its
`--help` lists every command and capability there is.

## The host runtime config

`loadRuntimeConfig` reads `$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json`, which deploy and
install write: the corpus's lifecycle-event vocabulary (`events`), each harness's stanza
(`harnesses.<harness>`) and each capability's configuration (`configuration`). Any one of the three
is a live config. A capability that needs a part the host lacks refuses and names the command that
writes it.

A stanza holds the harness's native event names (`native`, canonical name → native name) and, where
the harness fires an event only as a native event narrowed to the tool that performs it, that act's
binding (`acts`, canonical act → `{ event, matcher }`). Claude Code's `operator.consult.pre` is
`PreToolUse` matching `AskUserQuestion`, and `subagent.dispatch.pre` is `PreToolUse` matching
`Agent|SendMessage`; deploy writes both from the claude adapter, as the projection itself binds
them. `nativeEventsOf` and `nativeActsOf` each ask for one harness's. A stanza an older deploy wrote
holds names only and reads with no acts, so an act event is skipped on it, as it was.

## The bin name

`CLI_BIN` (`cratylus`) lives here because four packages speak it and three of them speak it
from inside an emitted artifact — a projected skill shim, a generated hook script — where no compiler
can see it. A rename that missed one produced a script that failed on a host rather than at build.

Flipping this one symbol really is the whole rename: `RUNTIME_CONFIG_NAME` (`.cratylus.json`) and
the event-tap's `EVENT_TAP_ID` are template-derived from it and move without being edited. The one
irreducible second copy is [`cratylus`](../cli/README.md)'s `bin` key, which npm reads with
no compiler in the loop; their agreement is held by a test.
