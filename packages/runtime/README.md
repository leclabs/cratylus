# @cratylus/runtime

The **mechanism** concern of [cratylus](../../README.md) — the per-host runtime contract leaf.

A skill has two faces: what it _means_, which is canon's, and the programmatic thing it routes to,
which is this package's. `runtime` is the generic platform beneath that second face, plus the
record (the concept journal) an agent reconstitutes from.

It **depends on nothing** in this system — zero `@cratylus/*` dependencies — and knows no agent harness and
no canon. It ships with the agent and runs on the host; anything canon-specific reaches it as
configuration the projection emitted.

The commands a consumer
types, with their flags, are [the `cratylus` README](../cli/README.md)'s; this README is for whoever
works on the canon whose skills route here, and for a library user of the package.

## Capabilities

The runtime ships exactly two capabilities, each a module of this package and each known when the
runtime is built — nothing is discovered, registered or loaded. `CAPABILITIES` (`./capability`)
names them: `concepts` and `versionSkew`. A canon's skill names one of them as
`runtime: { capability: … }`.

| capability    | verbs                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concepts`    | `state`, `design`, `history`, `decisions`, `leakage`, `purpose`, `context`, `define`, `supersede`, `retire`, `decide`, `accept`, `deprecate`, `close` |
| `versionSkew` | `report`                                                                                                                                              |

Every journal entry records who appended it (`by`: the agent making the call, named by the agent
harness in `CRATYLUS_AGENT`, else git's user). Version history is held by code review, as each change's risk calls
for, never by refusal (decision 0274): the journal's verbs only append, but for `close`, which
closes its books as event sourcing does (decision 0316): it opens a new period with one entry per
current version of each standing item, of the item's own kind, superseding nothing and carrying
`broughtForward`, the commit at HEAD holding the closed period, then removes every other entry
file, which version control keeps at that commit. Every reading covers the journal since its
latest close; the closed period is read from git at that commit.

`concepts` keeps the concept journal, the one account of the design; it explains itself (see
[Explaining itself](#explaining-itself)), and its verbs are documented in
[the `cratylus` README](../cli/README.md). A session's start reads the design: `design` recovers each
context's subject, relation and live concepts with the concepts each is built from, the practice
place first (each delivered context in the delivered order, upstream first, or the project's own copy
of it in its place), and `state` is its short summary: the project's purpose, then each context's live
concepts, each one line `term ≜ correction`, with any competing versions. The journal's record runs
from its latest closing of the books: every reading reads the openings as it reads any entries,
so the design and each standing decision's meaning and status read the same after a close as
before it; each decision's `entry` is renewed as its opening's id, and the cut or example files
(`keeps`) a legacy decision's entry recorded stay in the closed period. The history readings carry
`booksClosed`, naming the close and the commit holding the period before it, and mark each opening
they list `broughtForward`. The
standing decisions, each a choice of realization, are read apart with `decisions`; `decide`
records every new one as realization and takes no kind. Its `leakage` query, and the answer of
each `context`, `define` and `supersede`, warn of implementation leakage: a concept's correction or
an example naming code, files, commands, flags, identifiers, tools or libraries instead of what
must hold. Detection is lexical and only ever warns, and never inspects a decision; a context's
own words, its concept names and each plain word its current subject names, are never leakage,
though a command, code span or flag holding a subject's word still is. The same warnings also
name a concept's correction or a context's subject or relation that cites a decision by its number,
recounts its history (what changed, what something used to be or no longer is), or only extends
the version it replaces, keeping its wording whole and adding to it. Its views read only the
journal and the example files, and show what stands: a decision stands until it is superseded or
deprecated, and every example file present is current; no retired concept, reason a concept's
version was written, decision a decision superseded or kind recorded before the governing one
shows until `design` or `decisions` is asked with `--history`, and a context's history carries
the effort recorded for its past work. It also holds the project's purpose, what the project is
for: `purpose` records it and, with a reason, changes it, and `state` shows it first, before any
context. `retire` without a concept retires a bounded context of the project's own with its
reason: no reading of the design shows it or its concepts, its decisions show only with
`--history`, its own history lists the retirement, nothing is recorded into it until `context`
with a reason brings it back as it stood, and a delivered context it held the place of shows
again. A retirement recorded on one line of work beside a description on another competes with
it, listed among the context's competing descriptions as retired with its reason, until a later
description or retirement settles them; closing the books carries nothing of a retired context,
and opens a competing retirement beside the description it competes with.

A concept is renamed by a version of its own kind (decision 0322): `supersede --rename` appends a
`rename` entry, a supersession whose `name` is the new one and whose `was` is the name it renames.
A concept is the versions of one context joined by supersession or a shared name, whatever order
they were recorded in, so it stays one through its names: `state` and `design` show it under its
current name only, `design` shows each built-from reference by the current name of the concept it
names, and `history` by its current name or any earlier one lists every version with the name it
was recorded under. A name stays its concept's for the journal's period, and a close opens a
renamed concept as a `define` under its current name, built-from references written by current
names; a close is refused while a concept's competing versions name it differently.

A bounded context is renamed the same way: `context --reason --rename` appends a `rename-context`
entry, a description whose `name` is the new one and whose `was` is the name it renames. A context
is its descriptions and retirements joined by supersession or a shared name, whatever order they
were recorded in, so it stays one through its names, its identity unchanged: every reading shows
it, its concepts and its decisions under its current name only, every verb naming a context takes
its current name or any earlier one, and its own `history` lists every description with the name it
was recorded under. A name stays its context's for the journal's period. A delivered context is
matched by identity, so a project's own copy keeps its place whatever either is called, and
`deliverContext` projects a context, named by any of its names, under its current name. A close
opens a renamed context as a `context` under its current name with its identity, and is refused
while a context's competing descriptions name it differently.

The `.` barrel is contracts and declarations: it exports `JOURNAL`, the concept journal's
explanation, so a consumer reads which verbs read, which append and which close as code.

## Subpaths

| subpath            | what it carries                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`                | the concept journal's `JOURNAL`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `./capability`     | `CAPABILITIES`, `Capability`, `CAPABILITY_SUMMARIES` — the two capabilities the runtime ships, and a line on each                                                                                                                                                                                                                                                                                                                                         |
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
route does not compile. Each capability's verb surface owns its verbs' flag grammar: `concepts`
and `versionSkew` print their JSON result. A refusal exits `1` as `cratylus <message>` (the message opens
with the capability and the verb, as `cratylus concepts define: …`),
and a verb the capability does not declare is refused by `verbOf` in the one wording every dispatcher
throws when called as a library. Never a silent no-op.

