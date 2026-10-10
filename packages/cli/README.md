# cratylus

The command. One package and one bin; what it composes, and why this is the only package that may
know all of it, is in [ARCHITECTURE.md](../../ARCHITECTURE.md).

```sh
npm install -g cratylus
```

It needs Node 22 or later.

## Use

```sh
cratylus install                     # the guided run: put the default corpus on this machine, no project needed
omp --agent mav                      # start a session as an installed agent, on omp
cratylus uninstall --harness claude  # take away what install placed (or omp)
```

The sections that follow are for whoever installs: the guided install, starting a session as an
agent, the badge on the status line, where Claude Code and omp differ, the host's model routing on
omp, the host runtime config, taking it away again, and what a command's exit code and streams
mean. After them comes the reference, which is the help of every command once: install and
uninstall, then the capabilities that agents and skills call, then the commands for writing a corpus
of your own.

## The guided install

```sh
cratylus install
```

`cratylus install` puts the bundled corpus's agents, skills and guards on this machine, for Claude
Code or omp. It needs no project and no config. It looks for a harness by its directory: Claude
Code's (`$CLAUDE_CONFIG_DIR` when that is set, else `~/.claude`) and omp's (`~/.omp`). Run it from a directory with no
`cratylus.config.ts`: where one is there, install uses the corpus that file names in place of the
bundled one. To install another corpus, name it in a `cratylus.config.ts`; install has no flag for
it. Where that file cannot be loaded, because a package it imports is not installed there yet (the
file `cratylus init` writes is one until you install its package) or because it does not parse,
install ends with the one line the loader gives, `cratylus install: <what is wrong>; <what to do>`,
writes nothing, and does not fall back to the bundled corpus.

The run is short. It asks only what you have not said, shows what it will place before it places
anything, places it once you confirm, and ends with a few lines saying what was done and what to do
next. Per-file detail is `--verbose`'s. Given every decision up front it asks nothing and places
without asking to go ahead; run without a terminal (stdin and stdout), it never waits on a question
and installs only the practices it is named, or every practice when told `--all`.

### The decisions

Three decisions are yours, each with the flag that settles it (a decision given by flag is never
asked):

| Decision                                | Flag                                     | Asked when                                                        | Where nothing is asked               |
| --------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| Which harness                           | `--harness <claude\|omp>`                | absent, and the host does not have exactly one supported harness  | none: refused                        |
| Which practices                         | `--practices <name,…>` / `--all`         | neither is given, on a terminal                                   | none: refused, whatever `--yes` says |
| Which model each agent's role routes to | `--model-roles <agent=model,…\|default>` | there are installed agents whose role the host has not set itself | each agent's tier and effort         |

On a terminal the questions come in that order, and `Install this?` follows them. The model
question first asks whether to choose a model per agent at all, and answering no keeps each agent's
tier and effort.
Unless a flag settled every decision, the preview ends with that last question. Answering no, or
cancelling any question with Ctrl-C or Esc, writes nothing.

`--yes` (`-y`) takes the default of every decision not given and places without asking to go ahead.
On a terminal that is the practices already installed here, else the preselected ones; it is no
answer to the practices question where there is no terminal. `--dry-run` prints what would be placed
and stops, writing nothing, and `--verbose` also prints the per-file detail.

### Which practices

A practice is a way of working that install offers as one choice: the agents, skills and guards that
carry it, installed together. The event tap and the drift notice come with every choice and are
offered as none. On a terminal, install asks one question that lists each practice with its
description, the practices already installed here ticked (on a fresh host, the one the corpus
preselects).

`--practices <name,…>` names the practices to install, as in
`--practices example-driven-workflow`, and `--all` takes every one. They are refused together, and
so is a name no practice answers to; that refusal lists the
practices the corpus declares. Without a terminal and with neither flag, `install` refuses before
writing anything and lists them too: what it installed last time is a default for a question, never
an answer to one. An empty choice is refused as well (`--practices ''`, or every practice unticked),
since none is not every; to take it all out, run `cratylus uninstall --harness <h>`.

Installing again is how you change the choice. A practice installed before and not chosen now is
removed, with what no chosen practice still carries.

### Which model each agent's role routes to

Each agent runs on a model role named for it, never on a model, and the host maps the role to a
model. Install binds each agent's role to the tier and effort its design gives it, as
`architect: "@frontier:high"`, over a role per tier that install seeds (the section on omp's model
routing). `--model-roles` settles that decision whenever it is given, keyed by the agent's name: an
agent it does not name keeps its tier and effort, and `--model-roles default` keeps them for every
agent. A model is a `modelRoles` entry in the host's config (`builder=@frontier:low`, or a model
such as `anthropic/claude-opus-5-5:high`). An agent you name is yours from then on: a later install keeps
it. The entry install seeds for an agent you did not choose is not yours: it stays as install wrote
it until you edit it, and a later install asks that agent again and moves the entry to your answer.
A role the host already set itself is never asked and never changed, is named as the host's in the
preview, and a `--model-roles` entry for it is left as the host set it and said so. The section on
omp's model routing says more.

### What it places

