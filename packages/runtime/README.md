# @cratylus/runtime

The **mechanism** concern of [cratylus](../../README.md) — the per-host runtime contract leaf.

A skill has two faces: what it _means_, which is canon's, and the programmatic thing it routes to,
which is this package's. `runtime` is the generic platform beneath that second face, plus the
model check, which holds the domain model to its acceptance tests.

It **depends on nothing** in this system — zero `@cratylus/*` dependencies — and knows no agent harness and
no canon. It ships with the agent and runs on the host; anything canon-specific reaches it as
configuration the projection emitted.

The commands a consumer
types, with their flags, are [the `cratylus` README](../cli/README.md)'s; this README is for whoever
works on the canon whose skills route here, and for a library user of the package.

## Capabilities

The runtime ships exactly two capabilities, each a module of this package and each known when the
runtime is built — nothing is discovered, registered or loaded. `CAPABILITIES` (`./capability`)
names them: `model` and `versionSkew`. A canon's skill names one of them as
`runtime: { capability: … }`.

| capability    | verbs    |
| ------------- | -------- |
| `model`       | `check`  |
| `versionSkew` | `report` |

`model` is the model check; it explains itself (see [Explaining itself](#explaining-itself)) as
`model check`, and the [`cratylus` README](../cli/README.md) gives the layout it reads and the
report it prints. The domain model is plain files in `design/model` at the top of the git
repository: `purpose.md`, then a directory per bounded context holding its `context.md` and one
file per concept, its Cratylic name, its precising definition and its examples, each written as
given–when–then. Version control is its history, so the files state only what holds now. `check`
reads the model and every test file of the repository, and fails for a record that is not in its
form, for an example no acceptance test names (unless it is marked judged in review), and for an
acceptance test naming an example the model does not have; an acceptance test, in the project's
own test framework, names its example by its title, `<context>/<concept>: <example name>`. It
records nothing; its result is the same every time for the same files.

The `.` barrel is contracts and declarations: it exports `MODEL_CHECK` and `VERSION_SKEW`, each
capability's interface, and `explain`, so a consumer reads what each verb does as code, beside
the command's own self-description (`EXPLANATION`, `ORIENTATION`, `PURPOSE`, `START`, `THEORY`,
`CommandExplanation`).

## Subpaths

| subpath            | what it carries                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.`                | `MODEL_CHECK`, `VERSION_SKEW`, `explain`, and the command's self-description: `EXPLANATION`, `ORIENTATION`, `PURPOSE`, `START`, `THEORY`, `CommandExplanation` |
| `./capability`     | `CAPABILITIES`, `Capability`, `CAPABILITY_SUMMARIES` — the two capabilities the runtime ships, and a line on each                                              |
| `./main`           | `capabilityCommands` — one Commander command per capability, its verbs' help printed from the declarations, each routed to its verb surface                    |
| `./runtime-config` | `loadRuntimeConfig`, `runtimeConfigPath`, `RuntimeConfig`                                                                                                      |
| `./bin-name`       | `CLI_BIN` — the one home for the executable's name on PATH                                                                                                     |
| `./package.json`   | the manifest                                                                                                                                                   |

## Verbs

Each verb declares, beside it, its purpose in a line, and each capability's one-line summary is
declared once in `CAPABILITY_SUMMARIES` (`./capability`). A verb takes no arguments: it is called by
its name alone, and any token after it is refused before the verb acts, in one line naming each
such token and the verb's `--help`, exiting `1`, so no word a consumer types is silently dropped.

## Routing

`capabilityCommands` builds one Commander command per capability, and routes
`<capability> <verb>` through one table typed over `Capability`, so a capability without a
route does not compile. `model`
and `versionSkew` print their JSON result. A refusal exits `1` as `cratylus <message>` (the message opens
with the capability and the verb, as `cratylus model check: …`),
and a verb the capability does not declare, or any token after the verb, is refused by `verbOf` in
the one wording every dispatcher throws when called as a library. Never a silent no-op.

`capabilityCommands` exports commands and builds no program. The program lives in
[`cratylus`](../cli/README.md), which adds them to one tree beside the projector's commands, so its
`--help` lists every command and capability there is.

## Explaining itself

Every capability explains itself: it declares, beside its verbs, its name and when to reach for it, and
for each verb the concept of cratylus's own domain model it acts on, when to reach for it, and its
effect; both verbs there are, `check` and `report`, only read. `cratylus model --explain` prints the
model check's explanation as one JSON object — `name` (`model check`), `purpose` (its line in
`CAPABILITY_SUMMARIES`), `when`, and `verbs` in declared order — and `cratylus model check --explain`
prints one verb: `name`, `concept`, `purpose`, `when` and `effect`. The explanation is read out of
the same declarations the help prints, so the two cannot drift apart. The explanation's name is the
tool's: in omp the model check is `model_check`
and version skew `version_skew`.

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
