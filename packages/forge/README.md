# @cratylus/forge

The build core for [cratylus](../../README.md).

Agents, skills, and hooks are **authored** as typed TypeScript cells inside plugin packages. A project
declares which plugins it extends; `forge` resolves that set into one merged canon and projects it
into harness artifacts on the local machine.

The direction matters. The canon is the source; a harness's home (`~/.claude/`, `~/.omp/`) is a
projection of it. Nothing in this pipeline reads a harness's existing configuration and treats it as
truth.

## The pipeline

```text
init → add → compose → project → deploy
```

| Stage     | What it does                                                                        |
| --------- | ----------------------------------------------------------------------------------- |
| `init`    | scaffolds `cratylus.config.ts` in the project root, extending the canon plugin      |
| `add`     | wires another plugin package into that config's `extends`                           |
| `compose` | resolves the plugin set into one merged fragment set, and prints it                 |
| `project` | renders the resolved set into a render tree (`.render/`)                            |
| `deploy`  | places the render tree into the chosen harness's local root (`.claude/` or `.omp/`) |

Projection goes from composed cells to harness artifacts **directly**. The claude and omp harness
adapters render agent definitions, skill directories, and hook trees from the resolved cells; there is
no intermediate exchange format between the two, and no stage of this pipeline reads or writes one.

Composition is why projection cannot be pre-rendered and shipped. Which cells exist, and what each
resolves to, depends on the plugin set a consumer declares — a set the plugin authors never saw. So
`forge` ships as **code that runs during the consumer's build**, the way a bundler plugin does,
and `project` runs on the consumer's machine.

## Install

The CLI and the plugins are ordinary npm packages. Install the CLI globally, and each plugin into the
project that extends it:

```bash
npm install -g @cratylus/forge     # the CLI
npm install @cratylus/canon        # a plugin — the canon
```

A plugin that has not been published yet can be linked from disk instead:

```bash
npm i @cratylus/canon@file:../canon
```

## Quick start

```bash
cd ~/myproject

forge init            # scaffolds cratylus.config.ts (extends: [canon])
cratylus compose         # inspect the resolved fragment set
cratylus project         # render into ./.render
cratylus deploy \
  --agents-dir .render/agents \
  --skills-dir .render/skills \
  --hooks-dir  .render       # place into ~/.claude (add --harness omp for ~/.omp)
```

`init` writes a config that already extends the canon, so the shortest useful path skips `add`
entirely. Adding a second plugin is what `add` is for.

The scaffolded config is real, type-checked TypeScript — `extends` entries are imports, not strings:

```ts
import { defineConfig } from '@cratylus/forge/config';
import canon from '@cratylus/canon';

export default defineConfig({
  extends: [canon],
  patches: [],
});
```

## Commands

### `forge init`

Scaffolds `cratylus.config.ts` with the zero-config default `extends: [canon]`. The default is a
package resolved through the ordinary resolver, not a baked-in template. An existing config is left
untouched.

```
forge init
```

`@cratylus/canon` is the **default**, not the only corpus this scaffolds against — a projector that
could name only one corpus would be deciding what the design is. The plugin is a parameter of the
scaffold:

```ts
import { scaffoldConfig, DEFAULT_PLUGIN_PACKAGE } from '@cratylus/forge/config';

await scaffoldConfig(cwd); // extends: [canon]  — DEFAULT_PLUGIN_PACKAGE
await scaffoldConfig(cwd, { plugin: '@acme/corpus' }); // extends: [corpus]
```

The binding name is derived from the package specifier, and `forge add` edits either config the
same way — it reads the config's shape, not any particular corpus's name.

### `forge add <plugin>`

Inserts a real `import` for the package and appends its binding to `extends`. Idempotent — re-adding a
wired plugin reports no change. The npm install is deliberately left to you rather than run, and is
printed as the next step.

```
forge add @acme/agent-plugin
```

### `cratylus compose`

