# cratylus

The command. One package and one bin, and the only package that may know all of the others.

```sh
npm install -g cratylus
```

It needs Node 22 or later.

## Use

```sh
cratylus install                     # the guided run: put the default corpus on this machine, no project needed
cratylus install --scope project     # the same for the project you are in, to commit and share with its team
omp --agent architect                # start here: the architect
cratylus uninstall --harness omp     # take away what install placed
```

`cratylus` with no arguments prints how to start: what the command is for, how using it starts and
where its theory is, a line each, then a line naming `cratylus --help` for everything else, on
stdout, exit `0`. A completed install where the architect is installed ends with the start line the
command prints. `cratylus --explain` prints the same as JSON, `{"name", "purpose", "orientation"}`:
the cratylus extension shows that `orientation` in every omp session, as the command says it.
`cratylus --explain` takes no other word. `cratylus --help` opens with what it is for.

The sections that follow are for whoever installs: the guided install and its two scopes, starting a
session as an agent, the badge on the status line, the host's model routing on omp, the host runtime
config, version skew, taking it away again, and what a command's exit code and streams mean. After
them comes the reference, which is the help of every command once: install and uninstall, then the
capabilities that agents and skills call, then the commands for writing a corpus of your own.

## The guided install

```sh
cratylus install
```

`cratylus install` puts the bundled corpus's agents and skills into omp, for you or for one project
(the scope, below). It needs no config. It looks for omp by its directory (`~/.omp`). Run it from a
directory with no
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

Five decisions are yours, each with the flag that settles it (a decision given by flag is never
asked):

| Decision                                  | Flag                                    | Asked when                                                                                      | Where nothing is asked                                   |
| ----------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Which agent harness                       | `--harness omp`                         | absent, and the host has no omp directory                                                       | none: refused                                            |
| Which scope                               | `--scope <user\|project>`               | absent, on a terminal, where the project here is not your home                                  | user                                                     |
| Which practices                           | `--practices <name,…>` / `--all`        | neither is given, on a terminal                                                                 | none: refused, whatever `--yes` says                     |
| Which rules                               | `--rules <name,…\|none>`                | absent, and no install here recorded a choice, on a terminal                                    | the choice the last install recorded, else none          |
| Which model each tier and persona runs on | `--model-roles <role=model,…\|default>` | at user scope, a tier the agents fall back to, or a persona's role, has no model in your config | none bound; each unbound tier is named as your next step |

On a terminal the questions come in that order, and `Install this?` follows them. The model
question asks about each tier, then each persona, that your config does not bind; leaving one
unbound is an answer. A project installation asks neither the model question nor the status line one.
Unless a flag settled every decision, the preview ends with that last question. Answering no, or
cancelling any question with Ctrl-C or Esc, writes nothing.

`--yes` (`-y`) takes the default of every decision not given and places without asking to go ahead.
On a terminal that is the practices already installed here, else the preselected ones; it is no
answer to the practices question where there is no terminal. `--dry-run` prints what would be placed
and stops, writing nothing, and `--verbose` also prints the per-file detail.

### Which scope

A user installation is yours: its root is under your home, and omp loads it in every project you
open. A project installation belongs to one project: its root is in the project, omp loads it in
that project only, and there it loads it in place of the user installation, which is not loaded at
all (both are the package `cratylus-omp`, and omp lets a project's package shadow the user's of the
same name). `--scope user|project` chooses, and user is the default: on a terminal install asks,
user preselected, wherever the project here is not your home; under `--yes` or with no terminal it
takes user.

The project is the directory omp anchors a project's plugins at, found from the working directory:
the nearest directory above it holding `.omp/`, your home's excepted, else the nearest holding
`.git`, else the working directory itself. Project scope is refused where that is your home.

To share a project installation, commit `.cratylus/omp` and `.omp/`: every reference into the root
is relative, so a clone anywhere resolves it, and every teammate's omp loads it in that project.
Upgrade it and uninstall it from inside the project with `--scope project`.

Each scope leaves the other alone. A project install, upgrade or uninstall writes nothing under your
home, and an earlier installation under your home is left for a user install to take back. A user
install, upgrade or uninstall leaves every project installation as it is, and a project one leaves
the user installation and every other project's.