Install places the agent definitions and guard hooks under the harness's home (`~/.claude` or
`~/.omp`), the skills (on omp, under `~/.agents`), a few shared files under `~/.agents`, and the host
runtime config (`~/.cratylus.json`). It edits two of the host's own files, and only adds to them: on
Claude Code `~/.claude/settings.json` (the guard hooks it registers, and the status line), on omp
`~/.omp/agent/config.yml` (`modelRoles`, and the status line). It places no launcher and links no
command: a session is started as an agent by the harness itself. The run names every host file it
edits and every directory outside the harness's home that it writes to, and records all of it in the
harness's deploy manifest (`.forge/deploy-manifest.json`), which is what lets uninstall take away
exactly that.
`--home <dir>` installs for the home `<dir>` in place of yours: the harness's files go under
`<dir>/.claude` or `<dir>/.omp`, the shared files under `<dir>/.agents` and the runtime config in
`<dir>/.cratylus.json`.

On omp install also places cratylus's own extension, `~/.omp/agent/extensions/cratylus.ts`,
recorded in the manifest with the other session modules. Every omp session loads it, and at load it
offers each capability that explains itself as one tool, today the concept journal: it asks the
`cratylus` on `PATH` to explain it (`cratylus concepts --explain`) and offers the tool
`concept_journal` composed from that answer: its description, a required `verb` among the
explained verbs, and every explained parameter (where verbs declare one name with different
schemas, each schema under `anyOf`). A verb that reads asks for read approval, one that appends for
write. A call runs that `cratylus concepts <verb> …` in the session's directory, every value given
as one `--flag=value` word so a value starting with `-` arrives as written, and returns its JSON; a
refusal is the tool's error, in the command's own words. A concept or id starting with `-` cannot be
given to the command as a word of its own, so the command refuses it. The extension holds nothing
of the journal itself, so a newer `cratylus` package changes the tool in the next session without
installing again.