Loads the config, resolves the plugin set, and prints every resolved fragment with its value. Writes
nothing.

```
cratylus compose
cratylus compose --dry-run                     # same, stated explicitly
cratylus compose --config ./other.config.ts
```

### `cratylus project`

Materializes the resolved set into a render tree: `agents/`, `skills/`, and the harness's hook surface.
On claude that includes a `settings.json` carrying the hook registrations. omp has no hook
config, so its hooks are emitted as `enforcing/<scope>/` modules and there is no `settings.json`.
Skills that need a runtime companion get their shim emitted alongside them. A shim forwards its
arguments to `cratylus <capability>` with the caller's environment, and it needs no session from any
harness.

```
cratylus project [--config <path>] [--out <dir>] [--harness claude|omp]
```

Defaults: config `<cwd>/cratylus.config.ts`, out `<cwd>/.render`, harness `claude`. On success it prints
the counts it wrote and the exact `deploy` invocation that ships them.

```
cratylus project --out ./build --harness omp
```

#### An agent is given its skills' closure

An agent's `skills` are the names it declares; what projection gives it is their **closure** over
`composition`: the declared names first, then every skill they transitively compose, breadth-first in
each cell's declaration order, each name once. Each composed name is resolved against the set's
resolved skills, so a later plugin's same-name cell changes the closure, a name no plugin ships is
kept and not expanded, and a composition cycle terminates. The closure is computed once, before any
agent is rendered; every adapter renders the list it is handed.

Where it lands depends on whether the harness's agent definition can name skills it preloads
(`HarnessAdapter.preloadsSkills`):