A project installation writes no operator's own setting. It is shared through the project, and a
tier's model and how the session shows its agent are each operator's own, so writing them there
would impose your settings on the whole team: it asks neither the model question nor the status
line one, and writes no `modelRoles` entry and nothing about the status line, in the project or
anywhere else; `--model-roles` and `--agent-status` with `--scope project` are each refused. It
reads, without writing, the project's `.omp/config.yml` and your `~/.omp/agent/config.yml`, and
names as your next steps: each tier the agents fall back to that neither binds, to bind in your own
settings by hand or with `cratylus install --scope user --model-roles <tier=model,…>`; and, where
those settings (the project's over yours, as omp reads them, a key set to null counting as unset)
hide the session's agent, how to show it. Where the project's own `statusLine` keys hide it (its
`showHookStatus: false`, or a preset or segment list that leaves `status` out), the step names
those keys in the project's `.omp/config.yml`: they are the project's setting, to change there.
Where your own settings alone hide it, the step offers
`cratylus install --scope user --agent-status show`, unless your user installation already
recorded an answer to that question, which a user install then never applies again: then it names
the keys in your `~/.omp/agent/config.yml` that hide it, your own setting, to change there.

Inside a project that has one, the `cratylus` command you run yourself, naming no installation,
reads the project installation; elsewhere it reads yours.

### Which practices

A practice is a way of working that install offers as one choice: the agents and skills that
carry it, installed together. On a terminal, install asks one question that lists each practice with its
description, the practices already installed here ticked (on a fresh host, the one the corpus
preselects).

`--practices <name,…>` names the practices to install, as in
`--practices intent-based-delegation`, and `--all` takes every one. They are refused together, and
so is a name no practice answers to; that refusal lists the
practices the corpus declares. Without a terminal and with neither flag, `install` refuses before
writing anything and lists them too: what it installed last time is a default for a question, never
an answer to one. An empty choice is refused as well (`--practices ''`, or every practice unticked),
since none is not every; to take it all out, run `cratylus uninstall --harness <h>`.

Installing again is how you change the choice. A practice installed before and not chosen now is
removed, with what no chosen practice still carries.

### Which rules

A rule is a standard working convention your agents follow in every session of every project,
stated with why it holds; a ruleset is one convention's rules (`gitflow`, `conventional-commits`,
`commit-discipline`, `established-libraries`, `green-field`). On a terminal, install offers each
ruleset in turn: all its rules, rule by rule, or none, which is the default. `--rules <name,…>`
settles it instead: a ruleset's name takes all its rules, a rule's name only that rule
(`--rules gitflow,commit-discipline-own-paths`), and `--rules none` takes none. A name that is no
ruleset or rule is refused, listing each ruleset with its rules.

The choice is recorded in the root by rule name, and installing again keeps it without asking
unless `--rules` says otherwise; a rule a later version no longer offers is dropped from it and
named in the summary. Without a terminal, or under `--yes`, with no choice recorded, no rule is
placed and the summary names choosing them as a next step.

### Which model each tier and persona runs on

Which model runs an agent is yours to choose, and it is your agent harness's own setting, never
cratylus's (decision 0112). Each agent's definition names its own model role first, then the tier
and effort its design gives it: `builder` declares `["@builder", "@frontier:medium"]`, and is never
rewritten with a model. So two kinds of role decide the model: a tier the agents fall back to
(`frontier`, `frontier-other-family`, …), and the role named for an agent, which wins over its tier
where you bind it.

On a terminal, a user install asks for a model for each tier, and each persona's role, that your
omp settings do not bind under `modelRoles` (`~/.omp/agent/config.yml`), and writes each answer
there as an ordinary entry of yours (`frontier: "openai/gpt-6"`). `--model-roles` settles the
decision instead, keyed by a tier or an agent's name (`frontier=openai/gpt-6,builder=google/gemini-3-pro`);
`--model-roles default` binds nothing. Nothing install binds for you is recorded as cratylus's, so
installing again, upgrading and uninstalling all keep it, and you change it by editing your config.
A role your config already binds is never asked and never changed; a `--model-roles` entry for it is
left as you set it, and said so. A project installation binds no models (above).

Where install is neither told nor able to ask (no terminal, or `--yes`), it places everything else
and ends by naming, as your next step, each tier the installed agents fall back to that your config
binds no model to. Until you bind it, an agent on that tier runs on the session's own model.

### What it places

Everything install places for you lives under one root it owns: at user scope `~/.cratylus/omp/` (`<home>/.cratylus/omp/` with `--home <home>`), at project scope `<project>/.cratylus/omp/`. Both are laid out alike, as an omp extension package:

```text
~/.cratylus/omp/
  agents/<name>.md          the corpus's agent definitions
  skills/<name>/…           the corpus's skills
  rules/<name>.md           the rules you chose, each applied in every session
  extensions/cratylus.ts    the extension: the capability tools, `omp --agent`, version skew
  extensions/…              the session hooks the corpus declares, and the dispatch isolation where an agent needs it
  hooks/<id>/…              the workers those session hooks run
  package.json              the package: the version of cratylus that installed it, and its modules
  runtime.json              each capability's configuration, where the corpus declares any
  delivered/cratylus/<context>.json
                            each context this release delivers, read-only: cratylic context design, then workflow
  installation.json         its scope (user or project), what install did outside the root, and the practices and rules installed
```

omp's own surfaces only refer into it, the way `omp plugin link` does. At user scope `~/.omp/plugins/node_modules/cratylus-omp` is a link to the root, and `~/.omp/plugins/package.json` names it as a dependency (that file is created only when you had none; anything else in it is yours and stays). So every project you open in omp is offered the agents, skills and tools, and no file of omp's is copied over or overwritten. At project scope the references are in `<project>/.omp/plugins`, each relative so that a clone elsewhere resolves it: `node_modules/cratylus-omp` is a link to `../../../.cratylus/omp`, `package.json` names it as `"cratylus-omp": "file:../../.cratylus/omp"`, and `.gitignore` there holds a block that re-includes that one link where the project ignores `node_modules`: a `# cratylus: …` comment line, then `!/node_modules/`, `/node_modules/*` and `!/node_modules/cratylus-omp`. Install appends the block whole after your own lines, or creates the file where there is none, and never reads or changes a line of yours, even one identical to a line of the block. A project's own `.omp/agents`, and your `~/.omp/agent/agents`, win over an agent definition of the same name.