The same extension starts a session as any agent declaration omp discovers: `omp --agent <name>`
(or `--agent=<name>`). The name resolves through omp's own agent discovery, the declarations omp's
`task` dispatch runs: `.omp/agents/` nearest the session's directory, then `~/.omp/agent/agents/`,
then extension packages, plugins and omp's bundled agents, the first of a name winning. A declaration
is a markdown file whose front matter gives `name`, `description`, `model` (an omp model selector),
`thinking-level`, optionally `tools`, `spawns`, `autoload-skills`, `read-summarize`, `advisor` and
`prewalk`, and `mark`, a short string such as an emoji, followed by its body. The session holds the
whole declaration as omp's own `task` dispatch would give it to a child, resolved by omp's own
resolvers. It runs on the declaration's model and thinking level: its `model` selectors, a role
alias such as `@slow` expanded to the host's `modelRoles` entry, and the thinking level a selector
carries (`provider/model:high`, written in the declaration or in the role's configured value) ahead
of `thinking-level`. Every turn's system prompt carries the declaration, its name and description as
a sentence and then its body, followed by the full instructions of each skill `autoload-skills` names
that omp discovers for the session (a name it does not know is skipped, as dispatch skips it). The
session runs without omp's default personality, as a dispatched child does; with summarised reads on
or off as `read-summarize` says (unsaid, as your settings have it); with the advisor and the
pre-planning hand-off (prewalk) the declaration names, `task.agentAdvisor` and `task.agentPrewalk`
entries first, and neither when it names none, as for a child. It may dispatch only the agents
`spawns` names (`*` is any agent; with no `spawns`, any agent when its `tools` include `task` and
none otherwise, as omp reads it; an explicitly empty `spawns`, an empty list or a blank string, is
none even when its `tools` include `task`); omp refuses any other with
`Cannot spawn '<name>'. Allowed: …`. Two of these are held as the declaration says where omp's own
`task` dispatch does not hold them for a child, a known omp limitation: an explicitly empty `spawns`
with `task` in `tools`, which omp's discovery reads as `*`, and `read-summarize: true`, which omp's
dispatch does not apply (it applies only `false`). These are held as session-only overrides, never
written to your configuration, and the declaration wins over your configuration files as it does
for a child. A `--model`, `--thinking`, `--advisor`, `--prewalk`, `--no-prewalk` or
`--prewalk-into` you pass yourself wins over the declaration, each for its own part, and the rest
of the declaration is held either way. The status line shows `<mark> <name>`, or the name alone
without a mark (a bundled omp agent, such as `scout`, has no mark). The declaration is read afresh
for each new session. The tools stay yours: the extension never changes the session's tools, so
`omp --agent <name> --tools …` holds exactly what plain `omp --tools …` holds (without `task` the
session cannot dispatch at all), and a declaration's `tools` are for dispatch only. A name omp does
not discover ends startup with a non-zero exit and `cratylus: Unknown agent "<name>"`, before any
session starts. Without `--agent`, and in subagent sessions, the extension adds nothing to the
prompt, the status line or the session's settings.

Claude Code reads its settings, agents, skills and hooks from `$CLAUDE_CONFIG_DIR` when that is set
and not empty, and from `~/.claude` otherwise. Install and uninstall go where Claude Code reads: with
`CLAUDE_CONFIG_DIR` set, the Claude Code files above are placed in and removed from that directory,
and `~/.claude` is not touched; the shared files the hooks read stay in a `.agents` directory beside
it, as they sit beside `~/.claude`. Every command install writes into `settings.json` (the guard hooks,
the status line, the hook that loads a persona's skills) makes the same choice when Claude Code runs
it, so it runs what is deployed in the directory Claude Code reads. omp has no such variable and keeps
`~/.omp`. A host installed before this uninstalls as before: uninstall removes the commands its
deploy manifest recorded, as they were written.

Running it again is safe: it converges on what you choose then, and a model a role already has from
you or the host is left as it is.

### When it refuses

A refusal is one line on stderr, `cratylus install: <what went wrong>; <what to do>`, with exit code
1 and nothing written. The ones you will meet:

- `found claude and omp; name one with --harness <claude|omp>`: the host has both harnesses and
  install cannot ask (there is no terminal, or `--yes` was given). Name one.
- `no harness found (looked for <dir>, <dir>)`: neither harness has a directory here. Run
  one once, or name the one to install into with `--harness`.
- `no terminal to ask which practices to install; …`: add `--practices` with the names it lists, or
  `--all`.
- `--practices: '<name>' is no practice of this corpus (declared: …)`, and `no practice was chosen`:
  name only declared practices, and at least one.
- `--practices and --all were both given`: give one.
- `--model-roles: '<name>' is no agent this install places (agents: …)`: an entry must be
  `<agent>=<model>`, keyed by one of the agents it lists, and a model must be a name the harness
  accepts.
- `<path>/cratylus.config.ts imports '<package>', which is not installed; run …`, or
  `… does not parse`: the `cratylus.config.ts` in this directory cannot be loaded. Do what the line
  says, or run install from a directory with no config.
- `cancelled; nothing was written, so run it again to install`: you cancelled a question.

## Starting a session as an agent

An installed agent starts as the session itself through the harness's own flag:

```sh
omp --agent mav            # start the agent mav
omp --agent mav -p 'hi'    # every other word on the command line is omp's own flag
claude --agent mav         # the same on Claude Code
```

Install places no launcher and links no command for it: on omp, `--agent` is cratylus's extension
(see what install places), and it starts any declaration omp discovers, not only the installed
agents. An earlier install placed a launcher (`~/.omp/agent/omp-agent`), and per agent under
`~/.omp/agent/personas/` a `--config` overlay, a badge module and the modules of the guards composed
for that agent, and, when asked, a command per agent in `~/.local/bin` linked to the launcher.
Install now places nothing under `~/.omp/agent/personas/`. The next `cratylus install` removes
them: the files are pruned as files the deploy manifest records and this install no longer writes,
and each linked command the manifest records under `personaLinks` is unlinked while it still points
into the harness's home (one you have since pointed elsewhere is left and reported). `cratylus uninstall`
removes them too.

## The badge on the status line

An agent's badge is its mark and name, or the name alone when it has no mark, in the status line of
a session that runs it: `✈️ mav`. It shows in the top-level interactive session and never in a
subagent's, and it carries no color. `cratylus install` makes the host's status line show it. What
that takes differs by harness, and the host's own configuration is only ever added to. `--dry-run`
says what would be set and writes nothing.

**On Claude Code** install places a badge for each agent it installs. The status line is one
command, `statusLine` in `settings.json`. Where the host has none, install sets the badge worker as
that command
(`sh "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/personas/_session/cratylus-status-line.sh"`) and says so. Where the host has its
own, install wraps it: the worker runs the host's command and puts the badge and a space in front of
the first line it prints, and in a session that runs no installed agent its output reaches the status
line byte for byte, so nothing the host shows is taken away. Every other key of `statusLine`,
`padding` included, is kept, and a second install changes no byte. A `statusLine` that is not a
`command` one is left as it is, and install warns: Claude Code rejects such a settings file, so no
badge can show until it is fixed. The worker needs `jq` to know which agent runs; without it the
worker prints the host's output and no badge. `claude -p` runs no status line at all.

**On omp** the badge is the status cratylus's extension sets for a session started with
`omp --agent` (the section on starting a session as an agent), so install places no badge of its
own, and makes room for it wherever it places that extension, whether or not the corpus delivers any
agent: any session may be started as any declaration omp discovers. An extension's status shows
inside the status line only where the host's layout lists omp's `status` segment, and omp reads a
segment list (`statusLine.leftSegments`) only under `statusLine.preset: custom`. Under any other
preset, the default one included, the list is ignored and the badge renders on a row beneath the
status line. Install edits `~/.omp/agent/config.yml` (`config.yaml` where that is the file omp
reads) according to the preset the host is on:

- **No preset set** (a file with no `statusLine` included): install writes `preset: custom` with the
  default preset's own left segments plus `status`, its right segments and its segment options, so
  the status line looks as it did with the badge added. If you laid out your own line there
  (`leftSegments`, `rightSegments` or `segmentOptions`), install writes nothing: it prints the block
  that keeps the line as it is with the badge added, and the way to use your own layout instead.
- **`preset: custom`**: `status` is appended after the last item of your `leftSegments`, no other
  byte changing, or, where you list none, omp's custom left list plus `status` is written. A list
  that has `status` is not touched.
- **Any other named preset** (`minimal`, `compact`, `full`, `nerd`, `ascii`, or `default` written
  out): your choice stands and the file is left byte-identical, save for one value below. The badge
  renders beneath the status line, and install prints the whole `custom` block you would write to
  have it inline. `preset: custom` replaces that preset's layout, so the block lists that preset's
  own segments followed by `status`.

Wherever install leaves `status` in the live layout, it also writes `showHookStatus: false` unless
you set that key, because omp prints every extension's status on a row beneath the editor by default
and the `status` segment already draws it inline. Where you had turned that row off
(`showHookStatus: false`) on a layout that does not list `status`, the badge would show nowhere, so
install turns that one value to `true`, changes no other byte, and says so.

A `statusLine`, `preset` or `leftSegments` that cannot be extended by inserting lines (a flow
mapping, an alias, a list split across lines in flow style) is reported and left as it is, apart
from that one value, and the install still succeeds. Where `statusLine` is an alias to a mapping
written elsewhere, install cannot turn the row back on or list `status` there, and the report says
so; set `showHookStatus` to true or list `status` yourself to see the badge.

## Where Claude Code and omp differ

`cratylus` installs for two harnesses, Claude Code (`--harness claude`) and omp
(`--harness omp`). Each receives every shipped cell at the highest fidelity it offers, and degrades
and warns where it falls short; they are not the same, and this is what a user meets:

- **Lifecycle events.** The corpus names 31 canonical events. Claude Code realizes 19 of them by a
  native event of its own, omp 9. The rest have no native peer on that harness and are refused or
  skipped with a warning rather than faked.
- **`eventTap`.** It works on Claude Code only: it attaches to Claude Code's hook settings
  (`.claude/settings.json`), and omp has no such file. It taps the requested events that have a
  native peer, lists and warns about each one that has none as skipped, and refuses, writing
  nothing, when none can be tapped. On omp it refuses and says why.
- **Starting as an agent and the badge.** Both harnesses start a session as an agent with their own
  `--agent` flag: Claude Code natively, omp through cratylus's extension. Neither has a launcher.
  The sections on starting a session as an agent and on the badge say the rest.
- **Skills at the start of a session.** A `claude --agent` main session starts with the agent's
  skills: Claude Code preloads an agent's skills only for a dispatched subagent, so the definition
  carries a `SessionStart` hook per skill that prints its body. Claude Code caps one hook's output
  at 10,000 characters, so a skill over the cap is named under `## Required reading` by its hook
  instead of printed, and the agent loads it with the Skill tool on demand. Install warns once per
  such skill and weighs it against the home it installs under, since the path is part of the
  output. An `omp --agent` session starts with the full instructions of the skills its
  declaration's `autoload-skills` names, as a dispatched omp subagent does, and reaches the rest
  through omp's own skill discovery, as any omp session does.
- **Guards.** A guard judges an act against the contract of the agent that performs it, and only in
  the main session of an agent that composes it, never in a subagent that agent dispatches. omp
  cannot load a module for one agent alone, so there every guard composed for an agent is carried
  as a steer, and install warns that omp cannot scope it per agent. A bare `claude` or `omp` session
  is not judged, which makes starting one the off switch. A harness that
  cannot name the running agent carries a guard as a steer, the stated rule in place of the
  enforced one, and install warns once per guard. A guard whose judge cannot run lets the turn
  through and says so where you read it, never as a clean verdict. A refusal always names its way
  forward: act on the judge's reason, or, when the agent holds it wrong, write why into the file the
  refusal names with the one shell command it spells out, and repeat the act. The contested act goes
  through unjudged, the guard says so, and the contest is appended to
  `~/.agents/guardrail/contests.log` for you to review. A refused turn end is let through when it
  repeats, or after three refusals in a row, so a session is never locked in a loop. The guards'
  full rules are in [the guardrail README](../canon/targets/guardrail/README.md).
- **Model, dispatch and tools.** On omp an agent's definition names its own model role,
  `model: "@<name>"`, and the model behind it is the host's `modelRoles` entry (next section). Its
  `spawns` lists the agents it may dispatch, which are its handoffs, omp's own `scout` standing for
  the researcher, and is empty for an agent that hands off to no one. The assayer, which changes
  nothing, carries `tools` with omp's reading tools alone; every other agent has omp's default
  tools.
- **An isolated agent's worktree.** An agent may declare a worktree of its own; none of the
  bundled agents does. On both harnesses the harness isolates such an agent by its own means, and
  neither cuts that isolation from the bound plan's line. Building off the line is the agent's own
  work, on either harness, and the land gate refuses work not built off it. On Claude Code the
  agent runs in a worktree of its own, cut as Claude Code cuts any, by its `worktree.baseRef`.
  omp's agent definition has no field for isolation, so install does what omp offers: a dispatch
  of the agent is made an isolated task, which runs in an isolated copy of the dispatcher's
  checkout and never writes the main checkout. What it built is kept as the branch
  `omp/task/<id>` in your repository, not applied. The copy is cut from the dispatcher's HEAD and
  its uncommitted work, and omp takes no ref to cut it from. Where the checkout has uncommitted
  work, omp also rewrites the agent's commits onto the dispatcher's HEAD. Projection warns once
  per such agent and install prints the same in its summary.

  For this install sets `task.isolation.enabled: true`, `apply: false` and `merge: branch` in
  `config.yml` (a value you held is replaced, and uninstall puts it back). They hold for the
  isolated tasks you dispatch yourself as well: their changes are kept as a branch, not applied,
  until you change the settings.

## The host's model routing on omp

An omp agent definition names its own model role and never a model: `model: "@architect"` reads
"run on the role `architect`". Which model fills a role is the host's choice, and omp keeps that
choice in `~/.omp/agent/config.yml` (or `config.yaml`, read only when `config.yml` is absent) under
`modelRoles`:

```yaml
modelRoles:
  default: anthropic/claude-opus-5-5:high
  frontier: anthropic/claude-opus-5-5
  frontier-other-family: openai/gpt-5
  architect: "@frontier:high"
  builder: "@frontier:medium"
```

`cratylus install --harness omp` adds two kinds of entry, each only where `modelRoles` has no key
for it. Each tier the installed agents use gets a role named for it, seeded from the host's own
roles without their thinking level: `frontier` from `default`, `fast` from `smol`, and
`frontier-other-family` from the first entry, in file order, whose provider (the text before the
first `/`) differs from `frontier`'s. A tier that cannot be seeded is left out, and install says so.
Each installed agent then gets its own role: the model you chose for it
(`--model-roles builder=@frontier:low`, or picked when asked), else its tier and effort,
`<name>: "@<tier>:<effort>"`.
The summary names the file and the roles it gained; `--verbose` prints one line per entry it added,
or says that no entry was missing. `--dry-run` shows the same as would-edit and writes nothing.

An entry the host already has is never changed, whether it is an alias or a concrete model id, quoted
or plain, so pointing a role at a model is done in that file and survives every later install. The
file is the host's: install inserts lines and never re-serializes it, so its comments, key order and
quoting stay as they were. It edits the file omp reads, `config.yml` else `config.yaml`. It creates
`config.yml` only when the host has neither, so it never shadows a `config.yaml` that holds the
host's own settings, and it appends a `modelRoles:` block when the file has none. When `modelRoles`
is a flow mapping (`{…}`), a scalar, or carries an anchor or alias, install says it did not edit the
file and still succeeds. `cratylus deploy` never touches `config.yml`.

## The host runtime config

`cratylus` reads one per-host file, `$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json`. `cratylus
install` writes into it the corpus's parts, the event vocabulary and each capability's
configuration, and the stanza of the harness it installed, `harnesses.claude` or `harnesses.omp`:
that harness's name for each event it can fire. It leaves the other harness's stanza as it found it,
so installing for Claude Code and then for omp leaves both in the same file. A capability that needs
a harness's stanza and finds none refuses, and `cratylus install --harness <h>` writes it.
`cratylus eventTap` needs `claude`'s. The file is yours as much as cratylus's: a key you wrote in it,
at the top or under `events`, or a capability's configuration the corpus does not write, is carried
as you left it by every install and deploy.

A file there that is not valid JSON, or is JSON but not an object, is not rewritten: `cratylus install`
(its `--dry-run` too) and `cratylus deploy` end with one line naming the file and what is wrong with
it, exit 1 and nothing written anywhere. Repair the file or move it away, then run the command again.
`cratylus uninstall` leaves such a file byte for byte and names it among what it left. That uninstall
removes the record of what install wrote, so a second uninstall cannot take the harness's stanza out
of the repaired file: run `cratylus install --harness <h>` again, which records it, then uninstall, or
take `harnesses.<h>` out by hand.

## Taking it away again

```sh
cratylus uninstall --harness claude            # or omp
cratylus uninstall --harness claude --dry-run  # the same report, nothing written
cratylus uninstall --harness claude --verbose  # also list every item removed
```

`cratylus uninstall --harness <claude|omp>` removes from that harness what `install` placed there,
and nothing the host placed or changed. `--harness` is required. What is `install`'s is decided by
the harness's deploy manifest (`.forge/deploy-manifest.json`) and by nothing else: the manifest
records a sha-256 digest of every file it wrote, the hook commands it registered in `settings.json`,
the status line it set or wrapped (with your original command), the lines it added to omp's
`config.yml` (the `modelRoles` entries and the status line layout), a digest of each part it
wrote into the runtime config, and the persona commands an earlier install linked or adopted.
Uninstall removes:

- every recorded file whose bytes still hash to that digest, and any directory that leaves empty;
- the hook registrations it added, and your status line back as it was, your own command and every
  other key as you had it, or no `statusLine` where you had none;
- the lines it added to `config.yml`, so the file is what you wrote, byte for byte, your own
  `modelRoles` entries included (a `config.yml` install created goes with its last line);
- the persona commands an earlier install placed or adopted while they still point into the
  harness's home, and only those;
- this harness's stanza of the runtime config (`~/.cratylus.json`, or `$AGENT_RUNTIME_CONFIG`), and
  with the last installed harness's stanza the corpus's parts too, the event vocabulary and the
  configuration of each capability the corpus configured, each while it is still what install
  wrote, and the file itself only when nothing else is left in it;
- the manifest, last, so a run that stops early can be run again.

It prints a count of what it removed and each thing it left because the host placed or changed it,
with its reason; `--verbose` lists every item removed too. It ends by telling you to restart the
harness. A placed file you edited since install is left, and so is one recorded before digests were
kept (an edit cannot be ruled out), a hook registration whose entry now also runs a command of yours,
a status line you have pointed at another command, a persona command you replaced, and a file the
other harness's install still records. A part of the runtime config you changed since install (a
capability's configuration you edited, an event you added to the vocabulary) is left too, and so is
every key you placed in it, each named. A `config.yml` line you rewrote is left too, and only that
line: every other line install added there still comes out, one at a time, and a line of yours
beneath a block install added keeps the headers it sits under. Left files are yours from then on:
the manifest goes, so a later uninstall no longer names them. `--dry-run` runs every step and writes
none. A host with no manifest has nothing removed, and the command says so.

A host installed before install recorded its `config.yml` edits has no record of which lines are
install's. Uninstall names the file and leaves it as it is; run `install` again, which finds the
`modelRoles` entries and the status line layout there byte for byte as it would write them and
records them, and the next `uninstall` takes them out. What an older install did to the file's last
line terminator cannot be recovered that way, so the file may end one newline longer than you wrote
it. A `modelRoles:` key an older install created goes with its entries when nothing but its entries
is in the block. Anything else an older install may have done to the file, such as turning
`showHookStatus` on or adding `status` to a list of yours, is not recorded and cannot be told from
your own change: uninstall leaves it as it stands and names the file, in the left list, every time.

## Exit codes and streams

A command writes its result to stdout and everything that is not the result, a failure, a warning or
a hint, to stderr, one line each. It exits `0` on success and `1` on failure. A failure reads
`cratylus <command>: <what went wrong>; <what to do>`, and a usage error, an unknown command or flag
or a value outside its choices, names the word and the `--help` to read, with a nearest match when
one is close. Colour marks only the prefix of a failure or warning, and only on a terminal with
`NO_COLOR` unset. `deploy --check` exits `0` in sync, `1` on drift and `2` when it could not run,
usage errors included. A reader that closes the pipe, as `cratylus project --verbose | head -1`
does, ends the command quietly.

## Commands

Every command and every capability verb answers `--help`; this reference is that help, once.

### `cratylus install`

Install the bundled corpus into a harness on this machine, asking what you have not said.

```sh
cratylus install [options]
```

| Flag                    | What it does                                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--harness <name>`      | The harness to install into (default: the one this machine has, else asked) (choices: "claude", "omp")                                                                                         |
| `--practices <names>`   | The practices to install, comma-separated (default: asked on a terminal, the ones already installed here preselected; without a terminal, required unless --all)                               |
| `--all`                 | Install every practice, without asking                                                                                                                                                         |
| `--model-roles <roles>` | The model each role routes to, as role=model comma-separated, or 'default' (default: asked; a role the host already routes is left as it is)                                                   |
| `-y, --yes`             | Take the default of every decision not given, and place without asking to go ahead (the practices already installed here, else the preselected ones; not an answer where there is no terminal) |
| `--verbose`             | Also print the per-file detail of the run                                                                                                                                                      |
| `--dry-run`             | Print what would be placed and stop, writing nothing                                                                                                                                           |
| `--home <dir>`          | The home directory the harness's directory is under (default: your home directory)                                                                                                             |

### `cratylus uninstall`

Remove from a harness what install placed there, and leave what the host placed or changed.

```sh
cratylus uninstall [options]
```

| Flag               | What it does                                                     |
| ------------------ | ---------------------------------------------------------------- |
| `--harness <name>` | The harness to remove from (required) (choices: "claude", "omp") |
| `--dry-run`        | Print what would be removed and left, writing nothing            |
| `--verbose`        | Also list every item removed                                     |

## Capabilities

A capability is a command whose verbs a deployed skill calls back into. `cratylus <capability> --help` lists its verbs, and `cratylus <capability> <verb> --help` what one takes. The runtime's built-in capabilities are `eventTap` and `concepts`:

```sh
cratylus eventTap status
cratylus concepts state
cratylus concepts supersede 'reservation expiry' --context booking --wording '…' --reason '…'
```

### `cratylus eventTap`

Attach a passive observer to the host harness’s lifecycle events.

#### `cratylus eventTap install`

Attach the tap to lifecycle events, capturing them to a sink.

```sh
cratylus eventTap install [options]
```

| Flag                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `--events <value>`   | The lifecycle events to tap, comma-separated, from the host’s vocabulary  |
| `--sink <value>`     | The append-only file the captures are written to                          |
| `--settings <value>` | The harness settings file the tap is attached in, in place of the default |

#### `cratylus eventTap uninstall`

Detach the tap, leaving no residue.

```sh
cratylus eventTap uninstall [options]
```

| Flag                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `--settings <value>` | The harness settings file the tap is attached in, in place of the default |

#### `cratylus eventTap read`

Read back what the tap captured, in the order observed.

```sh
cratylus eventTap read [options]
```

| Flag                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `--settings <value>` | The harness settings file the tap is attached in, in place of the default |

#### `cratylus eventTap status`

Report whether the tap is attached, and to which events.

```sh
cratylus eventTap status [options]
```

| Flag                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `--settings <value>` | The harness settings file the tap is attached in, in place of the default |

### `cratylus concepts`

The concept journal. Its verbs are `state`, `design`, `history`, `decisions`, `leakage`, `context`, `define`, `supersede`, `retire`, `decide`, `accept` and `classify`.

What the journal and each verb are for, when to reach for each, the concept each acts on, whether it reads or appends, and what each parameter means are stated once, by the runtime, and not repeated here: `cratylus concepts --help` and `cratylus concepts <verb> --help` print them, and `cratylus concepts --explain` and `cratylus concepts <verb> --explain` print the same explanation as JSON (its name `concept journal`, purpose, when and verbs; per verb its concept, purpose, when, `reads` or `appends`, and each parameter with its description, whether it is required, its JSON Schema, and `positional` for the word it acts on). The entries below name only each verb's usage and the flags it takes.

The concept journal is `design/journal` at the top of the git repository you run it in: one file per entry, named by its id, only ever appended, so two branches that both appended merge as the union of their files. The appending verbs (`context`, `define`, `supersede`, `retire`, `decide`, `accept`, `classify`) each append one entry and print it as JSON; the queries (`state`, `design`, `history`, `decisions`, `leakage`) append nothing and print JSON, the same every time for the same journal. A refusal is one line on stderr, exit 1, and appends nothing.

`leakage` reports implementation leakage as warnings, `{ "warnings": [...] }`, over the live concepts' wordings, the decisions not superseded and the numbered examples in `design/examples` of the same repository; each warning names its passage (a concept by context and name, a decision by context and id, an example by file and number), the words that leak and the rule they break. A context's own words never leak: the words of its concepts' names, and the words its current subject names. A decision whose kind is `realization` names what it constrains on purpose and is never inspected; one of kind `meaning`, or of no recorded kind, is (decision 0058). A decision's kind is given by `decide --kind` or recorded later by `classify`, an entry of its own that leaves the decision's record unchanged; the latest recorded governs, and a decision that already has one is classified again only with `--reason`. `decisions` and `state` report each decision's governing `kind` (`null` where none is recorded) and its `kinds`, every one recorded in order, each with the `entry` that recorded it and its `reason` where given. When what `define`, `supersede` or `decide` records leaks, it is recorded all the same and the printed entry also carries its `warnings`; the journal's entry stores none. Nothing is ever refused for leakage.

What merged branches each recorded is kept, never chosen between. A concept superseded differently on two branches is reported as competing until a later `supersede` supersedes every version; superseding a retired concept brings it back, and its history keeps the retirement. A context's subject and relation change the way a concept does: `context` with `--reason` records a new description superseding the current one, and `history --context` without a concept lists every description the context has had. A context recorded on two branches with the same subject and relation is one context; with a different one its description is competing (`subject` and `relation` are `null`, each description listed under `competingDescriptions`) until a later `context` with `--reason` settles it. A decision is its entry, reported as `entry`: two branches may each record a decision under one id, and both are kept and listed; `accept`, `classify` and `--supersedes` take a decision's id, or its entry where the id is shared.

Nothing under `design/journal` is edited, moved or deleted. In the cratylus repository its immutability gate holds this: it refuses such a change at commit and in CI, naming each path, and lets additions pass.

#### `cratylus concepts state`

```sh
cratylus concepts state [options]
```

| Flag                |
| ------------------- |
| `--context <value>` |

#### `cratylus concepts design`

```sh
cratylus concepts design [options]
```

| Flag                |
| ------------------- |
| `--context <value>` |

#### `cratylus concepts history`

```sh
cratylus concepts history [options] [concept]
```

| Flag                |
| ------------------- |
| `--context <value>` |

#### `cratylus concepts decisions`

```sh
cratylus concepts decisions [options]
```

| Flag                |
| ------------------- |
| `--context <value>` |
| `--open`            |

#### `cratylus concepts leakage`

```sh
cratylus concepts leakage [options]
```

| Flag                |
| ------------------- |
| `--context <value>` |

#### `cratylus concepts context`

```sh
cratylus concepts context [options] <context>
```

| Flag                 |
| -------------------- |
| `--subject <value>`  |
| `--relation <value>` |
| `--reason <value>`   |

#### `cratylus concepts define`

```sh
cratylus concepts define [options] <concept>
```

| Flag                   |
| ---------------------- |
| `--context <value>`    |
| `--wording <value>`    |
| `--reason <value>`     |
| `--built-from <value>` |

#### `cratylus concepts supersede`

```sh
cratylus concepts supersede [options] <concept>
```

| Flag                   |
| ---------------------- |
| `--context <value>`    |
| `--wording <value>`    |
| `--reason <value>`     |
| `--built-from <value>` |

#### `cratylus concepts retire`

```sh
cratylus concepts retire [options] <concept>
```

| Flag                |
| ------------------- |
| `--context <value>` |
| `--reason <value>`  |

#### `cratylus concepts decide`

```sh
cratylus concepts decide [options] <id>
```

| Flag                     |
| ------------------------ |
| `--context <value>`      |
| `--title <value>`        |
| `--situation <value>`    |
| `--decision <value>`     |
| `--consequences <value>` |
| `--status <value>`       |
| `--supersedes <value>`   |
| `--kind <value>`         |

#### `cratylus concepts accept`

```sh
cratylus concepts accept [options] <id>
```

| Flag               |
| ------------------ |
| `--reason <value>` |

#### `cratylus concepts classify`

```sh
cratylus concepts classify [options] <id>
```

| Flag               |
| ------------------ |
| `--kind <value>`   |
| `--reason <value>` |

## Corpus authoring

These write and render a corpus. A consumer who only installs one needs none of them; each answers `--help` like the rest.

```sh
cratylus init                 # write a cratylus.config.ts naming a corpus
cratylus project              # render the resolved corpus into .cratylus/<harness>
cratylus deploy               # place a render tree into a harness
cratylus deploy --check       # is the deployed tree still what the corpus says?
cratylus explain <filter>     # where each resolved value came from
```

`optimize` stands beside the pipeline: it checks the accept laws on a plan an agent wrote (`REC ≽`,
`minimal`, `conform`), writes the artifacts that pass, and records the routing manifest. It is opt-in,
and refuses without `--plan`.

### `cratylus init`

Create cratylus.config.ts, extending a plugin package.

```sh
cratylus init [options]
```

| Flag             | What it does                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `--plugin <pkg>` | The plugin package the new config extends (default: "@cratylus/canon") |

### `cratylus add`

Add a plugin package to the extends list of cratylus.config.ts.

```sh
cratylus add [options] <plugin>
```

| Argument | What it is                |
| -------- | ------------------------- |
| `plugin` | The plugin package to add |

### `cratylus compose`

Print the fragments your config resolves to, one per line.

```sh
cratylus compose [options]
```

| Flag              | What it does                                                                   |
| ----------------- | ------------------------------------------------------------------------------ |
| `--config <path>` | The config file to load (default: cratylus.config.ts in the current directory) |

### `cratylus project`

Render the plugins your config extends into a tree of harness files.

```sh
cratylus project [options]
```

| Flag               | What it does                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `--config <path>`  | The config file to load (default: cratylus.config.ts in the current directory)                |
| `--out <dir>`      | The directory to render into (default: .cratylus/<harness>, the tree `cratylus deploy` reads) |
| `--harness <name>` | The harness to render for (choices: "claude", "omp", default: "claude")                       |
| `--verbose`        | Also print one line per file rendered or pruned                                               |

### `cratylus optimize`

Check a rewrite plan for a source you wrote, and write the artifacts and routing manifest it passes.

```sh
cratylus optimize [options] <source>
```

| Argument | What it is                                     |
| -------- | ---------------------------------------------- |
| `source` | The source file or directory the plan rewrites |

| Flag                | What it does                                                                          |
| ------------------- | ------------------------------------------------------------------------------------- |
| `--plan <file>`     | The JSON plan: its register, concepts and artifacts, which an agent writes (required) |
| `--out <dir>`       | The directory the artifacts are written to (default: "optimized")                     |
| `--manifest <path>` | Where the routing manifest is written (default: .manifests/<source>.json)             |
| `--prior <path>`    | A manifest accepted earlier; artifacts whose digests match it are reused              |
| `--verbose`         | Also list every file written                                                          |

### `cratylus deploy`

Place a rendered tree's agents, skills and hooks into a harness.

```sh
cratylus deploy [options]
```

| Flag                 | What it does                                                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--from <dir>`       | The render tree to deploy (default: .cratylus/<harness>, what `cratylus project` writes)                                                                                                                                                                                           |
| `--agents-dir <dir>` | The agents directory, where it is not agents/ in the render tree                                                                                                                                                                                                                   |
| `--skills-dir <dir>` | The skills directory, where it is not skills/ in the render tree                                                                                                                                                                                                                   |
| `--hooks-dir <dir>`  | The hooks root, where it is not the render tree itself                                                                                                                                                                                                                             |
| `--assets <decls>`   | Files to ship with a skill, as <skill>=<file>[,…]; one that is absent is a warning                                                                                                                                                                                                 |
| `--kind <kind>`      | What to place (choices: "agent", "skill", "hooks", "all", default: "all")                                                                                                                                                                                                          |
| `--scope <scope>`    | Where to place it: your home, or a project (choices: "user", "project", default: "user")                                                                                                                                                                                           |
| `--harness <name>`   | The harness to place into (choices: "claude", "omp", default: "claude")                                                                                                                                                                                                            |
| `--home <dir>`       | The directory the harness's home is under, for --scope user (default: your home directory)                                                                                                                                                                                         |
| `--project <dir>`    | The project root, for --scope project (default: the current directory)                                                                                                                                                                                                             |
| `--config <path>`    | The config file the corpus's lifecycle events are read from (default: cratylus.config.ts in the project root)                                                                                                                                                                      |
| `--only <names>`     | Place only these names, comma-separated                                                                                                                                                                                                                                            |
| `--dry-run`          | Print the actions and change nothing                                                                                                                                                                                                                                               |
| `--verbose`          | Also print the per-file detail of the run                                                                                                                                                                                                                                          |
| `--check`            | Report where the deployed tree differs from the rendered one (stale, absent or foreign), changing nothing; exits 0 in sync, 1 on drift, 2 when the check could not run; it reads no config and writes nothing to narrate, so --config, --verbose and --dry-run are refused with it |

### `cratylus explain`

Show where each resolved fragment got its value.

```sh
cratylus explain [options] [agent]
```

| Argument | What it is                                                    |
| -------- | ------------------------------------------------------------- |
| `agent`  | Only the fragments whose id contains this text, ignoring case |

| Flag              | What it does                                                                   |
| ----------------- | ------------------------------------------------------------------------------ |
| `--config <path>` | The config file to load (default: cratylus.config.ts in the current directory) |
| `--json`          | Print the machine-readable report instead of text                              |

### `cratylus catalog`

List the fragment ids your plugins let you extend, or count what the corpus holds.

```sh
cratylus catalog [options] [agent]
```

| Argument | What it is                                                    |
| -------- | ------------------------------------------------------------- |
| `agent`  | Only the fragments whose id contains this text, ignoring case |

| Flag              | What it does                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `--config <path>` | The config file to load (default: cratylus.config.ts in the current directory)                                |
| `--corpus <dir>`  | Count the fragments of each dimension in this corpus instead (default with no config: canon's src/dimensions) |
| `--json`          | Print the machine-readable report instead of a table                                                          |