| Harness | Preloads | The closure becomes                                                                                                                                                                                                                  |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| omp     | yes      | front-matter `autoloadSkills` (for a main session, the launcher inlines each skill's body)                                                                                                                                           |
| claude  | yes      | subagent: front-matter `skills`; for a main session, a `SessionStart` hook per skill in the definition prints its body (a skill over the hook's output cap is named under `## Required reading` by the hook instead, with a warning) |

### `cratylus deploy`

Places an already-projected render tree into the **local** root of the harness named by `--harness`
(`claude` or `omp`, default `claude`): `.claude/` or `.omp/`. Agent definitions and skill
directories are copied. On claude, `settings.json` hook registrations are merged into any existing
file rather than replacing it; on omp, the `enforcing/<scope>/` modules are placed instead, since omp has no
hook config to merge.

```
cratylus deploy --agents-dir <dir> --skills-dir <dir> --hooks-dir <dir>
```

| Option               | Effect                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| `--harness <name>`   | `claude` \| `omp` (default `claude`): whose root and layout                 |
| `--agents-dir <dir>` | render tree `agents/` — the projected definitions                           |
| `--skills-dir <dir>` | render tree `skills/` — the projected skill directories                     |
| `--hooks-dir <dir>`  | hooks: claude `settings.json`, omp `enforcing/<scope>/`, both `hooks/<id>/` |
| `--kind <kind>`      | `agent` \| `skill` \| `hooks` \| `all` (default `all`)                      |
| `--scope <scope>`    | `user` \| `project` (default `user`)                                        |
| `--home <dir>`       | user-scope parent of the harness home (`.claude` or `.omp`), instead of `~` |
| `--project <dir>`    | project root for `--scope project` (default cwd)                            |
| `--only <names>`     | comma-separated names to deploy                                             |
| `--assets <decls>`   | committed skill companions, `<skill>=<spec>[,…]`                            |
| `--dry-run`          | print the actions and change nothing                                        |

Which directories are required depends on `--kind`: `all` requires all three, `hooks` requires only
`--hooks-dir`, and `agent` or `skill` require `--agents-dir` and `--skills-dir`. Passing less is a
refusal, not a partial run.

Deploy stops at the harness's agent, skill and hook destinations (and the runtime config). A harness's
own model routing — omp's `modelRoles` — is host configuration, not a deployed artifact: `deploy` never
writes it, and only `cratylus install` seeds the missing entries for the roles the installed agents
hold.

Every adapter that declares `scopedRel` also receives one stance manifest per persona that composes a
guard, staged at `enforcing/<persona>/stance/manifest.json` by the projector (`core/enrollment.ts`, one
builder for both harnesses). A cell is a guard when it declares `binds`, the composition that binds an
agent to it; a persona's manifest lists exactly the guards its composed agent includes, and a cell that
binds nothing (a notice) is never listed. On omp the manifest lands beside the persona's modules; on
claude, whose hooks stay in `settings.json`, it is the only scoped artifact, and lands under
`.claude/personas/<name>/`. A harness with no `scopedRel` cannot name the running agent, so projection
warns once per guard and carries it as a steer, deploying no mechanism for it.

#### The destinations are the adapter's, not the render tree's

A render tree is forge's own STAGING layout — `agents/<name><ext>`, `skills/<name>/`,
`hooks/<id>/`, `enforcing/<scope>/` — and it is deliberately not any harness's layout. Deploy asks the
adapter where each artifact belongs:

| Artifact                   | Port op                  | claude                                                      | omp                                                          |
| -------------------------- | ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------ |
| agent definition (persona) | `agentRel(name)`         | `agents/<name><ext>`                                        | `agent/agents/<name>.md`                                     |
| skill directory            | `skillRel(name, agents)` | `skills/<name>`                                             | `../.agents/skills/<name>` (one copy — read natively)        |
| hook registration          | `hooksFile` (merged)     | `settings.json`                                             | — (no hook config exists)                                    |
| stance manifest            | `scopedRel(file, scope)` | `personas/<agent>/stance/manifest.json`                     | `<scope>/stance/manifest.json` (per persona)                 |
| scoped mechanism module    | `scopedRel(file, scope)` | —                                                           | `<scope>/extensions/<file>`                                  |
| persona badge              | `scopedRel(file, scope)` | `personas/<agent>/cratylus-persona-badge.txt` (per persona) | `<scope>/extensions/cratylus-persona-badge.ts` (per persona) |
| `--config` overlay         | `scopedRel(file, scope)` | —                                                           | `<scope>/omp.yml` (per persona)                              |
| launcher                   | `scopedRel(file, scope)` | `personas/_session/claude-agent` (0755, ONE)                | `agent/omp-agent` (0755, ONE for every persona)              |
| status-line worker         | `scopedRel(file, scope)` | `personas/_session/cratylus-status-line.sh` (0755, ONE)     | —                                                            |

`<scope>` is `agent/` for the SESSION copy (a launch that names no persona) or
`agent/personas/<agent>/` for a projected persona — a directory omp scans for nothing, so what lands
there is reachable only from that persona's own `--config` overlay and never from a bare `omp`.

**The definition is the single source of truth.** `~/.omp/agent/agents/<name>.md` is omp's USER-level
task-agent root: YAML front-matter carrying the `name` and `description` omp requires, and a body that
IS the system prompt. Dispatched as a subagent, omp reads it natively. Launched as a MAIN session —
for which omp has no `--agent` flag at all — `omp-agent <name>` (or a symlink named after the agent,
busybox-style) reads the same bytes, prepends the identity assertion omp's own base prompt would
otherwise win, appends the body of each `autoloadSkills` skill, and hands the result to
`--append-system-prompt`. One definition, two readers, nothing to drift — and ONE launcher on the
host rather than one per agent.

**The definition names a role, never a model.** An agent that holds a role (`Agent.holds`, the held
role's anchor, which the corpus's own fold sets) carries `model: ["@<role>", "@default"]` after its
`description`: omp's model-role alias for the held role, then omp's default role as the fallback, so a
host that never configured the role runs the agent on the default role (`modelRoles.default`). An agent
holding no role has no `model` key. Which model fills a role is the host's `modelRoles` entry in
`~/.omp/agent/config.yml` (or `config.yaml`, which omp reads only when config.yml is absent). The table
behind this is the adapter's optional `roleRouting` member (its default role, the built-in role nearest
each held role, and the config paths in read order); claude leaves it absent, since it has no host
role map to seed (its definitions route by tier instead, below). `cratylus install --harness omp` reads the held roles off the projected agents and, for each role
`modelRoles` has no key for, inserts `<role>: "@<nearest>"` — implementer and integrator to `task`, planner to `plan`,
assayer and architect to `default`. It edits the config file omp reads — `config.yml`, else `config.yaml` —
by inserting lines, so every other byte survives; it never changes an entry the host already has, creates
`config.yml` only when the host has neither file, and, when `modelRoles` is
a flow mapping, a scalar or carries an anchor or alias, reports that it left the file alone and still
succeeds. `--dry-run` reports what it would add and writes nothing. `cratylus deploy` places
definitions only and never touches `config.yml`.

A main session starts with the skills omp itself resolves, as a dispatched subagent does. For each name
in `autoloadSkills`, in order, the launcher runs `omp read skill://<name>` from the launch directory and
inlines what omp returns, front matter stripped: omp's own resolver, so every root it reads (user and
project) and every setting that gates them apply, with no second copy of that logic in the launcher.
omp exposes no skill's location, so there is no base directory; instead each `# Skill: <name>` section
opens with one line per generated shim among its `scripts/` (for plan: `scripts/plan.mjs <verb>` runs
as `cratylus plan <verb>`), because every generated shim is a thin forwarder to the host CLI. A shim is
known by its signature line (`// cratylus-shim: <capability>`), which names the capability it forwards
to; a script the skill's author wrote gets no line. `--no-skills` passed to the launcher inlines none,
and a `--skills` filter, which the launcher does not mirror, earns one stderr line. A skill omp cannot resolve is named as `skill://<name>` under
`## Required reading`, and the launcher prints one `omp-agent:` line to stderr per such skill before it
launches. The prompt stays one argument, bounded by Linux's per-argument `MAX_ARG_STRLEN` (128 KiB),
not `ARG_MAX`; the largest measured today is about 34 KB (nico with its closure).

