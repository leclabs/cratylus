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
cratylus uninstall --harness omp     # take away what install placed
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

`cratylus install` puts the bundled corpus's agents and skills on this machine, for Claude
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

| Decision                                  | Flag                                    | Asked when                                                                       | Where nothing is asked                                   |
| ----------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Which harness                             | `--harness <claude\|omp>`               | absent, and the host does not have exactly one supported harness                 | none: refused                                            |
| Which practices                           | `--practices <name,…>` / `--all`        | neither is given, on a terminal                                                  | none: refused, whatever `--yes` says                     |
| Which model each tier and persona runs on | `--model-roles <role=model,…\|default>` | a tier the agents fall back to, or a persona's role, has no model in your config | none bound; each unbound tier is named as your next step |

On a terminal the questions come in that order, and `Install this?` follows them. The model
question asks about each tier, then each persona, that your config does not bind; leaving one
unbound is an answer.
Unless a flag settled every decision, the preview ends with that last question. Answering no, or
cancelling any question with Ctrl-C or Esc, writes nothing.

`--yes` (`-y`) takes the default of every decision not given and places without asking to go ahead.
On a terminal that is the practices already installed here, else the preselected ones; it is no
answer to the practices question where there is no terminal. `--dry-run` prints what would be placed
and stops, writing nothing, and `--verbose` also prints the per-file detail.

### Which practices

A practice is a way of working that install offers as one choice: the agents and skills that
carry it, installed together. The drift notice comes with every choice and is offered as
none. On a terminal, install asks one question that lists each practice with its
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

### Which model each tier and persona runs on

Which model runs an agent is yours to choose, and it is your harness's own setting, never
cratylus's (decision 0112). Each agent's declaration names its own model role first, then the tier
and effort its design gives it: `builder` declares `["@builder", "@frontier:medium"]`, and is never
rewritten with a model. So two kinds of role decide the model: a tier the agents fall back to
(`frontier`, `frontier-other-family`, …), and the role named for an agent, which wins over its tier
where you bind it.

On a terminal, install asks for a model for each tier, and each persona's role, that your
`~/.omp/agent/config.yml` does not bind under `modelRoles`, and writes each answer there as an
ordinary entry of yours (`frontier: "anthropic/claude-opus-5-5"`). `--model-roles` settles the
decision instead, keyed by a tier or an agent's name (`frontier=anthropic/claude-opus-5-5,builder=openai/gpt-6`);
`--model-roles default` binds nothing. Nothing install binds for you is recorded as cratylus's, so
installing again, upgrading and uninstalling all keep it, and you change it by editing your config.
A role your config already binds is never asked and never changed; a `--model-roles` entry for it is
left as you set it, and said so.

Where install is neither told nor able to ask (no terminal, or `--yes`), it places everything else
and ends by naming, as your next step, each tier the installed agents fall back to that your config
binds no model to. Until you bind it, an agent on that tier runs on the session's own model.

### What it places

Everything install places for you on a harness lives under one root it owns: `~/.cratylus/omp/` (`<home>/.cratylus/omp/` with `--home <home>`). It is an omp extension package:

```text
~/.cratylus/omp/
  agents/<name>.md          the corpus's agent declarations
  skills/<name>/…           the corpus's skills
  extensions/cratylus.ts    the extension: the capability tools, `omp --agent`, version skew
  extensions/…              the session hooks, and the dispatch isolation where an agent needs it
  hooks/<id>/…              the workers the session hooks run
  package.json              the package: the version of cratylus that installed it, and its modules
  runtime.json              each capability's configuration, where the corpus declares any
  installation.json         what install did outside the root, and the practices installed
```

omp's own surfaces only refer into it, the way `omp plugin link` does: `~/.omp/plugins/node_modules/cratylus-omp` is a link to the root, and `~/.omp/plugins/package.json` names it as a dependency (that file is created only when you had none; anything else in it is yours and stays). So every project you open in omp is offered the agents, skills and tools, and no file of omp's is copied over or overwritten. A project's own `.omp/agents`, and your `~/.omp/agent/agents`, win over a declaration of the same name.

