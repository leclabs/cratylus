# @cratylus/runtime

The **mechanism** concern of [cratylus](../../README.md) — the per-host runtime contract leaf.

A skill has two faces: what it _means_, which is canon's, and the programmatic thing it routes to,
which is this package's. `runtime` is the generic platform beneath that second face, plus the
record (the concept journal and the ledger) an agent reconstitutes from.

It **depends on nothing** in this system — zero `@cratylus/*` dependencies — and knows no harness and
no corpus. It ships with the agent and runs on the host; anything corpus-specific reaches it as
configuration the projection emitted.

What every package is for is [ARCHITECTURE.md](../../ARCHITECTURE.md)'s. The commands a consumer
types, with their flags, are [the `cratylus` README](../cli/README.md)'s; this README is for the
author of a corpus whose skills route here, and for a library user of the package.

## Capabilities

The runtime ships exactly three capabilities, each a module of this package and each known when the
runtime is built — nothing is discovered, registered or loaded. `CAPABILITIES` (`./capability`)
names them: `concepts`, `ledger` and `versionSkew`. A corpus's skill names one of them as
`runtime: { capability: … }`.

| capability    | verbs                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concepts`    | `overview`, `state`, `design`, `history`, `decisions`, `leakage`, `purpose`, `context`, `define`, `supersede`, `retire`, `decide`, `accept`, `classify`, `deprecate` |
| `ledger`      | `state`, `story`, `task`, `end`                                                                                                                                      |
| `versionSkew` | `report`                                                                                                                                                             |

Every journal entry records who appended it (`by`: the agent making the call, named by the harness
in `CRATYLUS_AGENT`, else git's user). History is held by review, as each change's risk calls
for, never by refusal (decision 0274): the journal and the ledger are append-only because their
verbs only append.

`concepts` keeps the concept journal, the one account of the design; it explains itself (see
[Explaining itself](#explaining-itself)), and its verbs are documented in
[the `cratylus` README](../cli/README.md). Its `leakage` query, and the answer of each `define`,
`supersede` and `decide`, warn of implementation leakage: text that should state meaning naming
code, files, commands, flags, identifiers, tools or libraries. Detection is lexical and only ever
warns; a context's own words, its concept names and each plain word its current subject names,
are never leakage, though a command, code span or flag holding a subject's word still is, and a decision whose kind (given by `decide --kind` or recorded by `classify`) is
`realization` is never inspected (decision 0058). The same warnings, from `leakage` and from
`context`, `define` and `supersede`, also name a concept's wording or a context's subject or
relation that cites a decision by its number, recounts its history (what changed, what something
used to be or no longer is), or only extends the version it replaces, keeping its wording whole
and adding to it. Its views show what stands: a decision stands until it is superseded or
deprecated, and an example file stands until the work it was written for is done, unless a
standing decision keeps it (`decide --keeps`); no retired concept, reason a concept's version was
written, decision a decision superseded or kind recorded before the governing one shows until
`design`, `state`, `decisions` or `leakage` is asked with `--history`. Its `overview` tells each
context's work in flight: the stories and tasks the ledger records as being built now. It also
holds the project's purpose, what the project is for: `purpose` records it and, with a reason,
changes it, and `overview` and `state` show it first, before any context.

`ledger` keeps the record of the project's work in `design/ledger/`: each story (one thin slice of
behaviour, with the bounded contexts it touches) and each task (one change ending in one pull
request, with the story it belongs to, if any) in flight, and how each ended, merged or dropped.
`state` tells each with what it cost: its agent runs in total and by role, the tokens its runs
reported and its elapsed time, worked out from the entries' timestamps. The runs are never recorded
by a verb: the harness's binding records a dispatch and its return from what the harness sees, through
the hidden `cratylus lifecycle` command (`appendLifecycle`), only for a dispatch whose assignment
names a story or a task; a dispatch naming a story or task not yet recorded records it in flight. It explains itself as `ledger`.

The `.` barrel is contracts and declarations: it exports `JOURNAL` and `LEDGER`, the concept
journal's and the ledger's explanations, so a consumer reads which verbs read and which append as
code.

## Subpaths

| subpath            | what it carries                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`                | the concept journal's `JOURNAL`, the ledger's `LEDGER` and its API, and the lifecycle events                                                                                                                                                                                                                                                                                                                                                              |
| `./capability`     | `CAPABILITIES`, `Capability`, `CAPABILITY_SUMMARIES` — the three capabilities the runtime ships, and a line on each                                                                                                                                                                                                                                                                                                                                       |
| `./main`           | `capabilityCommands` — one Commander command per capability, its verbs' help printed from the declarations, each routed to its verb surface                                                                                                                                                                                                                                                                                                               |
| `./runtime-config` | `loadRuntimeConfig`, `runtimeConfigPath`, `RuntimeConfig`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `./bin-name`       | `CLI_BIN` — the one home for the executable's name on PATH                                                                                                                                                                                                                                                                                                                                                                                                |
| `./ulid`           | `ulid`, `monotonicFactory`, `decodeTime`, `isValidUlid` — the one ULID                                                                                                                                                                                                                                                                                                                                                                                    |
| `./verb-flags`     | `VerbFlags`, `Verb`, `Positional`, `Flags`, `Flag`, `valueFlag`, `switchFlag`, `spelled`, `Argv`, `readArgv`, `refused`, `nearest` — each verb's purpose, positional (its name and description) and flags (whether each takes a value, its description, and whether it is required, takes one of a few values or repeats), the one reader (a flag that takes no value never takes the next token), and the one refusal of an untaken flag or surplus word |
| `./package.json`   | the manifest                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Verbs and their flags