Identity used to be carried by projecting each persona INTO an omp `--profile`
(`profiles/<name>/agent/APPEND_SYSTEM.md`), which conflated an agent's IDENTITY with the operator's
whole ENVIRONMENT (a profile also silos auth, MCP, models, sessions and `agent.db`). The two are
orthogonal: an operator who also wants a `--profile` passes one on the launcher's own command line.

`skillRel` stays PLURAL on the port (a harness may still scope a reader by directory), but omp now
returns exactly one destination: its vendor-neutral `.agent[s]` provider reads `~/.agents/skills`
NATIVELY, for every launch, so the N+1 fan-out the old profile carrier required bought nothing once the
persona stopped being a profile. Assuming the staging layout was every harness's destination is what
once deployed 16 omp skills into `~/.omp/skills` — a directory that harness never scans — while
reporting success.

**On Claude Code the definition names a tier, never a model version.** Claude Code has no
host-configurable role aliases: a definition's `model` takes an id, a tier alias or `inherit`. The
claude adapter therefore holds its own table from the held role to a tier alias, and an agent's
definition carries `model: <tier>` right after its `description`: `sonnet` for an implementer or
integrator, `opus` for a planner, assayer or architect. An agent holding any other role, or none, has
no `model` and runs on the session's model. The alias resolves to whatever Claude currently serves for
that tier. The definition's `model:` line is the one place a host sets a subagent's model, so a deploy
keeps the host's choice there: the deploy manifest records, per placed claude definition, the `model:`
value it rendered (`DeployManifest.agentModels`, beside `personaLinks`), and a deployed definition whose
`model:` differs from that record — edited, added or removed — keeps the host's line, or none, in the
definition placed over it (a definition with no record, from an install before the record existed, was written without a `model:` line, so one found there is the host's and is kept) (`PlaceOpts.keepHostModel`, set for the `.claude` home; every other line is
replaced as before). The deploy log names each definition whose model it kept. `install` reports the
roles as settable on the first install, and on every one: one line per held role with its tier and the
`model:` line that sets it, and the subagent override. The host's own choice outranks the definition
too: `--model` on a `claude --agent` main session, and for a dispatched subagent
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` together with `CLAUDE_CODE_SUBAGENT_MODEL=<model>`
(`CLAUDE_CODE_SUBAGENT_MODEL` alone leaves the definition's tier standing).

**Persona commands.** `launcherFile` on the port names the launcher the adapter's `launchSurface`
emits in the SESSION scope: `omp-agent` on omp, `claude-agent` on Claude Code
(`personas/_session/claude-agent`, which starts `claude --agent <persona>` and refuses a name that
is no persona with one stderr line, exit 2). `cratylus install --link-persona-commands` links
`~/.local/bin/<persona>` to it, through `placePersonaCommands` in `deploy/persona-commands.ts`: it
plans first (`planPersonaCommands`), places only the names that are free, and never unlinks before
it links, so a regular file, another program's link, and the other harness's launcher are all left as
they were and reported as blocked. A hand-made link that resolves exactly to this launcher is adopted:
recorded and reported, never re-created. The links it placed or adopted are
recorded as `personaLinks` in the deploy manifest, and `removePersonaCommands` removes exactly the
recorded links that still resolve to the launcher (`cratylus uninstall` calls it). Without the flag,
install prints what it would place and asks on a terminal.

`scopedRel` (renamed from `enforcingRel`) places more than mechanism now: the SAME per-scope map also
places the launch spec's overlay and launcher, because both belong beside the modules they wire, not in
a directory of their own. A harness whose hook surface is a PROGRAM rather than a config file (omp: its
loader scans an `extensions/` dir, or a directory named in a launch spec's `--config` overlay) has no
fragment to merge, so its adapter implements `scopeActivatedSurface` and `launchSurface`, and the
projection stages one artifact per scope for deploy to place.

`launchSurface` takes the composed agents, each once, because on omp the identity a launch carries
includes what the operator sees of it: the **persona badge**, one `cratylus-persona-badge.ts` module
per persona in that persona's own `extensions/`. On `session_start`, in a top-level interactive
session only (`ctx.hasUI` and `ctx.agent.kind === "main"`, never a subagent), it sets the status line
to the persona's mark emoji and name, or the name alone for an agent with no provenance. The text is
baked at projection, because omp calls a launched persona `main` and the module cannot ask; it carries
no hue, because omp strips color from an extension's status text.

On Claude Code the badge is a text file per persona, `personas/<agent>/cratylus-persona-badge.txt`,
with the same baked text (`<mark emoji> <name>`, or the name alone, no hue), and ONE session-scoped
status-line worker beside the launcher. Claude's status line is a single `settings.json` command
with no segments, and its input carries `agent.name` only under `--agent`, so the worker reads the
running persona there, prints that persona's badge file when one was placed (placement decides who
has a badge; the worker holds no persona list) and prints nothing otherwise. Given the host's own
command as its one argument it runs that on the same input and puts the badge and a space before the
first line of its output. It fails open without `jq`. The port declares the worker as `statusLine`
(`file`, and the `command` that runs it, written against `$HOME`). A harness whose status line is a
list of segments declares `statusSegment` instead (omp's): the host config files that hold the layout,
the segment an extension's status renders in, the layout in effect when the host names no preset, and
the left list the `custom` preset falls back to.

Making the host's status line show the badge is install's, in `deploy/status-line.ts`, after a
successful deploy and only when personas were installed. `ensureBadgeStatusLine` sets the worker as
`statusLine` where the host has none, keeps a status line that already is the worker, and wraps any
other: it rewrites `command` to the worker with the host's command as one single-quoted argument,
keeps every other key, and a second run wraps nothing twice. Its result carries the `command` now in
place and the host's original (`null` where the host had none), which install records as
`DeployManifest.statusLine` for an uninstall to restore from. A `statusLine` that is not a `command`
one is refused and left byte-identical (Claude Code rejects such a file and runs no status line).
`ensureStatusSegment` edits omp's config as text, as `addModelRoles` does, and
shares its line helpers (`deploy/yaml-lines.ts`). omp reads a segment list only under
`statusLine.preset: custom`, so a host with no preset gets `preset: custom` with the default preset's
layout written out (left plus `status`, right, segment options) unless it laid out its own line
(`leftSegments`, `rightSegments` or `segmentOptions`), which `custom` would activate or leave
partial: that host is left byte-identical (`own-layout`) and told what to write. A host on `custom`
gets `status` appended to its list, and a host on any other named preset is left byte-identical
(`other-preset`) and told that `custom` replaces the preset's layout, with the whole block: exact
lists for the default preset (`defaultPreset` on the port), and for another its own segments
followed by `status`. Where the segment is left in the live layout it also writes
`showHookStatus: false` unless the host set it, because omp prints every extension's status on a row
beneath the editor too and the segment already draws them all inline. Where it is not in the live
layout (`other-preset`, `own-layout`, or any shape it cannot extend or read) that row is the badge's
only place, so a host's `showHookStatus: false` is turned to `true`, the one value of the host's it
ever changes, found as text so a flow mapping is reached too, and the result says `hookRowShown`.
Other than that a shape it cannot extend is reported and left.
Both honour `--dry-run`.

### `cratylus uninstall --harness <name>`

Removes from a harness's home what install placed there, and leaves what the host placed or changed.
`cli/commands/uninstall.ts` reads the deploy manifest and nothing else to say what is install's, and the
manifest records what that takes: `digests` (rel path → the sha-256 `deploy.ts` took of each file just
after its placer wrote it, via `digestWritten`; a run carries the digest of a path it did not write, so
an edit the host made is never blessed by a later run), `hostEdits` (rel path of a host-owned text file
→ the `LineHunk`s install put in, as a line diff of the file before and after, taken by
`addModelRoles` and `ensureStatusSegment` and written by install through `noteHostEdit`), and the
existing `statusLine`, `hookCommands` and `personaLinks`.

A recorded file whose digest still matches is removed, through `applyPrune`, which prunes the
directories that leaves empty and never the root; `placedFileState` (`deploy/local.ts`) says
`unchanged`, `changed`, `unverified` (no digest recorded) or `absent`. A hook registration is dropped by
`unregisterHookCommands`, which takes an entry only when every command in it is recorded.
`restoreHostStatusLine` puts the host's command back in the wrapped `statusLine` and deletes a `statusLine`
install set. `undoHunks` takes the hunks out of the config newest first. An inserted run comes out
ONE LINE AT A TIME, each found from under the line that stood above the run: a line the host has
changed is `changed` and stays, whatever stands there is the host's, and every other line of the run
still comes out; a line with lines of the host's beneath it (a header whose child the host edited)
stays too, as `holding`, so the host's lines keep the block they were written in. A replaced line goes
back only while it stands as written, and a terminator install added to the file's last line comes
off only while that line is still the last. So the file comes back byte for byte, and a file install
created returns to nothing. A record written before install recorded its edits carries no `hostEdits`
(`recordsHostEdits`): an uninstall then names the config file it cannot vouch for, and the next
install, which reads that before its deploy rewrites the record, adopts the `modelRoles` lines and
the `statusLine` block it finds there byte for byte as it would write them (`adopt` on `addModelRoles`
and `ensureStatusSegment`, recorded through `adoptedHunk`), so the uninstall after it takes them.
`removePersonaCommands` takes the recorded persona commands. A path outside the harness home and the
neutral `.agents` root, and a path another harness's manifest records, are left; so is everything that
is `changed` or `unverified`. The report is two lists, removed and left, each left entry with its
reason. `--dry-run` runs every step and writes nothing. The manifest is removed last, and an unreadable
or foreign-version manifest is refused rather than read as empty.

### `cratylus explain [agent]`

Reports each resolved fragment's provenance — the contributing plugin or patch, the operation, and the
final value. The optional argument is declared `[agent]`, and today it acts as a substring filter over
fragment ids, so pass a fragment id fragment rather than an agent name.

```
cratylus explain                       # every fragment
cratylus explain fileOps               # just the ones whose id contains 'fileOps'
cratylus explain --json
```

### `cratylus catalog [agent]`

Lists the extendable fragment ids across every extended plugin — what `add` and `patches` have to aim
at.

```
cratylus catalog
cratylus catalog --json
cratylus catalog --corpus <dir>        # per-dimension corpus census instead
```

## Where the boundaries are

Three concerns look adjacent to this pipeline and are deliberately outside it.

**Delivery is npm's.** Getting `@cratylus/forge` and the plugin packages onto a machine is an
ordinary package install. It is a _precondition_ of the pipeline, not a stage of it — `init` cannot run
before the CLI exists.

**Projection is local.** `deploy` writes to a harness root (`.claude/` or `.omp/`) on the machine it runs on, resolved from
`--scope`, `--home`, and `--project`. It has no transport, no host list, and no remote mode.

**Running it across many hosts is yours.** Iterating a fleet is an outer loop _around_ the whole
pipeline, and it is a site-specific concern rather than a feature of this tool. The loop ssh's to each
host, installs the packages, and runs the ordinary local sequence there. `forge` is the body of
that loop, not the loop.

## Library surface

The CLI is a thin shell over exported functions. The subpaths that back the pipeline:

```ts
import { defineConfig, loadConfig, addPlugin } from '@cratylus/forge/config';
import { resolve, defineAgentPlugin } from '@cratylus/forge/resolve';
import { projectPluginSet } from '@cratylus/forge/project';
import { deploySingle, userScope, projectScope } from '@cratylus/forge/deploy';
import { adapterByName } from '@cratylus/forge/adapters/registry';
```

`adapterByName` is the single selection point for a harness adapter — `'claude'` or `'omp'` — so a
consumer depends on the adapter port and this selector rather than on a concrete harness module.
Plugin authors also want `@cratylus/schema` for the cell types — they are no longer forge's, and
importing them from the projector was the inversion `schema` exists to end.

## Exit codes

Every command above exits `0` on success and `1` on failure. Refusals — a missing config, an empty
`extends`, a missing required directory — are failures, reported on stderr with the reason.

## Also in the binary

`forge optimize <source> --plan <file>` gates an LLM-authored exemplify plan: it checks the
accept laws (`REC ≽` · `minimal` · `conform`), writes the accepted R=LLM artifacts, and emits the R3
routing manifest. It is opt-in and stands beside the pipeline rather than inside it.

## What used to be here

Earlier versions of this binary carried a second, disjoint lineage behind the same name: `import`,
`compile`, `diff`, `lint`, `watch`, `migrate`, `adapters`, `events`, `doctor` — a config transpiler
that lifted an existing harness's files into an intermediate representation under `.forge/`
and compiled that back out to sixteen other clients.

It shared no data with the pipeline above, and it ran against the direction this project exists to
establish: it took a harness's own configuration as its source of truth, where the canon is authored
and runtime artifacts are projections that never author meaning. It has been deleted, not deprecated
— those verbs error as unknown, and there is no IR, no `.forge/` directory, and no adapter
roster left behind them.

Lifting an existing setup is still genuinely useful onboarding; its **target** was what was wrong.
The valuable form is `import → cells` (into the canon), not `import → IR` (into a rival source of
truth). That is a future plan with its own derivation to do, and is deliberately not promised here.

## License

MIT © Lance Caraccioli — see [LICENSE](../../LICENSE).
