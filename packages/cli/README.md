# cratylus

The command. One package, one bin, and the only executable in
[cratylus](../../README.md) — everything it composes is an ordinary ESM library.

```sh
npm install -g cratylus
```

## What it composes

| package             | what it contributes                                          |
| ------------------- | ------------------------------------------------------------ |
| `@cratylus/forge`   | the build surface — resolve a corpus, render it, place it    |
| `@cratylus/runtime` | capability dispatch — what deployed skills call back into    |
| `@cratylus/canon`   | the default corpus, imported so it resolves wherever this is |

This is the only package permitted to know all three. `forge` projects and depends
on no corpus; `canon` is a corpus and knows no projector; a consumer wants one
install. That composition is the whole of what this package adds.

## Use

```sh
cratylus install              # put the default corpus on this machine, no project needed
cratylus init                 # write a cratylus.config.ts naming a corpus
cratylus project              # render the resolved corpus into a render tree
cratylus deploy               # place a render tree into a harness
cratylus deploy --check       # is the deployed tree still what the corpus says?
cratylus explain <filter>     # where each resolved value came from
```

Capability verbs route to the runtime and are what deployed skills invoke. Its four
capabilities — `eventTap`, `design`, `plan` and `note` — are built into it, so there
is no provider to install or declare:

```sh
cratylus eventTap status
cratylus design show
cratylus design define 'record id' --gloss '…' --author … --reason … --cause …
cratylus plan show
cratylus plan add u1 --plan p --realizes 'record id' --plan-realizes 'record id' --author … --reason … --cause …
cratylus note show
cratylus note capture 'a title' --kind … --topic … --body '…' --blocks 'u1 of plan p' --author … --reason … --cause …
```

## Install

`cratylus install` is a short guided run. It asks only what you must decide, shows what it will
place before placing anything, places it once you confirm, and ends with a few lines saying what
was done and what to do next. Per-file detail is `--verbose`'s. Given every decision up front, or
run without a terminal (stdin and stdout), it asks nothing and places without asking to go ahead.

The decisions, each with the flag that settles it (a decision given by flag is never asked):

| Decision                                 | Flag                                                     | Asked when                                                       | Default where nothing is asked                         |
| ---------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| Which harness                            | `--harness <claude\|omp>`                                | absent, and the host does not have exactly one supported harness | none: refused                                          |
| Which optional personas (`kino`, `nico`) | `--personas <name,…\|none>`                              | the corpus declares optional personas                            | the ones already installed here (none on a fresh host) |
| Whether to link their launch commands    | `--link-persona-commands` / `--no-link-persona-commands` | there is a command to place or adopt                             | none linked                                            |
| Which model each role routes to          | `--model-roles <role=model,…\|default>`                  | there are held roles the host has not routed itself              | cratylus's own routing                                 |

Every agent not declared optional is always installed, since the personas dispatch them. An
optional persona you do not choose is left out of what is placed, and one installed before and
not chosen now is removed, with its launch command. `--model-roles` given at all settles the
decision: a role it does not name keeps cratylus's routing. On omp a model is a `modelRoles`
entry in the host's config (`planner=@slow`, or a model such as `anthropic/claude-opus-5-5:high`);
on Claude Code it is the `model:` line of each agent holding the role (`planner=sonnet`). A role
you name there is yours from then on: a later install keeps it. On omp the entry install seeds for
a role you did not choose is not yours: it stays as install wrote it until you edit it, and a later
install asks that role again and moves the entry to your answer. A role the host already routed
itself is never asked and never changed, is named as the host's in the preview, and a
`--model-roles` entry for it is left as the host set it and said so.

Also: `--yes` (`-y`) takes the default of every decision not given and places without asking;
`--dry-run` prints what would be placed and stops, writing nothing; `--verbose` also prints the
per-file detail; `--plugin <package>` installs another corpus. `cratylus uninstall --harness <h>`
removes exactly what install placed.

## The host runtime config

`cratylus` reads one per-host file, `$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json`.
`cratylus deploy --harness <h>` (and `cratylus install`, which deploys) writes into it
the corpus's parts — the event vocabulary under `events` and each capability's
`configuration` — and its own harness's stanza, `harnesses.<h>.native`: that harness's
name for each event it can fire. It leaves every other harness's stanza as it found
it, so deploying for Claude and then for omp leaves both harnesses' names in the same
file:

```jsonc
{
  "events": { "vocabulary": ["session.start", "turn.end", …] },
  "harnesses": {
    "claude": { "native": { "turn.end": "Stop", … } },
    "omp": { "native": { "turn.end": "session_stop", … } },
  },
}
```

A command that needs a harness's native names asks for that harness's stanza and
refuses when it has none, naming `cratylus install --harness <h>` (works on a bare
host) and `cratylus deploy --harness <h>` (from a project). `cratylus eventTap` asks
for `claude`'s.

## Where Claude Code and omp differ

`cratylus` projects for two harnesses, Claude Code (`--harness claude`) and omp
(`--harness omp`). Each receives every shipped cell at the highest fidelity it offers, and
degrades and warns where it falls short; they are not the same, and this is what a user meets:

- **Lifecycle events.** The corpus names 31 canonical events. Claude Code realizes 19 of them
  by a native event of its own, omp 9. The rest have no native peer on that harness and are
  refused or skipped with a warning rather than faked. `eventTap install` follows the same
  rule on Claude Code: it taps the requested events that have a native peer, lists and warns
  about each one that has none as skipped, and refuses, writing nothing, when none can be
  tapped. Two more events on Claude Code and
  three on omp are acts — `operator.consult.pre` and `subagent.dispatch.pre`, plus a
  subagent's end on omp — which each harness carries on its tool event, narrowed to the one
  tool.
- **`eventTap`.** It works on Claude Code only: it attaches to Claude Code's hook settings
  (`.claude/settings.json`), and omp has no such file. Read the tap as absent on omp.
- **Persona badge and launcher.** Both harnesses have a badge and a launcher. A projected omp
  persona gets a status-line badge module and is launched as a main session by the single
  `omp-agent` launcher, since omp has no `--agent` flag. On Claude Code the persona is launched
  by `claude-agent`, and its badge is one status-line worker that reads the running persona from
  the status line's own input. See "The persona badge on the status line" below. A
  `claude --agent` main session starts with the persona's skills: Claude Code preloads an
  agent's `skills` only for a dispatched subagent, so the definition carries a `SessionStart`
  hook per skill that prints its body, and omp's launcher inlines them. Claude Code caps one
  hook's output at 10,000 characters and runs an event's hooks in parallel, so a skill over the
  cap is named under `## Required reading` by its hook instead of printed (projection and install
  warn once per such skill; install weighs against the home it installs under, since the path is
  part of the output), and the order the bodies arrive in is not guaranteed. A
  project-level `.claude/skills/<name>` that shadows the user-level copy is not consulted.
- **Enforcement scope.** A guard binds exactly the personas whose composition includes it, on
  both harnesses, and only in a composing persona's own main session, never in a subagent it
  dispatches: a subagent is bounded by what it was handed, judged by its assay and the whole
  check, and supervised by the main session. On Claude Code the hook also fires inside a
  subagent, where the payload carries `agent_id`, and each guard exits there before it judges
  and says nothing. A persona is enrolled by the presence of its stance manifest,
  `stance/manifest.json`, in its own scope. omp carries the scope in a dispatcher per persona
  (`agent/personas/<name>/`); Claude Code has no dispatcher, so `install` places the manifest
  under `.claude/personas/<name>/` and the guards find it from the `agent_type` the hook payload
  names. A bare Claude Code session and an agent that is not a projected persona are not
  enrolled and stay silent. A harness that cannot name the running agent carries a guard as a
  steer, the stated rule in place of the enforced one, and warns once per guard at projection and
  install. A guard whose judge cannot run lets the turn through and says so where the operator
  reads it, never as a clean verdict, and asks the judge again once it may have recovered: on
  omp a run of misses pauses the judge for a cooldown and the first ask after it is the probe.
  A guard judges an act against the contract of the agent that performs it. On omp a session the
  module cannot tell to be the persona's main session is not judged, and the guard says so. A
  refusal never strands the agent: every refusal names its way forward, to act on the judge's
  reason or to contest it. An agent that holds a refusal wrong writes why into the file the
  refusal names, with the one shell command it spells out, and repeats the act; a contest answers
  only a refusal that stands, from the fire that refused it until the next fire of that act, so
  a contested act goes through unjudged, the guard says so, and the contest is appended to
  `~/.agents/guardrail/contests.log` for the operator to review. A contest written before the
  refusal it would answer is discarded unheard and the act is judged as usual, as is a repeat
  without a contest. The turn end is bounded all the same: refusing it holds back no effect, it
  only makes the agent redo its turn, so the turn-end guard lets a repeated stop, or a stop it has
  refused three times in a row, through, and says so, rather than lock a session in an endless
  loop.
  A judgement fits the time its harness allows a guard, so a judge that is merely slow is never
  reported as one that could not run: the judge is handed the test in a few sentences and the act
  and the contract it applies to, and nothing else, the act an excerpt bounded by one cap, an
  oversized turn keeping its close and its operator message its tail, with the elision marked,
  and no deadline is raised to make it fit.