Each verb declares, beside it, its purpose in a line, the positional it acts on (its name and a
line describing it), and the flags it takes, each with whether it takes a value and a one-line
description, and, where it applies, whether the verb refuses a call without it, the values it takes
one of, and whether it is given once per value; a flag cannot be taken undescribed, since the
declaration does not compile without it, and each capability's one-line summary is declared once
in `CAPABILITY_SUMMARIES` (`./capability`). One reader in
`./verb-flags` reads the verb's arguments against that declaration. A flag that takes a value is
given as `--flag value` or `--flag=value`, taking the next token unless it begins with `--`; a flag
that takes no value (`concepts decisions`'s `--open`) is given alone and never takes the next token,
so in `--open -x` the `-x` is read as the attempted flag it is. A verb takes at most its declared
positional: a second word where it declares one, any word where it declares none, is refused, so
no word a consumer types is silently dropped. An unknown flag is refused before the
verb acts: nothing is written, and the call exits `1`. A single-dash token (`-x`) is an attempted
flag and is refused too, as is a flag that takes no value given one (`--open=x`). One refusal,
homed in `./verb-flags`, names every such flag as given, the verb's nearest flag to each when one is
within an edit for every three letters (`--wordin` and `-wording` get `--wording`), every surplus word,
and the verb's positional and every flag it takes, and asks for the call to be corrected and run
again, or for the verb's `--help`, in one line.

## Routing

`capabilityCommands` builds one Commander command per capability, and routes
`<capability> <verb> [args]` through one table typed over `Capability`, so a capability without a
route does not compile. Each capability's verb surface owns its verbs' flag grammar: `concepts`,
`ledger` and `versionSkew` print their JSON result. A refusal exits `1` as `cratylus <message>` (the message opens
with the capability and the verb, as `cratylus concepts define: …`),
and a verb the capability does not declare is refused by `verbOf` in the one wording every dispatcher
throws when called as a library. Never a silent no-op.

`capabilityCommands` exports commands and builds no program. The program lives in
[`cratylus`](../cli/README.md), which adds them to one tree beside the projector's commands, so its
`--help` lists every command and capability there is.

## Explaining itself

Every capability explains itself: it declares, beside its verbs, its name and when to reach for it, and
for each verb the concept of cratylus's own conceptual design it acts on, when to reach for it, and
whether it `reads` or `appends`. `concepts` does: `cratylus concepts --explain` prints the concept
journal's explanation as one JSON object — `name` (`concept journal`), `purpose` (its line in
`CAPABILITY_SUMMARIES`), `when`, and `verbs` in declared order — and `cratylus concepts <verb> --explain`
prints one verb: `name`, `concept`, `purpose`, `when`, `effect`, and `parameters`, the positional
first (`positional: true`) and then each flag, each with its `description`, whether it is
`required`, and its JSON Schema (`string`, `string` with an `enum`, `boolean` for a flag that takes
no value, or an `array` of `string` for one given once per value). The explanation is read out of
the same declarations the help prints and the reader reads calls against, so it cannot say what the
verb does not take. `ledger` explains itself the same way, as `ledger`.

## The host runtime config

`loadRuntimeConfig` reads `$AGENT_RUNTIME_CONFIG`, else the installation's `runtime.json`, which
install writes into the owned root: each capability's configuration (`configuration`), as the
corpus's skills declared it. The installation (`installationRoot`) is the one
`$CRATYLUS_INSTALLATION` names — a harness's adapter names its own on every call — else the one
root under `~/.cratylus/`. A config without configuration says nothing. A capability that needs its
configuration and finds none refuses and names the command that writes it.

## Version skew

`versionSkew report` prints `{ artifacts, command, installation }`: the version recorded in the
installation's `package.json` by the cratylus that projected it, and the version of the command,
which the program holding the commands hands in (`capabilityCommands({ version })`). It chooses
between no builds.

## The bin name

`CLI_BIN` (`cratylus`) lives here because four packages speak it and three of them speak it
from inside an emitted artifact — a projected skill shim, a generated hook script — where no compiler
can see it. A rename that missed one produced a script that failed on a host rather than at build.

Flipping this one symbol really is the whole rename: `RUNTIME_CONFIG_NAME` (`.cratylus.json`) is
template-derived from it and moves without being edited. The one
irreducible second copy is [`cratylus`](../cli/README.md)'s `bin` key, which npm reads with
no compiler in the loop; their agreement is held by a test.