Where you have put something of your own at either of those places — `cratylus-omp` linked elsewhere or replaced by a directory, or the dependency entry naming something other than the root — it is yours: install and upgrade leave it as you have it, record no reference there, and say so, with what to do to have omp load the root (move it away, or take the entry out, and install again). Uninstall leaves it too.

Install writes nothing else of yours, with two exceptions. The models you choose for tiers and roles go into your `~/.omp/agent/config.yml` as your own `modelRoles` entries (the section on which model each tier and persona runs on), recorded nowhere as cratylus's. And where that file hides the row an extension's status shows in (`statusLine.showHookStatus: false`) and your layout does not list omp's `status` segment, whether a session started as an agent shows its name and mark there is your choice: install asks (or takes `--agent-status show|hide`), and on `show` lists `status` in your layout (or shows the row again). Your answer is your own setting, recorded nowhere as cratylus's: no later install asks for it or applies it again, and upgrade and uninstall leave the setting as you have it. Where install is neither told nor able to ask, it changes nothing there and names the choice as a next step.

**Installing again is upgrading.** The root is replaced whole: what the new version places, exactly, and nothing an earlier one placed that it no longer does. A change you make inside the root is not kept; put your own agents and skills on omp's own surfaces instead. Installing again with the same version changes nothing.

**An earlier installation** — cratylus before the owned root placed its agents in `~/.omp/agent/agents`, its skills in `~/.agents/skills`, its extensions in `~/.omp/agent/extensions`, hook workers in `~/.omp/hooks`, `modelRoles` and a status line in `config.yml`, and `~/.cratylus.json` — is taken back by the next install, by its own record (`~/.omp/.forge/deploy-manifest.json`): each file it placed while it is still the bytes it wrote, each line it added while it stands as written, and the record last. A file or a part of `~/.cratylus.json` it placed before it recorded what it wrote is cratylus's by that record, and goes too, as does a status line layout in `config.yml` that is byte for byte the one it wrote; so no earlier agent outside the root takes the place of the root's. The `modelRoles` entries it seeded are the one exception: which model a role runs on is your setting, so they stay in your config as your own from then on, and the run names them. A file you changed since it recorded the bytes it wrote is yours, and is left and named; one it never recorded placing is never touched.

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
- `--model-roles: '<name>' is no tier or agent of this install (tiers: …; agents: …)`: an entry must
  be `<role>=<model>`, keyed by one of the tiers or agents it lists, and a model must be a name the
  harness accepts.
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
subagent's, and it carries no color. Where the host's status line hides it, `cratylus install` asks whether to show it (`--agent-status show|hide`), and shows it only on `show`. What
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
status line. On `show`, install edits `~/.omp/agent/config.yml` (`config.yaml` where that is the file omp
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
on `show` install turns that one value to `true`, changes no other byte, and says so.

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
- **No guards.** Nothing judges an agent's acts or replies: an agent's behaviour is evaluated in
  real use (decision 0142). A dispatch or launch whose assignment is incomplete is shown its typed
  assignment with a warning naming what is missing, and goes ahead.
- **Model, dispatch and tools.** On omp an agent's definition names its own model role,
  `model: "@<name>"`, and the model behind it is the host's `modelRoles` entry (next section). Its
  `spawns` is `*`: who dispatches whom is never limited. Every agent has omp's default tools.
- **An isolated agent's worktree.** An agent may declare a worktree of its own; none of the
  bundled agents does. On both harnesses the harness isolates such an agent by its own means, and
  neither cuts that isolation from the bound plan's line. Building off the line is the agent's own
  work, on either harness. On Claude Code the
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

An agent's declaration names its own model role first, then the tier and effort it holds (decision 0111): `builder` declares `model: ["@builder", "@frontier:medium"]`. omp tries them in order, so a `modelRoles.builder` you set in `~/.omp/agent/config.yml` wins; without one, the agent runs on `@frontier:medium`, which is `modelRoles.frontier` at medium effort (and with no `frontier` role either, on the session's own model). The declaration is never rewritten with a model: a model install binds for you, asked or by `--model-roles`, is a `modelRoles` entry of yours in that file (decision 0112), which upgrade and uninstall keep. A role you already bind is never asked about, and a choice for it is said to be left as you set it.

