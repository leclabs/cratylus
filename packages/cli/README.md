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
  three on omp are acts — `operator.consult.pre` and `subagent.dispatch.pre`, plus
  `subagent.end` on omp — which each harness carries on its tool event, narrowed to the one
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
  both harnesses, and a persona is enrolled by the presence of its stance manifest,
  `stance/manifest.json`, in its own scope. omp carries the scope in a dispatcher per persona
  (`agent/personas/<name>/`); Claude Code has no dispatcher, so `install` places the manifest
  under `.claude/personas/<name>/` and the guards find it from the `agent_type` the hook payload
  names. A bare Claude Code session and an agent that is not a projected persona are not
  enrolled and stay silent. A harness that cannot name the running agent carries a guard as a
  steer and warns once per guard at projection and install.
- **Role routing.** An agent names the role it holds, never a model. On omp the role becomes
  `model: ["@<role>", "@default"]` and the model behind it is the host's `modelRoles` entry
  (next section). Claude Code has no host-configurable roles, so a definition there names a model
  tier alias: `model: sonnet` for an implementer or integrator (spec-bounded work), `model: opus`
  for a planner, assayer or architect (work that holds, cuts or judges against the design); an agent
  holding any other role, or none, has no `model` and runs on the session's model. On omp the
  integrator routes to the built-in `@task`, as the implementer does. The host sets a role's model
  on Claude Code by the `model:` line of each agent holding it, and `install` keeps that choice:
  a deployed definition whose `model:` line is not the one the last install wrote (edited, or
  removed) keeps the host's line in the definition placed over it (a root installed before the
  record existed is covered: a `model:` line found in its definitions is the host's), every other
  line is replaced as before, and the install output names each agent whose model it kept. The first install prints one
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
one `modelRoles` has no key for, adds an entry aliasing the nearest built-in omp role:
implementer and integrator to `@task`, planner to `@plan`, assayer and architect to `@default`. It
prints one `<role>: "@<alias>"` line per entry it added, with the file's path, or says
that no entry was missing. `--dry-run` prints the same entries as would-add and writes
nothing.

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
  out): your choice stands. The file is left byte-identical. `preset: custom` REPLACES that preset's
  layout with the one you list, so install prints the whole block to write: the exact lists for
  `default`, and for any other preset `leftSegments` as that preset's own segments followed by
  `status`, `rightSegments` as its own, and `showHookStatus: false`. Under `custom` the preset's
  segment options no longer apply, so your own `segmentOptions` are all there is: write that preset's
  there to keep them. Your `separator` setting applies under every preset and needs no change.

Wherever install leaves `status` in the live layout, that is, where it wrote `preset: custom` or listed
`status` in a `custom` list, it also writes `showHookStatus: false` unless you set that key. omp prints
every extension's status on a row beneath the editor by default (`statusLine.showHookStatus`), and the
`status` segment already draws every one of them inline, so leaving the row on shows the badge twice and
hides nothing. A host left on another named preset has no `status` in its layout and keeps that row, so
install writes neither there.

A `statusLine`, `preset` or `leftSegments` that cannot be extended by inserting lines (a flow mapping,
an alias, a list split across lines in flow style) is reported and left as it is, and the install still
succeeds. `--dry-run` writes nothing.

## Running a persona by its name

`cratylus install` can make each installed persona a command. With `--link-persona-commands` it links
`~/.local/bin/<persona>` to the harness's launcher (`~/.omp/agent/omp-agent` on omp,
`~/.claude/personas/_session/claude-agent` on Claude Code), so `planner -p 'hi'` starts a session as
the planner persona with the persona's identity as its system prompt. Every other word on the command
line is the harness's own flag.

Without the flag, install prints one `would place` line per persona and how to add them. On a terminal
it asks first, and answers no by default; a piped or scripted install places none. It says when
`~/.local/bin` is not on `PATH`. `--dry-run` places nothing either way.
The question it asks says how many commands it will link and how many it will adopt.

Install never overwrites. A name that is taken by a file, by another program's link, or by the other
harness's launcher is left as it is and reported as `blocked`, with what is there. A link you made by
hand to this harness's own launcher, say from the interim recipe, is adopted rather than re-created:
install records it, reports it as `adopted`, and leaves the link itself untouched. A
persona has ONE command across harnesses: whichever install links a name first owns it, the other
harness's install reports it as blocked by the first harness's launcher, and no suffixed name is made.
The links an install placed are recorded in the harness's deploy manifest
(`.forge/deploy-manifest.json`, `personaLinks`); a second install reports them as `present` and
changes nothing. There is no `cratylus uninstall` yet, so a host that wants them gone removes the
links by hand.