`capabilityCommands` exports commands and builds no program. The program lives in
[`cratylus`](../cli/README.md), which adds them to one tree beside the projector's commands, so its
`--help` lists every command and capability there is.

## Explaining itself

Every capability explains itself: it declares, beside its verbs, its name and when to reach for it, and
for each verb the concept of cratylus's own conceptual model it acts on, when to reach for it, and
whether it `reads`, `appends` or `closes`. `concepts` does: `cratylus concepts --explain` prints the concept
journal's explanation as one JSON object — `name` (`concept journal`), `purpose` (its line in
`CAPABILITY_SUMMARIES`), `when`, and `verbs` in declared order — and `cratylus concepts <verb> --explain`
prints one verb: `name`, `concept`, `purpose`, `when`, `effect`, and `parameters`, the positional
first (`positional: true`) and then each flag, each with its `description`, whether it is
`required`, and its JSON Schema (`string`, `string` with an `enum`, `boolean` for a flag that takes
no value, or an `array` of `string` for one given once per value). The explanation is read out of
the same declarations the help prints and the reader reads calls against, so it cannot say what the
verb does not take.

## The host runtime config

`loadRuntimeConfig` reads `$AGENT_RUNTIME_CONFIG`, else the installation's `runtime.json`, which
install writes into the owned root: each capability's configuration (`configuration`), as the
canon's skills declared it. The installation (`installationRoot`) is the one
`$CRATYLUS_INSTALLATION` names — an agent harness's adapter names its own on every call — else,
walking up from the working directory, the nearest ancestor other than the home whose `.cratylus/`
holds exactly one installation whose `installation.json` says `"scope": "project"`, else the one
root under `~/.cratylus/`. A tree without `installation.json`, an earlier render tree, is no
installation. A config without configuration says nothing. A capability that needs its
configuration and finds none refuses and names the command that writes it.

`installationScope` reads an installation's scope, `user` or `project`, from its
`installation.json`; a record that says none, or no record, is the user's.

## Version skew

`versionSkew report` prints `{ artifacts, command, scope, installation }`: the version recorded in
the installation's `package.json` by the cratylus that projected it, the version of the command,
which the program holding the commands hands in (`capabilityCommands({ version })`), and the
installation's scope and root. It chooses between no builds.

## The bin name

`CLI_BIN` (`cratylus`) lives here because four packages speak it and three of them speak it
from inside an emitted artifact — a projected skill shim, a generated hook script — where no compiler
can see it. A rename that missed one produced a script that failed on a host rather than at build.

Flipping this one symbol really is the whole rename: `RUNTIME_CONFIG_NAME` (`.cratylus.json`) is
template-derived from it and moves without being edited. The one
irreducible second copy is [`cratylus`](../cli/README.md)'s `bin` key, which npm reads with
no compiler in the loop; their agreement is held by a test.
