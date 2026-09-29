# @cratylus/runtime

The **mechanism** concern of [cratylus](../../README.md) — the per-host runtime contract leaf.

A skill has two faces: what it _means_, which is canon's, and the programmatic thing it routes to,
which is this package's. `runtime` is the generic platform beneath that second face, plus the
lifecycle guardrails an agent would otherwise drift out of.

It **depends on nothing** in this system — zero `@cratylus/*` dependencies — and knows no harness and
no corpus. It ships with the agent and runs on the host; anything corpus-specific reaches it as
configuration the projection emitted.

## Capabilities

The runtime ships exactly four capabilities, each a module of this package and each known when the
runtime is built — nothing is discovered, registered or loaded. `CAPABILITIES` (`./capability`)
names them: `eventTap`, `design`, `plan` and `note`.

## Ports and strategies

The abstraction is a **port**; an implementation of it is a **strategy**. Each capability codes
against its port: `EventTapHost` (whose Claude strategy is `EventTapHostClaude`), `DesignHost`,
`PlanHost` and `NoteHost`. `MailboxHost` is a port too, under a provisional path, and is no
capability.

## Subpaths

| subpath                    | what it carries                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`                        | `EventName` and the `EventTapHost`, `DesignHost`, `PlanHost` and `NoteHost` ports                                                                                                                                           |
| `./events`                 | `EventName` — an event is a name; which names are valid is the corpus's, read from the host runtime config                                                                                                                  |
| `./ports/event-tap`        | `EventTapHost` — a harness-neutral passive observer contract                                                                                                                                                                |
| `./capabilities/event-tap` | the event-tap capability: `dispatchEventTap`, `EventTapHostClaude`, `EVENT_TAP_ID`                                                                                                                                          |
| `./capability`             | `CAPABILITIES`, `Capability` — the four capabilities the runtime ships                                                                                                                                                      |
| `./main`                   | `runCli` — the thin `cac` CLI that routes each capability to its verb surface                                                                                                                                               |
| `./runtime-config`         | `loadRuntimeConfig`, `runtimeConfigPath`, `nativeEventsOf`, `RuntimeConfig`                                                                                                                                                 |
| `./bin-name`               | `CLI_BIN` — the one home for the executable's name on PATH                                                                                                                                                                  |
| `./ulid`                   | `ulid`, `monotonicFactory`, `decodeTime`, `isValidUlid` — the one ULID                                                                                                                                                      |
| `./verb-flags`             | `VerbFlags`, `Flags`, `Argv`, `readArgv`, `refused`, `nearest` — each verb's flags and whether each takes a value, the one reader (a flag that takes no value never takes the next token), and the one unknown-flag refusal |
| `./package.json`           | the manifest                                                                                                                                                                                                                |

The `.` barrel is pure contracts: no implementation.

## The three domains

Notes, design and plans are immutable records in the repository, folded when someone asks. Agents
and users meet them only through three capabilities that ship inside the runtime, each routed by
`runCli` to its own verb surface and each with its port in the `.` barrel:

| capability | port         | verbs                                                                       |
| ---------- | ------------ | --------------------------------------------------------------------------- |
| `design`   | `DesignHost` | `show`, `define`, `amend`, `retract`, `reconcile`, `trace`                  |
| `plan`     | `PlanHost`   | `show`, `add`, `advance`, `retract`, `revise`, `bind`, `close`, `reconcile` |
| `note`     | `NoteHost`   | `show`, `capture`, `revise`, `retract`, `reconcile`                         |

Every input names an entity by name, and every output is the domain's view, in the domain's own
words. Where a merge left one name held by more than one entity, the view prints each holder's
identity beside it as `name (identity <id>)`, and that printed form is exactly the input that
addresses one holder. A write is all or nothing: it is checked and its view rendered before anything
reaches the repository, so a refusal writes nothing and exits `1` naming the verb that would succeed.
A view's header says when it includes writes not yet committed. Where no plan is in view, a unit is
printed with its plan, `u of plan p`, and that form is accepted wherever a unit is named. What
must be resolved first names its cause and what moved, lists a plan view's own items only, and
never asks of a closed plan's frozen units. When the store itself fails — no repository, a damaged
stored entry — the capability says so plainly and names what to repair. `plan show <plan>` shows any plan
whole; a unit's pin is kept by every revise until one says `--repin` with a reason. The plan lifecycle
arrives as `configuration.plan` in the host runtime config, which deploy emits; without it `plan`
refuses and names the deploy, and `design show` shows the lattice and says the plans standing on it
wait for that deploy.

Each verb declares, beside it, the flags it takes and whether each takes a value, and one reader in
`./verb-flags` reads the verb's arguments against that declaration. A flag that takes a value is
given as `--flag value` or `--flag=value`, taking the next token unless it begins with `--`; a flag
that takes no value (`plan`'s `--repin`) is given alone and never takes the next token, so in
`--repin -x` the `-x` is read as the attempted flag it is. An unknown flag is refused before the
verb acts: nothing is written, and the call exits `1`. A single-dash token (`-x`) is an attempted
flag and is refused too, as is a flag that takes no value given one (`--repin=x`). One refusal,
homed in `./verb-flags`, names every such flag as given, the verb's nearest flag to each when one is
within an edit for every three letters (`--glose` and `-gloss` get `--gloss`), and every flag the
verb takes, and asks for the call to be corrected and run again.

## Routing

`runCli` routes `<capability> <verb> [args]` through one table typed over `Capability`, so a
capability without a route does not compile. Each capability's verb surface owns its verbs' flag
grammar: `eventTap` prints its JSON result, and `design`, `plan` and `note` print their view.
A refusal exits `1` as `cratylus: <message>`; a first word that is no capability exits `1` naming
the four. Never a silent no-op.

`runCli` exports but does not invoke. The invoking bin lives in [`cratylus`](../cli/README.md),
which hands the runtime every command whose first word is a member of `CAPABILITIES`.

## The host runtime config

`loadRuntimeConfig` reads `$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json`, which deploy and
install write: the corpus's lifecycle-event vocabulary (`events`), each harness's native event
names (`harnesses.<harness>.native`) and each capability's configuration (`configuration`). Any one
of the three is a live config. A capability that needs a part the host lacks refuses and names the
command that writes it.

## The bin name

`CLI_BIN` (`cratylus`) lives here because four packages speak it and three of them speak it
from inside an emitted artifact — a projected skill shim, a generated hook script — where no compiler
can see it. A rename that missed one produced a script that failed on a host rather than at build.

Flipping this one symbol really is the whole rename: `RUNTIME_CONFIG_NAME` (`.cratylus.json`) and
the event-tap's `EVENT_TAP_ID` are template-derived from it and move without being edited. The one
irreducible second copy is [`cratylus`](../cli/README.md)'s `bin` key, which npm reads with
no compiler in the loop; their agreement is held by a test.