## The host runtime config

Each capability's configuration, where the corpus's skills declare any, is written into the installation as `runtime.json`. `cratylus` reads it from `$AGENT_RUNTIME_CONFIG`, else from the installation `$CRATYLUS_INSTALLATION` names (omp's extension names its own on every call), else from the one installation under `~/.cratylus/`. The `~/.cratylus.json` an earlier installation wrote is read no more, and the next install or uninstall takes its parts out.

## Version skew

The installation records the version of cratylus that installed it; the extension's tools run the `cratylus` command on your `PATH`. When you upgrade one and not the other, every omp session start warns, naming both versions, whichever is older: install again with the cratylus in use (`cratylus install --harness omp`). The comparison reads the version the installation records and the version the command answers with `cratylus --version`, so it holds for a command that predates `versionSkew` too; where the command lacks a capability the installation expects, the warning names it, that capability's tool is not offered, and every other one still is. `cratylus versionSkew report` reports both at any time, and so does the `version_skew` tool in omp, which the installation itself carries: it is offered whatever command the capabilities reach, and reports the installation's recorded version beside the command's own `--version`. The root's `installation.json` names the version that projected it too. Nothing chooses between builds: a project's own pinned cratylus is never reached by the installed tools.

omp loads the extension once per process, and every session of that process, a dispatched one included, runs it as loaded, so an install reaches only omp processes started after it. A session started in an older process says so at its start: restart omp to run the installed extension, its dispatch checks and its ledger capture included. Those know a dispatch by what it carries, the agent and task of each item, never by what the harness calls its dispatch tool.

## Taking it away again

```sh
cratylus uninstall --harness omp                 # everything install placed for you
cratylus uninstall --harness omp --dry-run       # the same report, nothing written
cratylus uninstall --harness omp --home <dir>    # another user's installation
```

`cratylus uninstall --harness omp` removes the owned root, whole, edits and additions inside it included; and every reference into it, found from where it points rather than from the root's record, so none is left dangling when you have edited or removed the root or its record: each link in `~/.omp/plugins/node_modules` that points into the root, and each dependency entry in `~/.omp/plugins/package.json` that names it (the file too where install created it and nothing else is in it). It also takes back an earlier installation by its own record, as install does. The `modelRoles` entries in your config stay, the ones install bound as you chose included, and so does your status line, shown or hidden as you answered: they are your settings, not cratylus's. Everything you placed or changed outside the root is left, your own entries on those same surfaces included, and what was left is named, with why. Your projects' journals, ledgers and files are never touched, and neither is another user's installation. Restart omp afterwards to drop what it still has loaded.

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

| Flag                      | What it does                                                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--harness <name>`        | The harness to install into (default: the one this machine has, else asked) (choices: "omp")                                                                                                                                                   |
| `--practices <names>`     | The practices to install, comma-separated (default: asked on a terminal, the ones already installed here preselected; without a terminal, required unless --all)                                                                               |
| `--all`                   | Install every practice, without asking                                                                                                                                                                                                         |
| `--model-roles <roles>`   | The model each tier the agents fall back to, or an agent's own role, runs on, as role=model comma-separated, bound in the host's own settings; or 'default' to bind none (default: each tier and persona role the host does not bind is asked) |
| `--agent-status <choice>` | Whether the status line, where your settings hide it, shows the session's agent, written as your own setting (default: asked where the status line hides it) (choices: "show", "hide")                                                         |
| `-y, --yes`               | Take the default of every decision not given, and place without asking to go ahead (the practices already installed here, else the preselected ones; not an answer where there is no terminal)                                                 |
| `--verbose`               | Also print the per-file detail of the run                                                                                                                                                                                                      |
| `--dry-run`               | Print what would be placed and stop, writing nothing                                                                                                                                                                                           |
| `--home <dir>`            | The home directory to install under: the owned root is <home>/.cratylus/<harness> (default: your home directory)                                                                                                                               |

### `cratylus uninstall`

Remove from a harness what install placed there — its owned root and every reference into it — and leave what the host placed or changed.

```sh
cratylus uninstall [options]
```

| Flag               | What it does                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `--harness <name>` | The harness to remove from (required) (choices: "omp")                      |
| `--dry-run`        | Print what would be removed and left, writing nothing                       |
| `--verbose`        | Also list every item removed                                                |
| `--home <dir>`     | The home directory the installation is under (default: your home directory) |

## Capabilities

A capability is a command whose verbs a deployed skill calls back into. `cratylus <capability> --help` lists its verbs, and `cratylus <capability> <verb> --help` what one takes. The runtime's built-in capabilities are `concepts`, `workPackage` and `versionSkew`:

```sh
cratylus concepts state
cratylus concepts supersede 'reservation expiry' --context booking --wording '…' --reason '…'
cratylus workPackage levels --cut delivery
```

### `cratylus concepts`

The concept journal. Its verbs are `overview`, `state`, `design`, `history`, `decisions`, `leakage`, `context`, `define`, `supersede`, `retire`, `decide`, `accept` and `classify`.

What the journal and each verb are for, when to reach for each, the concept each acts on, whether it reads or appends, and what each parameter means are stated once, by the runtime, and not repeated here: `cratylus concepts --help` and `cratylus concepts <verb> --help` print them, and `cratylus concepts --explain` and `cratylus concepts <verb> --explain` print the same explanation as JSON (its name `concept journal`, purpose, when and verbs; per verb its concept, purpose, when, `reads` or `appends`, and each parameter with its description, whether it is required, its JSON Schema, and `positional` for the word it acts on). The entries below name only each verb's usage and the flags it takes.

The concept journal is `design/journal` at the top of the git repository you run it in: one file per entry, named by its id, only ever appended, so two branches that both appended merge as the union of their files. The appending verbs (`context`, `define`, `supersede`, `retire`, `decide`, `accept`, `classify`) each append one entry and print it as JSON; the queries (`overview`, `state`, `design`, `history`, `decisions`, `leakage`) append nothing and print JSON, the same every time for the same journal (and, for `overview`, the same ledger). A refusal is one line on stderr, exit 1, and appends nothing.

`leakage` reports implementation leakage as warnings, `{ "warnings": [...] }`, over the live concepts' wordings, the decisions not superseded and the numbered examples in `design/examples` of the same repository; each warning names its passage (a concept by context and name, a decision by context and id, an example by file and number), the words that leak and the rule they break. A context's own words never leak: the words of its concepts' names, and each word its current subject names, though only as that plain word on its own; a command, a code span or a flag that holds the word still leaks. A decision whose kind is `realization` names what it constrains on purpose and is never inspected; one of kind `meaning`, or of no recorded kind, is (decision 0058). A decision's kind is given by `decide --kind` or recorded later by `classify`, an entry of its own that leaves the decision's record unchanged; the latest recorded governs, and a decision that already has one is classified again only with `--reason`. `decisions` and `state` report each decision's governing `kind` (`null` where none is recorded) and its `kinds`, every one recorded in order, each with the `entry` that recorded it and its `reason` where given. When what `define`, `supersede` or `decide` records leaks, it is recorded all the same and the printed entry also carries its `warnings`; the journal's entry stores none. Nothing is ever refused for leakage.

What merged branches each recorded is kept, never chosen between. A concept superseded differently on two branches is reported as competing until a later `supersede` supersedes every version; superseding a retired concept brings it back, and its history keeps the retirement. A context's subject and relation change the way a concept does: `context` with `--reason` records a new description superseding the current one, and `history --context` without a concept lists every description the context has had. A context recorded on two branches with the same subject and relation is one context; with a different one its description is competing (`subject` and `relation` are `null`, each description listed under `competingDescriptions`) until a later `context` with `--reason` settles it. A decision is its entry, reported as `entry`: two branches may each record a decision under one id, and both are kept and listed; `accept`, `classify` and `--supersedes` take a decision's id, or its entry where the id is shared.

Nothing under `design/journal` is edited, moved or deleted. In the cratylus repository its immutability gate holds this: it refuses such a change at commit and in CI, naming each path, and lets additions pass.

#### `cratylus concepts overview`

```sh
cratylus concepts overview [options]
```

| Flag                |
| ------------------- |
| `--context <value>` |

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

### `cratylus workPackage`

The work package capability. Its verbs are `inventory`, `assignment`, `levels`, `history`, `efficiency`, `state`, `frozen`, `open`, `freeze`, `integrate`, `submit`, `update`, `commit`, `check` and `record`.

As with the concept journal, what the capability and each verb are for, when to reach for each, the concept each acts on, whether it reads or appends, and what each parameter means are stated once, by the runtime: `cratylus workPackage --help` and `cratylus workPackage <verb> --help` print them, and `cratylus workPackage --explain` and `cratylus workPackage <verb> --explain` print the same explanation as JSON (its name `work package`). The entries below name only each verb's usage and the flags it takes.

Every verb but `frozen` takes `--cut <name>`, a cut identified by its name alone, across contexts: its visible examples are every `design/examples/<context>/<name>.md` in the git repository you run it in, its contexts are those contexts, and an example is referenced as `<context>/<n>`; an example's concepts are the names in the parenthesis that opens it, each a concept of its own context. A concept the cut's contexts share is given to `--concept` as `<context>/<name>`. `frozen` takes no cut: it reads every cut opened and not yet integrated.

The cut's entries are kept in its **ledger**, `design/ledger/`, tracked and versioned with the branch: one JSON file per entry, named by a ULID, created exclusively and never modified, moved or deleted (the pre-commit immutability gate holds it as it holds `design/journal/`), so a branch's entries arrive elsewhere only with its merge. Every entry carries a transition id, and an entry whose transition is already recorded is refused, with nothing written. The appending verbs (`open`, `freeze`, `integrate`, `submit`, `update`, `commit`, `check`) each append one entry; `record` appends one `efficiency` entry per context of the cut to the concept journal instead, which `cratylus concepts state` reads back as the context's `efficiency`. A cut's phase, each work package's status, the packages ready to dispatch and the cut's figures are computed from the ledger on every call (`state`, `efficiency`), never stored. Every verb prints JSON. A refusal is one line on stderr, exit 1, and appends, stages and commits nothing.

No verb records a dispatch, a return, an assayer's verdict or the lead's report: those reach the ledger only from the harness's own agent events, through the harness binding. A work package is `submitted`, then `dispatched` and `returned` as the harness reports its builder, then `approved` once at least two distinct assayers' latest verdicts on it all pass, `failing` when every one has a finding, or `disputed` when they disagree; the cut is `open`, then `in flight` from its first dispatch, then `complete` once every work package is approved. A commit whose subject opens `feat(cut:<name>): ` while the ledger does not show that cut complete gets a warning from this repository's post-commit hook, and is never refused.

The levels are computed from the packages' dependencies with `@dagrejs/graphlib`, never declared. `commit` runs `git --literal-pathspecs add -A -- <paths>` and `git --literal-pathspecs commit --only -m <message> -- <paths>`, so a path is never read as a glob. A path outside the package's outputs, or a file the paths would commit outside them (such as another package's file under a directory path), is committed with a warning naming it, as is a commit for a package no builder was dispatched for.

A cut is **frozen** from `open` until `integrate`. `cratylus workPackage frozen` is the one account of what each frozen cut freezes: its `examples` (each context's examples and held-out example text, from opening), its `checks` (exactly the paths its `freeze` entries name; a held-out check under `design/judgment/<context>/<cut>/` is frozen only once a `freeze` names it, never with the folder by implication), its `concepts` and its `architects`; and `unchecked`, its visible examples, as `<context>/<n>`, that no file under a frozen check names.

The freeze is a rule held by review and the record, never a gate (decision 0143): no hook refuses a commit or a branch update. Every concept journal entry records who appended it (`by`: `CRATYLUS_AGENT`, else git's user), and `define`, `supersede` and `retire` of a concept a frozen cut's examples name, by anyone but that cut's architect, are recorded with a warning naming the cut. Only the cut's architect integrates it, since integrating ends the freeze for good.

#### `cratylus workPackage inventory`

```sh
cratylus workPackage inventory [options]
```

| Flag            |
| --------------- |
| `--cut <value>` |

#### `cratylus workPackage assignment`

```sh
cratylus workPackage assignment [options] <package>
```

| Flag            |
| --------------- |
| `--cut <value>` |

#### `cratylus workPackage levels`

```sh
cratylus workPackage levels [options]
```

| Flag            |
| --------------- |
| `--cut <value>` |

#### `cratylus workPackage history`

```sh
cratylus workPackage history [options] <package>
```

| Flag            |
| --------------- |
| `--cut <value>` |

#### `cratylus workPackage efficiency`

```sh
cratylus workPackage efficiency [options]
```

| Flag            |
| --------------- |
| `--cut <value>` |

#### `cratylus workPackage state`

```sh
cratylus workPackage state [options]
```

| Flag            |
| --------------- |
| `--cut <value>` |

#### `cratylus workPackage frozen`

```sh
cratylus workPackage frozen [options]
```

#### `cratylus workPackage open`

```sh
cratylus workPackage open [options]
```

| Flag                  |
| --------------------- |
| `--cut <value>`       |
| `--branch <value>`    |
| `--architect <value>` |

#### `cratylus workPackage freeze`

```sh
cratylus workPackage freeze [options]
```

| Flag              |
| ----------------- |
| `--cut <value>`   |
| `--check <value>` |

#### `cratylus workPackage integrate`

```sh
cratylus workPackage integrate [options]
```

| Flag            |
| --------------- |
| `--cut <value>` |

#### `cratylus workPackage submit`

```sh
cratylus workPackage submit [options] <package>
```

| Flag                   |
| ---------------------- |
| `--cut <value>`        |
| `--output <value>`     |
| `--concept <value>`    |
| `--depends-on <value>` |
| `--needs <value>`      |

#### `cratylus workPackage update`

```sh
cratylus workPackage update [options] <package>
```

| Flag                   |
| ---------------------- |
| `--cut <value>`        |
| `--output <value>`     |
| `--concept <value>`    |
| `--depends-on <value>` |
| `--needs <value>`      |

#### `cratylus workPackage commit`

```sh
cratylus workPackage commit [options] <package>
```

| Flag                |
| ------------------- |
| `--cut <value>`     |
| `--message <value>` |
| `--path <value>`    |

#### `cratylus workPackage check`

```sh
cratylus workPackage check [options]
```

| Flag                |
| ------------------- |
| `--cut <value>`     |
| `--failure <value>` |

#### `cratylus workPackage record`

```sh
cratylus workPackage record [options]
```

| Flag            |
| --------------- |
| `--cut <value>` |

### `cratylus versionSkew`

Version skew. Its one verb is `report`, which prints `{ "artifacts", "command", "installation" }` as JSON: the version of cratylus that projected the installation (its owned root's `package.json`), the version of this `cratylus` command, and the root. The installation is the one `$CRATYLUS_INSTALLATION` names (omp's extension names its own on every call), else the one root under `~/.cratylus/`. It chooses between nothing; where the two differ, install again with the cratylus in use. In omp it is the read-only tool `version_skew`, and every session start warns when the two differ.

#### `cratylus versionSkew report`

```sh
cratylus versionSkew report [options]
```

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