- **Role routing.** An agent names the role it holds, never a model. On omp the role becomes
  `model: ["@<role>", "@default"]` and the model behind it is the host's `modelRoles` entry
  (next section). Claude Code has no host-configurable roles, so a definition there names a model
  tier alias: `model: sonnet` for an implementer or integrator (spec-bounded work), `model: opus`
  for a planner, assayer or architect (work that holds, cuts or judges against the design); an agent
  holding any other role, or none, has no `model` and runs on the session's model. On omp the
  integrator routes to the built-in `@task`, as the implementer does. The host sets a role's model
  on Claude Code by the `model:` line of each agent holding it, and `install` keeps that choice:
  a model you choose at install (`--model-roles`, or picked when asked) is the host's from then on,
  whatever its value against the rendering, and so is one you edit in a deployed definition, or
  remove (a removed line stays removed); a line cratylus rendered and nobody chose follows the
  rendering, and a root installed before the record existed is covered (a `model:` line found in
  its definitions is the host's). The install output names each role left as the host set it. The
  `--verbose` install prints one
  line per held role, with its tier and the `model:` line that sets it. The host's own choice
  outranks the definition too: `--model` for a `claude --agent` main session, and for a dispatched
  subagent `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` together with `CLAUDE_CODE_SUBAGENT_MODEL=<model>`
  (`CLAUDE_CODE_SUBAGENT_MODEL` alone leaves the definition's tier standing); `install` names that
  pair as well.

## The host's model routing on omp

An omp agent definition names the role it holds and never a model:
`model: ["@architect", "@default"]` reads "route by `architect`, else by `default`". Which
model fills a role is the host's choice, and omp keeps that choice in
`~/.omp/agent/config.yml` (or `config.yaml`, read only when `config.yml` is absent) under `modelRoles`:

```yaml
modelRoles:
  default: anthropic/claude-opus-5-5:high
  task: "@default"
  architect: "@default"
```

`cratylus install --harness omp` reads the roles the installed agents hold and, for each
one `modelRoles` has no key for, adds an entry: the model you chose for it (`--model-roles
planner=@slow`, or picked when asked), else an alias of the nearest built-in omp role:
implementer and integrator to `@task`, planner to `@plan`, assayer and architect to `@default`. The
summary names the file and the roles it gained; `--verbose` prints one `<role>: "@<alias>"` line
per entry it added, or says that no entry was missing. `--dry-run` shows the same as would-edit and
writes nothing.

An entry the host already has is never changed, whether it is an alias or a concrete
model id, quoted or plain, so pointing a role at a model is done in that file and
survives every later install. The file is the host's: install inserts lines and never
re-serializes it, so its comments, key order and quoting stay as they were. It edits the
file omp reads: `config.yml`, else `config.yaml`. It creates `config.yml` only when the host has
neither, so it never shadows a `config.yaml` that holds the host's own settings, and it
appends a `modelRoles:` block when the file has none. When `modelRoles` is
a flow mapping (`{…}`), a scalar, or carries an anchor or alias, install says it did not
edit the file and still succeeds; an agent whose role has no entry then runs on the
`default` role (`modelRoles.default`). `cratylus deploy`
never touches `config.yml`.

## The persona badge on the status line

A persona's badge is its mark emoji and name, or the name alone when it has no mark, in the status
line of a session that runs it: `✈️ mav`. It shows in the top-level interactive session and never in
a subagent's, and it carries no color. `cratylus install` places the badge for each persona it
installs and then makes the host's status line show it. What that takes differs by harness, and the
host's own configuration is only ever added to.

**On Claude Code** the status line is one command, `statusLine` in `settings.json`, with no segments
to add to. Where the host has none, install sets the badge worker as that command
(`sh "$HOME/.claude/personas/_session/cratylus-status-line.sh"`) and says so. Where the host has its
own, install wraps it, with no flag: the command becomes the worker with the host's command as its
one argument, so the worker runs it and puts the badge and a space in front of the first line it
prints, and in a session that runs no persona its output reaches the status line byte for byte, so
nothing the host shows is taken away and the badge is never left off. Every other key of
`statusLine`, `padding` included, is kept, the host's original command is recorded in the deploy
manifest, install prints what it changed, and a second install changes no byte. A `statusLine` that
is not a `command` one is left as it is: Claude Code rejects such a settings file entirely and runs
no status line until it is fixed, so no badge can show there and install says so. The worker asks
the status line's input which persona runs (`agent.name`, present only under `--agent`), so a bare
`claude` session and an agent that is no installed persona show no badge, and it needs `jq`: without
it the worker prints the host's output and no badge. `claude -p` runs no status line at all.
`--dry-run` says what would be set or wrapped and writes nothing.

**On omp** an extension's status shows inside the status line only where the host's layout lists
omp's `status` segment, and omp reads a segment list (`statusLine.leftSegments`) only under
`statusLine.preset: custom`; under any other preset, the default one included, the list is ignored and
the badge renders beneath the status line. Install edits the config file omp reads (`config.yml`, else
`config.yaml`) according to the preset the host is on:

- **No preset set** (a file with no `statusLine` included): install writes `preset: custom` with the
  default preset's own left segments plus `status`, its right segments and its segment options, so the
  status line looks as it did with the badge added. If you laid out your own line there
  (`leftSegments`, `rightSegments` or `segmentOptions`), install writes nothing: omp ignores the two
  lists under the default preset and merges `segmentOptions` over that preset's own, and `custom`
  would make what you wrote the whole line, lighting up a list written for another day. It prints
  the block that keeps the line as it is with the badge added, and the way to use your own layout
  instead. Only the two lists are replaced there: your own `segmentOptions` are live under every
  preset and the advice keeps them, adding the default preset's options for any you did not set. A
  `separator` alone does not count; your setting applies under every preset.
- **`preset: custom`**: `status` is appended after the last item of your `leftSegments`, no other byte
  changing, or, where you list none, omp's custom left list plus `status` is written. A list that has
  `status` is not touched.
- **Any other named preset** (`minimal`, `compact`, `full`, `nerd`, `ascii`, or `default` written
  out): your choice stands, and the file is left byte-identical, save one value described below. `preset: custom` REPLACES that preset's
  layout with the one you list, so install prints the whole block to write: the exact lists for
  `default`, and for any other preset `leftSegments` as that preset's own segments followed by
  `status`, `rightSegments` as its own, and `showHookStatus: false`. Under `custom` the preset's
  segment options no longer apply, so your own `segmentOptions` are all there is: write that preset's
  there to keep them. Your `separator` setting applies under every preset and needs no change.

Wherever install leaves `status` in the live layout, that is, where it wrote `preset: custom` or listed
`status` in a `custom` list, it also writes `showHookStatus: false` unless you set that key. omp prints
every extension's status on a row beneath the editor by default (`statusLine.showHookStatus`), and the
`status` segment already draws every one of them inline, so leaving the row on shows the badge twice and
hides nothing. A host left on another named preset has no `status` in its layout, so that row is the
badge's only place there: install writes neither key, and keeps the row on. Where you had turned it
off (`showHookStatus: false`) on such a layout, or on a `custom` list install cannot extend, the badge
would show nowhere, so install turns that one value to `true`, changes no other byte, and says so.

A `statusLine`, `preset` or `leftSegments` that cannot be extended by inserting lines (a flow mapping,
an alias, a list split across lines in flow style) is reported and left as it is, apart from that one
value, and the install still succeeds. The `showHookStatus: false` is found as text, so it is turned on
in a flow mapping or a block alike; only a `statusLine` that is an alias to a mapping written elsewhere
keeps it out of reach, and there the badge shows nowhere until `showHookStatus` is true or `status` is
listed, which the report says. `--dry-run` writes nothing.

## Running a persona by its name

`cratylus install` can make each installed persona a command. With `--link-persona-commands` it links
`~/.local/bin/<persona>` to the harness's launcher (`~/.omp/agent/omp-agent` on omp,
`~/.claude/personas/_session/claude-agent` on Claude Code), so `planner -p 'hi'` starts a session as
the planner persona with the persona's identity as its system prompt. Every other word on the command
line is the harness's own flag.

Without a flag, a terminal install asks whether to link them, and the answer defaults to no; a piped
or scripted install links none and its summary says to pass the flag (`--verbose` lists a `would
place` line per persona). `--no-link-persona-commands` links none without asking. It says when
`~/.local/bin` is not on `PATH`. `--dry-run` places nothing either way.
The question it asks says how many commands it will link and how many it will adopt. A persona
left out on a re-install has its command unlinked again, if install placed it.

Install never overwrites. A name that is taken by a file, by another program's link, or by the other
harness's launcher is left as it is and reported as `blocked`, with what is there. A link you made by
hand to this harness's own launcher, say from the interim recipe, is adopted rather than re-created:
install records it, reports it as `adopted`, and leaves the link itself untouched. A
persona has ONE command across harnesses: whichever install links a name first owns it, the other
harness's install reports it as blocked by the first harness's launcher, and no suffixed name is made.
The links an install placed are recorded in the harness's deploy manifest
(`.forge/deploy-manifest.json`, `personaLinks`); a second install reports them as `present` and
changes nothing. `cratylus uninstall` removes them again (below).

## Taking it away again

```sh
cratylus uninstall --harness claude            # or omp
cratylus uninstall --harness claude --dry-run  # the same report, nothing written
cratylus uninstall --harness claude --verbose  # also list every item removed
```

`cratylus uninstall --harness <claude|omp>` removes from that harness what `install` placed there, and
nothing the host placed or changed. What is `install`'s is decided by the harness's deploy manifest
(`.forge/deploy-manifest.json`) and by nothing else: the manifest records a sha-256 digest of every
file it wrote, the hook commands it registered in `settings.json`, the status line it set or wrapped
(with your original command), the lines it added to omp's `config.yml` (the `modelRoles` entries and
the status line layout), and the persona commands it linked or adopted. Uninstall removes:

- every recorded file whose bytes still hash to that digest, and any directory that leaves empty;
- the hook registrations it added, and your status line back as it was — your own command, every other
  key as you had it — or no `statusLine` where you had none;
- the lines it added to `config.yml`, so the file is what you wrote, byte for byte, your own
  `modelRoles` entries included (a `config.yml` install created goes with its last line);
- the persona commands it placed or adopted, and only those;
- this harness's stanza of the runtime config (`~/.cratylus.json`, or `$AGENT_RUNTIME_CONFIG`), and the
  file itself when that was the last harness's;
- the manifest, last, so a run that stops early can be run again.

It prints a count of what it removed and, always, each thing it left because the host placed or changed
it, with its reason; `--verbose` lists every item removed too. A placed file you edited since install is left, and so is one recorded before digests were
kept (an edit cannot be ruled out), a hook registration whose entry now also runs a command of yours, a
status line you have pointed at another command, a persona command you replaced, and a file another
harness's install still records. A `config.yml` line you rewrote is left too, and only that line: every
other line install added there still comes out, one at a time, and a line of yours beneath a block
install added keeps the headers it sits under. Left files are yours from then on: the manifest goes, so
a later uninstall no longer names them. `--dry-run` runs every step and writes none. `--harness` is
required. A host with no manifest has nothing removed, and the command says so.

A host installed before install recorded its `config.yml` edits has no record of which lines are
install's. Uninstall names the file and leaves it as it is; run `install` again, which finds the
`modelRoles` entries and the status line layout there byte for byte as it would write them and records
them, and the next `uninstall` takes them out. What an older install did to the file's last line
terminator cannot be recovered that way, so the file may end one newline longer than you wrote it. A
`modelRoles:` key an older install created goes with its entries when nothing but its entries is in the
block. Anything else an older install may have done to the file, such as turning `showHookStatus` on or
adding `status` to a list of yours, is not recorded and cannot be told from your own change: uninstall
leaves it as it stands and names the file, in the left list, every time.