Where you have put something of your own at either of those places — `cratylus-omp` linked elsewhere or replaced by a directory, or the dependency entry naming something other than the root — it is yours: install and upgrade leave it as you have it, record no reference there, and say so, with what to do to have omp load the root (move it away, or take the entry out, and install again). Uninstall leaves it too.

Install writes nothing else of yours, and only at user scope, in `~/.omp/agent/config.yml`: a project installation writes no operator's own setting (above). The models you choose for tiers and roles go there as your own `modelRoles` entries (the section on which model each tier and persona runs on), recorded nowhere as cratylus's. And where those settings hide the row an extension's status shows in (`statusLine.showHookStatus: false`) and your layout does not list omp's `status` segment, whether a session started as an agent shows its name and mark there is your choice: install asks (or takes `--agent-status show|hide`), and on `show` lists `status` in your layout (or shows the row again). Your answer is your own setting, recorded nowhere as cratylus's: no later install asks for it or applies it again, and upgrade and uninstall leave the setting as you have it. Where install is neither told nor able to ask, it changes nothing there and names the choice as a next step.

**Installing again at the same scope is upgrading.** The root is replaced whole: what the new version places, exactly, and nothing an earlier one placed that it no longer does. A change you make inside the root is not kept; put your own agents and skills on omp's own surfaces instead. Installing again with the same version changes nothing.

**Session hooks.** The corpus names 31 canonical lifecycle events; omp realizes 9 of them by a native event of its own. The rest have no native peer there and are refused or skipped with a warning rather than faked.

**An isolated agent's dispatch.** An agent may declare a worktree of its own; none of the bundled agents does. omp's agent definition has no field for isolation, so install does what omp offers: a dispatch of the agent is made an isolated task, which runs in an isolated copy of the dispatcher's checkout and never writes the main checkout. What it built is kept as the branch `omp/task/<id>` in your repository, not applied. The copy is made from the dispatcher's HEAD and its uncommitted work, and omp takes no ref to start it from; building off the bound plan's line is the agent's own work. Where the checkout has uncommitted work, omp also rewrites the agent's commits onto the dispatcher's HEAD. Projection warns once per such agent and install prints the same in its summary. For this install sets `task.isolation.enabled: true`, `apply: false` and `merge: branch` in `config.yml` (a value you held is replaced, and uninstall puts it back). They hold for the isolated tasks you dispatch yourself as well: their changes are kept as a branch, not applied, until you change the settings.

**The delivered practice.** Each release carries two of cratylus's own contexts — the practice it ships — upstream first: `cratylic context design`, then `workflow`. Each is projected as cratylus's concept journal records it at that release's build: the current subject and relation and every live concept at its current meaning, with no history, decisions or retired concepts. Install places each read-only at `delivered/cratylus/<context>.json` (`delivered/cratylus/cratylic context design.json`, `delivered/cratylus/workflow.json`), at either scope and whatever practices and rules you choose, with cratylus as its origin, the release's version, the identity of the context in cratylus's journal and its `position`, its place in that order from 0 (cratylic context design 0, workflow 1); installing again replaces them with the new release's, and uninstall removes them with the root. Neither is ever written into any project's journal (`cratylus concepts` below).

**An earlier installation** — cratylus before the owned root placed its agents in `~/.omp/agent/agents`, its skills in `~/.agents/skills`, its extensions in `~/.omp/agent/extensions`, hook workers in `~/.omp/hooks`, `modelRoles` and a status line in `config.yml`, and `~/.cratylus.json` — is taken back by the next user install, by its own record (`~/.omp/.forge/deploy-manifest.json`): each file it placed while it is still the bytes it wrote, each line it added while it stands as written, and the record last. A file or a part of `~/.cratylus.json` it placed before it recorded what it wrote is cratylus's by that record, and goes too, as does a status line layout in `config.yml` that is byte for byte the one it wrote; so no earlier agent outside the root takes the place of the root's. The `modelRoles` entries it seeded are the one exception: which model a role runs on is your setting, so they stay in your config as your own from then on, and the run names them. A file you changed since it recorded the bytes it wrote is yours, and is left and named; one it never recorded placing is never touched.

### When it refuses

A refusal is one line on stderr, `cratylus install: <what went wrong>; <what to do>`, with exit code
1 and nothing written. The ones you will meet:

- `no harness found (looked for <dir>); …`: omp has no directory here. Run it once, or name it
  with `--harness omp`.
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

At project scope install also refuses where the project is your home; where the project's
`.cratylus/omp` holds files and no installation record, which is an author's render tree
(`cratylus project` below) that a project root never shares a directory with; and where
`--model-roles` or `--agent-status` is given (`--model-roles: a project installation binds no
models, …`, `--agent-status: a project installation writes no status line choice, …`): settle
those at user scope instead.

## Starting a session as an agent

An installed agent starts as the session itself through omp's own flag:

```sh
omp --agent architect            # start the agent architect
omp --agent architect -p 'hi'    # every other word on the command line is omp's own flag
```

Install places no launcher and links no command for it: `--agent` is cratylus's extension (see
what install places), and it starts any agent definition omp discovers, not only the installed
agents. An `omp --agent` session starts with the full instructions of the skills its agent
definition's `autoload-skills` names, as a dispatched omp subagent does, and reaches the rest
through omp's own skill discovery, as any omp session does. Nothing judges an agent's acts or
replies: an agent's behaviour is evaluated in real use (decision 0142). Every turn shows the typed
assignment of each agent that takes one.

