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

The runtime ships exactly two capabilities, each a module of this package and each known when the
runtime is built — nothing is discovered, registered or loaded. `CAPABILITIES` (`./capability`)
names them: `concepts` and `workPackage`. A corpus's skill names one of them as
`runtime: { capability: … }`.

| capability    | verbs                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concepts`    | `overview`, `state`, `design`, `history`, `decisions`, `leakage`, `context`, `define`, `supersede`, `retire`, `decide`, `accept`, `classify`                    |
| `workPackage` | `inventory`, `assignment`, `levels`, `history`, `efficiency`, `state`, `frozen`, `open`, `freeze`, `integrate`, `submit`, `update`, `commit`, `check`, `record` |

A cut is frozen from its `open` until its `integrate`: from its `open`, its examples, its held-out
example text `design/judgment/<context>/<cut>.md` and the concepts its examples name, each in its
own context; the checks its `freeze` acts name, a held-out check in its judgment folder
`design/judgment/<context>/<cut>/` only once a `freeze` names it, never by implication; and the
files those checks' relative imports reach, transitively, that no work package of the cut outputs.
`workPackage frozen` is the one account of what is frozen, with each cut's `uses` and `unchecked`
(its visible examples no frozen check names). `concepts supersede` and `concepts retire` of a
frozen concept are refused, before anything is appended, unless the agent making the call, named
by the harness in `CRATYLUS_AGENT`, is the architect of every cut freezing it; only that architect
integrates a cut. Absent or empty, the agent is unknown, and never an architect. The hidden
`freeze-gate` command, run as git's `reference-transaction` hook, refuses a branch update that
brings in a change to what a cut freezes unless its architect makes it (`src/freeze-gate/`).

`concepts` keeps the concept journal, the one account of the design; it explains itself (see
[Explaining itself](#explaining-itself)), and its verbs are documented in
[the `cratylus` README](../cli/README.md). Its `leakage` query, and the answer of each `define`,
`supersede` and `decide`, warn of implementation leakage: text that should state meaning naming
code, files, commands, flags, identifiers, tools or libraries. Detection is lexical and only ever
warns; a context's own words, its concept names and each plain word its current subject names,
are never leakage, though a command, code span or flag holding a subject's word still is, and a decision whose kind (given by `decide --kind` or recorded by `classify`) is
`realization` is never inspected (decision 0058).

`workPackage` slices a cut into work packages: it records each package's outputs, concepts and
dependencies in an append-only log per cut under the repository's git common directory, computes the
levels of their dependency graph with `@dagrejs/graphlib`, hands out a whole level at a time, commits
a builder's paths only within its package's outputs, counts the cut's rounds, whole-check runs and
agent runs, and records those figures in the concept journal as an `efficiency` entry, which
`concepts state` reads back. It explains itself as `work package`.

The `.` barrel is contracts and declarations: it exports `JOURNAL`, the concept journal's
explanation, so a consumer reads which verbs read and which append as code.

## Subpaths

| subpath            | what it carries                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`                | the example substrate and the offline proof, and the concept journal's `JOURNAL` and the ledger API                                                                                                                                                                                                                                                                                                                                                       |
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
and `workPackage` print their JSON result. A refusal exits `1` as `cratylus <message>` (the message opens
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
verb does not take. `workPackage` explains itself the same way, as `work package`.

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

## Offline proof

A behavioral check is proven before it is frozen, and proof never runs live work: `proveOffline`
only calls the check's `judge` over recordings already made. A `BehavioralCheck` names its example's
words, its assertions with the phrases of the example each binds, and any host setting the judge
reads (`host`, each with the example's words that name it). The check is `proven`, and may be
frozen, only when the proof finds nothing:

- at least two golden recordings that differ (`goldens-not-varied`; with none, each assertion is
  also `never-seen-passing`), each getting every assertion true (`golden-rejected`);
- every negative fails exactly the one assertion it `breaks` (`negative-accepted`,
  `negative-breaks-other`), and every assertion is failed by some negative that breaks it
  (`never-seen-failing`: an assertion never seen to fail is not trusted);
- the judge returns verdicts only for the check's assertions (`undeclared`);
- every assertion binds words its example names (`unbound`), and every bound phrase occurs in the
  example, compared case-, whitespace-, punctuation- and quote-insensitively (`binds-unfixed`);
- an assertion binding `never` is a `never` assertion, and a `never` assertion binds a never-phrase
  (never, no, not, …) (`never-mismatch`);
- the judge reads nothing from the operator's host that the example does not name (`host-read`).
  A declared read is excused only when one of its bound phrases occurs in the example and names
  it: `env:NAME` by `NAME`, `file:PATH` by the path or its final segment, `process:FILE` likewise,
  `home` by "home", `clock` by a date or time word (date, time, today, now, clock, day),
  `timezone` by "time zone", `cwd` by "working directory", any other read by its name.

While a judge runs, its reads of the host are recorded, through ESM named imports as well as
namespaces: environment variables (`env:NAME`; enumerating the environment is `env`), the home
directory (`home`), files read through `node:fs` or `node:fs/promises` (`file:PATH`), child
processes started through `node:child_process` (`process:FILE`), `node:os` facts (`user`,
`hostname`, `tmpdir`, `networkInterfaces`, `cpus`, …), the working directory (`cwd`, also through
`path.resolve` of a relative path), the current time (`clock`: `Date.now`, `new Date()`,
`performance`, `process.hrtime`/`uptime`, `Intl.DateTimeFormat` formatting no date, `Temporal.Now`)
and the host time zone (`timezone`: local-time `Date` methods, `toLocale*` without a `timeZone`,
a formatter without one). Each read is charged to the proof whose judge made it, so concurrent
proofs do not charge each other, and everything is restored once no proof is judging. A judge
that throws on a recording is a finding against that recording.

A check given as an already-loaded object is observed while judging only. Give it as a loader,
`() => BehavioralCheck | Promise<BehavioralCheck>`, so what its module reads when loaded is seen
too. Reads made by the module-loading machinery itself (Node's loaders, and vite's or vitest's
module runner and transform reading sources) are not the check's and are not recorded; reads by
the check's own code, or by a library it calls, are. A reference to `process.env`, to `Date` or
to a patched function that was taken before the proof began judging is not observed; reach them
through the global or the module while judging.

`judgeBatch` judges a batch of runs against `{ atLeast, of }`: an ordinary assertion passes when it
holds in at least `atLeast` of the `of` runs, a `never` assertion only when it holds in every run.

An example's `behavioral` check (`ExampleCheck`) carries the check, its recordings, a threshold
and a runner. The architect's `confirm` and `refreeze` freeze it only when offline proof over
its recordings succeeds, never running the runner, and otherwise refuse with the findings;
`checkExample` runs the runner `of` times and passes when `judgeBatch` passes.