An earlier install placed a launcher (`~/.omp/agent/omp-agent`), and per agent under
`~/.omp/agent/personas/` a `--config` overlay, a badge module and the modules of the guards composed
for that agent, and, when asked, a command per agent in `~/.local/bin` linked to the launcher.
Install now places nothing under `~/.omp/agent/personas/`. The next user install removes
them: the files are pruned as files the deploy manifest records and this install no longer writes,
and each linked command the manifest records under `personaLinks` is unlinked while it still points
into the harness's home (one you have since pointed elsewhere is left and reported). `cratylus uninstall`
removes them too.

## The badge on the status line

An agent's badge is its mark and name, or the name alone when it has no mark, in the status line of
a session that runs it: `🏛️ architect`. It shows in the top-level interactive session and never in a
subagent's, and it carries no color. Where the host's status line hides it, a user `cratylus install` asks whether to show it (`--agent-status show|hide`), and shows it only on `show`. A project installation never asks or writes it: where the settings hide it, it names as your next step the project's own keys that do, to change in the project's `.omp/config.yml`, or, where your settings alone do, `cratylus install --scope user --agent-status show` (or, where your user installation already recorded an answer, the keys in your own config to change). The host's own
configuration is only ever added to, and `--dry-run` says what would be set and writes nothing.

The badge is the status cratylus's extension sets for a session started with
`omp --agent` (the section on starting a session as an agent), so install places no badge of its
own, and makes room for it wherever it places that extension, whether or not the corpus delivers any
agent: any session may be started as any agent definition omp discovers. An extension's status shows
inside the status line only where the host's layout lists omp's `status` segment, and omp reads a
segment list (`statusLine.leftSegments`) only under `statusLine.preset: custom`. Under any other
preset, the default one included, the list is ignored and the badge renders on a row beneath the
status line. On `show`, install edits your omp settings, `~/.omp/agent/config.yml` (`config.yaml`
where that is the file omp reads), according to the preset the host is on:

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

## The host's model routing on omp

An agent's definition names its own model role first, then the tier and effort it holds (decision 0111): `builder` declares `model: ["@builder", "@frontier:medium"]`. omp tries them in order, so a `modelRoles.builder` you set in your omp settings (`~/.omp/agent/config.yml`, or a project's `.omp/config.yml`) wins; without one, the agent runs on `@frontier:medium`, which is `modelRoles.frontier` at medium effort (and with no `frontier` role either, on the session's own model). The definition is never rewritten with a model: a model a user install binds for you, asked or by `--model-roles`, is a `modelRoles` entry of yours in `~/.omp/agent/config.yml` (decision 0112), which upgrade and uninstall keep; a project installation binds none. A role you already bind is never asked about, and a choice for it is said to be left as you set it. An agent's `spawns` is `*`: who dispatches whom is never limited. Every agent has omp's default tools.

## The host runtime config

Each capability's configuration, where the corpus's skills declare any, is written into the installation as `runtime.json`. `cratylus` reads it from `$AGENT_RUNTIME_CONFIG`, else from the installation `$CRATYLUS_INSTALLATION` names (omp's extension names its own on every call), else from the nearest project installation above the working directory, else from the user installation under `~/.cratylus/`. The `~/.cratylus.json` an earlier installation wrote is read no more, and the next user install or uninstall takes its parts out.

## Version skew

The installation records the version of cratylus that installed it; the extension's tools run the `cratylus` command on your `PATH`. When you upgrade one and not the other, every omp session start warns, naming both versions, whichever is older, and the scope (user or project) and root of the installation in use: install again with the cratylus in use, at that scope (`cratylus install --harness omp --scope user` for the user installation; `cratylus install --harness omp --scope project`, run in that project, for a project installation). The comparison reads the version the installation records and the version the command answers with `cratylus --version`, so it holds for a command that predates `versionSkew` too; where the command lacks a capability the installation expects, the warning names it, that capability's tool is not offered, and every other one still is. `cratylus versionSkew report` reports both at any time, and so does the `version_skew` tool in omp, which the installation itself carries: it is offered whatever command the capabilities reach, and reports the installation's recorded version beside the command's own `--version`, with the installation's scope and root. The root's `installation.json` names the version that projected it, and its scope, too; a record without a scope is a user installation. Nothing chooses between builds: a project's own pinned cratylus is never reached by the installed tools.

omp loads the extension once per process, and every session of that process, a dispatched one included, runs it as loaded, so an install reaches only omp processes started after it: restart omp to run the installed extension.

## Taking it away again

```sh
cratylus uninstall --harness omp                   # everything install placed for you
cratylus uninstall --harness omp --scope project   # everything install placed for the project you are in
cratylus uninstall --harness omp --dry-run         # the same report, nothing written
cratylus uninstall --harness omp --home <dir>      # another user's installation
```

`cratylus uninstall --harness omp` removes the user installation's owned root, whole, edits and additions inside it included; and every reference into it, found from where it points rather than from the root's record, so none is left dangling when you have edited or removed the root or its record: each link in `~/.omp/plugins/node_modules` that points into the root, and each dependency entry in `~/.omp/plugins/package.json` that names it (the file too where install created it and nothing else is in it). It also takes back an earlier installation by its own record, as install does. The `modelRoles` entries in your config stay, the ones install bound as you chose included, and so does your status line, shown or hidden as you answered: they are your settings, not cratylus's. Everything you placed or changed outside the root is left, your own entries on those same surfaces included, and what was left is named, with why. Your projects' journals and files are never touched, and neither is another user's installation. Restart omp afterwards to drop what it still has loaded.

With `--scope project` it does the same for the project the working directory is in, found as install finds it: it removes `<project>/.cratylus/omp` and the references into it in `<project>/.omp/plugins`, the `.gitignore` block install added there included (and nothing else of that file; the file itself only where install created it and nothing else is left), and `<project>/.omp` itself where install created it and nothing is left in it (an `.omp/` that was there before install stays); it keeps the project's `.omp/config.yml` settings as yours, and writes nothing under your home. Each scope's uninstall leaves the other's installations as they are.

## Exit codes and streams

A command writes its result to stdout and everything that is not the result, a failure, a warning or
a hint, to stderr, one line each. It exits `0` on success and `1` on failure. `cratylus` with no
arguments is no failure: it prints the orientation on stdout and exits `0`. A failure reads
`cratylus <command>: <what went wrong>; <what to do>`, and a usage error, an unknown command or flag
or a value outside its choices, names the word and the `--help` to read, with a nearest match when
one is close. Colour marks only the prefix of a failure or warning, and only on a terminal with
`NO_COLOR` unset. `deploy --check` exits `0` in sync, `1` on drift and `2` when it could not run,
usage errors included. A reader that closes the pipe, as `cratylus project --verbose | head -1`
does, ends the command quietly.

## Commands

Every command and every capability verb answers `--help`; this reference is that help, once.

### `cratylus install`

Install the bundled corpus into an agent harness on this machine, asking what you have not said.

```sh
cratylus install [options]
```

| Flag                      | What it does                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--harness <name>`        | The agent harness to install into (default: the one this machine has, else asked) (choices: "omp")                                                                                                                                                                                                                                          |
| `--scope <scope>`         | Where to install: user, for you in every project, or project, inside the project of the current directory, committable, in place of your user installation there (default: asked on a terminal outside your home directory, user preselected; else user) (choices: "user", "project")                                                       |
| `--practices <names>`     | The practices to install, comma-separated (default: asked on a terminal, the ones already installed here preselected; without a terminal, required unless --all)                                                                                                                                                                            |
| `--all`                   | Install every practice, without asking                                                                                                                                                                                                                                                                                                      |
| `--rules <names>`         | The rules your agents follow in every project, comma-separated: a ruleset's name takes all its rules, a rule's name that one; or 'none' (default: the rules chosen at the last install, else asked on a terminal; without one, none)                                                                                                        |
| `--model-roles <roles>`   | The model each tier the agents fall back to, or an agent's own role, runs on, as role=model comma-separated, bound in your own user settings; or 'default' to bind none; refused with --scope project, since a project installation binds no models (default: at user scope, each tier and persona role your settings do not bind is asked) |
| `--agent-status <choice>` | Whether the status line, where your settings hide it, shows the session's agent, written as your own user setting; refused with --scope project, since a project installation writes no operator's own setting (default: at user scope, asked where the status line hides it) (choices: "show", "hide")                                     |
| `-y, --yes`               | Take the default of every decision not given, and place without asking to go ahead (the practices already installed here, else the preselected ones; not an answer where there is no terminal)                                                                                                                                              |
| `--verbose`               | Also print the per-file detail of the run                                                                                                                                                                                                                                                                                                   |
| `--dry-run`               | Print what would be placed and stop, writing nothing                                                                                                                                                                                                                                                                                        |
| `--home <dir>`            | The home directory to install under: the owned root is <home>/.cratylus/<harness> (default: your home directory)                                                                                                                                                                                                                            |

### `cratylus uninstall`

Remove from an agent harness what install placed there — its owned root and every reference into it — and leave what the host placed or changed.

```sh
cratylus uninstall [options]
```

| Flag               | What it does                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--harness <name>` | The agent harness to remove from (required) (choices: "omp")                                                                                           |
| `--scope <scope>`  | The installation to remove: user, yours, or project, the one inside the project of the current directory (choices: "user", "project", default: "user") |
| `--dry-run`        | Print what would be removed and left, writing nothing                                                                                                  |
| `--verbose`        | Also list every item removed                                                                                                                           |
| `--home <dir>`     | The home directory the installation is under (default: your home directory)                                                                            |

## Capabilities

A capability is a command whose verbs a deployed skill calls back into. `cratylus <capability> --help` lists its verbs, and `cratylus <capability> <verb> --help` what one takes. The runtime's built-in capabilities are `concepts` and `versionSkew`:

```sh
cratylus concepts state
cratylus concepts supersede 'reservation expiry' --context booking --wording '…' --reason '…'
```

### `cratylus concepts`

The concept journal. Its verbs are `state`, `design`, `history`, `decisions`, `leakage`, `purpose`, `context`, `define`, `supersede`, `retire`, `decide`, `accept`, `deprecate` and `close`.

What the journal and each verb are for, when to reach for each, the concept each acts on, whether it reads, appends or closes, and what each parameter means are stated once, by the runtime, and not repeated here: `cratylus concepts --help` and `cratylus concepts <verb> --help` print them, and `cratylus concepts --explain` and `cratylus concepts <verb> --explain` print the same explanation as JSON (its name `concept journal`, purpose, when and verbs; per verb its concept, purpose, when, `reads`, `appends` or `closes`, and each parameter with its description, whether it is required, its JSON Schema, and `positional` for the word it acts on). The entries below name only each verb's usage and the flags it takes.

The concept journal is `design/journal` at the top of the git repository you run it in: one file per entry, named by its id, appended to and never edited, so two branches that both appended, or one that closed the books and one that appended, merge as the union of their files. The appending verbs (`purpose`, `context`, `define`, `supersede`, `retire`, `decide`, `accept`, `deprecate`) each append one entry and print it as JSON; the queries (`state`, `design`, `history`, `decisions`, `leakage`) append nothing and print JSON, the same every time for the same journal and example files. `close` closes the books. A refusal is one line on stderr, exit 1, and changes nothing.

**The project's purpose.** `purpose --statement '…'` records what the project is for, in plain words; `state` shows it first, as `purpose` (`null` until one is recorded), before any context. It changes the way a context's description does: `purpose --statement '…' --reason '…'` records a new statement superseding the current one, and a first recording with a reason, or a second without one, is refused. Purposes recorded differently on two branches compete (`purpose` is `null`, each listed under `competingPurposes`) until a later `purpose` with `--reason` settles them.

**The design state.** `state` answers the design state alone, for a model to read: `purpose` (and `competingPurposes` while they compete), the `practice` place, and `contexts`, each with its `name`, `subject`, `relation`, `competingDescriptions` only when any, `concepts`, each live concept as one line `"<term> ≜ <correction>"`, and `competing`, `[{ "name", "versions" }]`, each version such a line or `"<term> retired"`. It carries no decision, no `builtFrom`, no reason, no retired concept and no history, and takes no `--history`.

**What stands.** A decision records realization: `decide` marks every new decision `"decisionKind": "realization"` and takes no kind; what the design means is recorded only as a concept's version, its reason being its why. A decision stands while it is open or accepted, until a later decision supersedes it or a later entry deprecates it: `deprecate <id> --reason` records that a standing decision no longer applies and has no replacement. Standing decisions are read with `decisions` alone. Every example file present (`design/examples/<context>/<user-story>.md`) is current. Entries recorded by earlier workflows are read as recorded: a decision recorded with a kind of `meaning`, a classification of a decision's kind, a decision whose entry names a cut or example files it keeps, each by its own status alone, and the `efficiency` entries recorded for cuts, the past effort `history --context <name>` shows as `efficiency`. `design` gives each live concept by its meaning (`name`, `wording`, `builtFrom`) and no retired concept; `decisions` lists only standing decisions, each with its governing `kind` and none of `supersedes`, `supersededBy` or `kinds`. `--history` on `design` and `decisions` adds the history: each live concept's `reason`, the `retired` concepts, every superseded decision with its `supersededBy`, every deprecated one with its `deprecation` (the deprecating `entry` and its `reason`), and each decision's `supersedes`, `kinds` (every kind recorded, in order, each with the `entry` that recorded it and its `reason` where given) and recorded `cut`. `decisions` shows a decision by what it says first: its `title` leads, and its `id` and `entry` follow as references.

`leakage` reports implementation leakage as warnings, `{ "warnings": [...] }`, over the live concepts' corrections, the context descriptions and the numbered examples in `design/examples` of the same repository, never a decision; each warning names its passage (a concept by context and name, an example by file and number, a context's description by context and `field`, `subject` or `relation`), the words that leak and the rule they break. A context's own words never leak: the words of its concepts' names, and each word its current subject names, though only as that plain word on its own; a command, a code span or a flag that holds the word still leaks. A live concept's correction and a context's current subject and relation, which state only what holds now, are also warned where they cite a decision by its number (rule `cites a decision`), recount their history, what changed or what something used to be or no longer is (`recounts history`), or only extend the version they replace, keeping its wording whole and adding to it (`only extends the version it replaces`, the words being what was added). When what `context`, `define` or `supersede` records leaks, it is recorded all the same and the printed entry also carries its `warnings`; the journal's entry stores none. Nothing is ever refused for leakage.

What merged branches each recorded is kept, never chosen between. A concept superseded differently on two branches is reported as competing until a later `supersede` supersedes every version; superseding a retired concept brings it back, and its history keeps the retirement. A context's subject and relation change the way a concept does: `context` with `--reason` records a new description superseding the current one, and `history --context` without a concept lists every description the context has had. A context recorded on two branches with the same subject and relation is one context; with a different one its description is competing (`subject` and `relation` are `null`, each description listed under `competingDescriptions`) until a later `context` with `--reason` settles it. A decision is its entry, reported as `entry`: two branches may each record a decision under one id, and both are kept and listed; `accept`, `deprecate` and `--supersedes` take a decision's id, or its entry where the id is shared.

**Retiring a context.** `retire --context <context> --reason '…'`, given no concept, retires a bounded context of the project's own as an entry of its own, superseding its current descriptions and retirements; it is refused for a context the journal does not have, one already retired and a delivered one. Afterwards `state`, `design` and `leakage` leave the context and its concepts out, `decisions` lists its decisions only with `--history`, `history --context` lists the retirement with its reason (`"retired": true`) after its descriptions, and each of its concepts' history reads as before. `define`, `supersede`, `retire` and `decide` into it are refused, naming the remedy: `context <context> --reason '…'` brings it back by a new description superseding the retirement and every description the retirement superseded, so a runtime that reads past retirements sees one description, its subject and relation carried from the description the retirement superseded where left out, and its concepts and decisions read as they stood. A retired context holds no delivered context's place, so the delivered one shows again, and `close` carries nothing of it. A context is retired only while its one current entry is a retirement: a retirement and a description recorded on two branches compete (`subject` and `relation` are `null`, the retirement listed under `competingDescriptions` as `{ "retired": true, "reason" }`) until a later `context` with `--reason` or `retire` supersedes them all, and `close` opens the retirement as a `retire-context` opening beside the description's, so they still compete.

**Renaming a concept.** A concept whose term evokes the wrong meaning is renamed by `supersede <concept> --rename <new name>`, a new version with its correction stated against the new term: it is appended as an entry of kind `rename`, carrying everything a `supersede` carries, its `name` the new one, and `was`, the name it renames. A concept is the versions of one context joined by supersession or by a shared name, whatever order they were recorded in, so a `define` and a `rename` giving one name on joined lines of work are one concept, competing. The concept stays one concept through its names: `state` and `design` show it under its new name only, and `design` shows every `builtFrom` reference to it by that name; `history`, given its current name or any earlier one, lists every version, each with the `name` it was recorded under (a rename also with `was`) and its reason, references exactly as recorded. Every verb naming a concept takes its current name or an earlier one. A name stays its concept's for the journal's period: `define` refuses a name a concept of the context has had, naming that concept, and `--rename` refuses a name another concept has or has had and the concept's current name, though a concept may take back one of its own earlier names. Versions competing with different names are listed under the name of the latest version they all supersede, else of the concept's earliest version, each version carrying the `name` it gives where that differs. Closing the books opens a renamed concept as a `define` under its current name, every opening's `builtFrom` written with current names, and its earlier names stay in the closed period; `close` is refused while a concept's competing versions name it differently. A runtime that predates `rename` reads such an entry past and says its answer may be incomplete.

**Closing the books.** `close` closes the books as event sourcing does: it opens a new period with one opening entry per current version of each standing item, in the order they were recorded, written at one moment past every entry the journal holds: the project's purpose (`purpose`, its statement and reason), each context (`context`, its name, current subject, relation and reason, and `identity`, the context's identity, which it keeps from period to period), each live concept (`define`, its context, its current name, its current correction (`wording`), its built-from, each reference by its concept's current name, and its reason), and each standing decision (`decide`, its name, context, title, situation, decision and consequences, `accepted` where it is accepted, else `open`, its governing kind where one is recorded). Each opening supersedes nothing and carries `broughtForward`, the full sha of the commit at HEAD that holds the closed period; competing versions each open as an entry of their own (a retirement among them as a `retire`), so they still compete. A retired concept, a concept's earlier names, a superseded or deprecated decision, an acceptance, a classification, a cut's efficiency figures, and the cut or example files (`keeps`) a legacy decision's entry recorded are not carried: they stay in the closed period. It then removes every other entry file, an earlier close's openings included, and prints `{ "at", "by", "commit", "openings", "removed" }`: the moment and who closed, the commit, how many openings it wrote and how many files it removed; where writing an opening or removing a file fails it restores the journal from HEAD, removes the openings it wrote and refuses. An opening is an ordinary entry of its kind, so every reading reads it as it reads any entry: `state` and `design` answer the same after a close as before, and `decisions` gives each standing decision the same meaning and status, its `entry` renewed as its opening's id. A context's identity is the `identity` its earliest entry carrying one carries, else its earliest entry's id. Every reading covers the journal since its latest close: `history`, `design --history` and `decisions --history` show the versions, descriptions and decisions it holds since then, carry `booksClosed`, `{ "at", "by", "commit" }`, naming the latest close, and mark each opening they list with `broughtForward`, its commit; the closed period is read from git at that commit (`git show <commit>:design/journal/<id>.json`, or `cratylus concepts` run in a checkout of it). A concept retired before a close returns by `define`. A line of work that branched before a close joins it as recorded: a version superseding versions the journal no longer holds competes with its item's opening until a later version settles them, and an acceptance, deprecation or supersession naming a decision's entry the journal no longer holds binds by the decision's name, where one decision has it. `leakage` compares a version only with the versions it replaces that the journal holds; an opening replaces none. `close` refuses, changing nothing, outside a git repository or with no commit at HEAD, while `design/journal` differs from HEAD's tree in anything, an ignored file or one git is told to overlook included (commit the journal first), while it reads past entries of a newer runtime, when the journal holds no entry, when it holds nothing but opening entries, and while a concept's competing versions name it differently (settle them with `supersede` first).

**Delivered contexts.** A project's design and context map are its own contexts only: `contexts` in `state` and `design` lists the journal's own, but for its own copies of delivered contexts (below), and nothing else. Each context the installation `cratylus` reaches delivers (the one `$CRATYLUS_INSTALLATION` names, else the nearest project installation above the working directory, else the user installation under `~/.cratylus/`; none when there is none) is the practice the project's agents work by, shown apart, under `practice` — `{ "about", "contexts" }`, `about` saying what it is — placed before `contexts` so a fresh session reads it first, in the delivered order, by origin then each one's `position`, never by file name: cratylic context design as `cratylus:cratylic context design`, then the workflow as `cratylus:workflow`, each named by its origin and context, carrying `"delivered": { "origin", "version", "context", "identity" }` and `"readOnly": true`, with no decisions, retired concepts or recorded effort; its relation is told in cratylus's context map, never the project's. `--context cratylus:workflow` reads that one alone, under `practice`, with `contexts` empty. Its `history` has no versions, only its current meaning as `current`, and `decisions --context cratylus:workflow` lists none. Where the journal holds a delivered context itself — a context whose identity is the delivered identity, as cratylus's own journal does, on the branch you are on — its own copy stands in that context's place under `practice`, named by its own name, without `delivered` or `readOnly`, part of its design and recorded into as any of its contexts; `contexts` then lists the journal's other contexts in the order they were recorded. So a project holding its own cratylic context design but not the workflow reads its own cratylic context design, then `cratylus:workflow`, then its other contexts, and cratylus's own repository reads its cratylic context design, then its workflow, under `practice`, then its other contexts. `--context` naming an own copy reads it alone, under `practice`, with `contexts` empty. Recording into a delivered context (`context`, `define`, `supersede`, `retire` or `decide` naming `cratylus:cratylic context design` or `cratylus:workflow`) is refused as read-only and appends nothing; a context of your own named `workflow` or `cratylic context design` is yours, separate from it. Reading never creates the journal.

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
| `--history`         |

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
| `--history`         |

#### `cratylus concepts leakage`

```sh
cratylus concepts leakage [options]
```

| Flag                |
| ------------------- |
| `--context <value>` |

#### `cratylus concepts purpose`

```sh
cratylus concepts purpose [options]
```

| Flag                  |
| --------------------- |
| `--statement <value>` |
| `--reason <value>`    |

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
| `--rename <value>`     |

#### `cratylus concepts retire`

```sh
cratylus concepts retire [options] [concept]
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

#### `cratylus concepts accept`

```sh
cratylus concepts accept [options] <id>
```

| Flag               |
| ------------------ |
| `--reason <value>` |

#### `cratylus concepts deprecate`

```sh
cratylus concepts deprecate [options] <id>
```

| Flag               |
| ------------------ |
| `--reason <value>` |

#### `cratylus concepts close`

```sh
cratylus concepts close [options]
```

### `cratylus versionSkew`

Version skew. Its one verb is `report`, which prints `{ "artifacts", "command", "scope", "installation" }` as JSON: the version of cratylus that projected the installation (its owned root's `package.json`), the version of this `cratylus` command, the installation's scope (`user` or `project`, from its `installation.json`) and its root. The installation is the one `$CRATYLUS_INSTALLATION` names (omp's extension names its own on every call), else the project installation in the nearest directory above the working directory whose `.cratylus/` holds one, as omp loads there, else the one root under `~/.cratylus/`. It chooses between nothing; where the two differ, install again with the cratylus in use, at the installation's scope. In omp it is the read-only tool `version_skew`, and every session start warns when the two differ.

A build that is no release says which commit it is from: a `cratylus` run from the source tree it was built in, never installed as a package, reports its version with the commit as build metadata, `0.13.0+62c7b190` (`.modified` added where it was built from uncommitted changes), in `cratylus --version` and so in `versionSkew report` and in what `install` records; a release installed from the registry reports its version alone. A development build is never mistaken for the release.

#### `cratylus versionSkew report`

```sh
cratylus versionSkew report [options]
```

## Corpus authoring

These write and render a corpus. A consumer who only installs one needs none of them; each answers `--help` like the rest.

```sh
cratylus init                 # write a cratylus.config.ts naming a corpus
cratylus project              # render the resolved corpus into .cratylus/<harness>
cratylus deploy               # place a render tree into an agent harness
cratylus deploy --check       # is the deployed tree still what the corpus says?
cratylus explain <filter>     # where each resolved value came from
```

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

Render the plugins your config extends into a tree of an agent harness's files.

```sh
cratylus project [options]
```

| Flag               | What it does                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `--config <path>`  | The config file to load (default: cratylus.config.ts in the current directory)                |
| `--out <dir>`      | The directory to render into (default: .cratylus/<harness>, the tree `cratylus deploy` reads) |
| `--harness <name>` | The agent harness to render for (choices: "omp", default: "omp")                              |
| `--verbose`        | Also print one line per file rendered or pruned                                               |

It refuses to render into a directory that holds an installation (`cratylus install --scope project`
places one at `.cratylus/omp`); render elsewhere with `--out`.

### `cratylus deploy`

Place a rendered tree's agents, skills and hooks into an agent harness.

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
| `--scope <scope>`    | Where to place it: your home, as the owned root every project is offered, or a project (choices: "user", "project", default: "user")                                                                                                                                               |
| `--harness <name>`   | The agent harness to place into (choices: "omp", default: "omp")                                                                                                                                                                                                                   |
| `--home <dir>`       | The home directory the owned root is under, for --scope user (default: your home directory)                                                                                                                                                                                        |
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
