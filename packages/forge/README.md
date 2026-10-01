# @cratylus/forge

The build core for [cratylus](../../README.md): it resolves the plugins a project extends into one
merged set of cells and renders that set into the files a harness reads.

This README is for the author of a corpus, or of an adapter for a harness, who works against the
library. What every package is for is [ARCHITECTURE.md](../../ARCHITECTURE.md)'s. What a consumer does
with the `cratylus` command — install and its flags, the practices, launching an agent by name, the
badge, uninstall — is [the `cratylus` README](../cli/README.md)'s, which documents each command to
match its `--help`.

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

| Stage     | What it does                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `init`    | scaffolds `cratylus.config.ts` in the project root, extending a plugin                                  |
| `add`     | wires another plugin package into that config's `extends`                                               |
| `compose` | resolves the plugin set into one merged fragment set, and prints it                                     |
| `project` | renders the resolved set into a render tree (`.cratylus/<harness>`)                                     |
| `deploy`  | places the render tree into the chosen harness's home (`.claude/` or `.omp/`), at user or project scope |

Projection goes from composed cells to harness artifacts **directly**. The claude and omp harness
adapters render agent definitions, skill directories, and hook trees from the resolved cells; there is
no intermediate exchange format between the two, and no stage of this pipeline reads or writes one.

Composition is why projection cannot be pre-rendered and shipped. Which cells exist, and what each
resolves to, depends on the plugin set a consumer declares — a set the plugin authors never saw. So
`forge` ships as **code that runs during the consumer's build**, the way a bundler plugin does,
and `project` runs on the consumer's machine.

The scaffolded config is real, type-checked TypeScript — `extends` entries are imports, not strings:

```ts
import { defineConfig } from 'cratylus';
import canon from '@cratylus/canon';

export default defineConfig({
  extends: [canon],
  patches: [],
});
```

## Scaffolding a config

`scaffoldConfig` writes `cratylus.config.ts` with the zero-config default `extends: [canon]`. The
default is a package resolved through the ordinary resolver, not a baked-in template. An existing
config is left untouched.

`@cratylus/canon` is the **default**, not the only corpus this scaffolds against — a projector that
could name only one corpus would be deciding what the design is. The plugin is a parameter of the
scaffold:

```ts
import { scaffoldConfig, DEFAULT_PLUGIN_PACKAGE } from '@cratylus/forge/config';

await scaffoldConfig(cwd); // extends: [canon]  — DEFAULT_PLUGIN_PACKAGE
await scaffoldConfig(cwd, { plugin: '@acme/corpus' }); // extends: [corpus]
```

The binding name is derived from the package specifier, and `addPlugin` edits either config the same
way — it reads the config's shape, not any particular corpus's name. Writing the config does not
install what it imports.

## Rendering a tree

`projectPluginSet` materializes the resolved set into a render tree: `agents/`, `skills/`, and the
harness's hook surface. On claude that includes a `settings.json` carrying the hook registrations.
omp has no hook config, so its hooks are emitted as `enforcing/<scope>/` modules and there is no
`settings.json`. Skills that need a runtime companion get their shim emitted alongside them. A shim
forwards its arguments to `cratylus <capability>` with the caller's environment, and it needs no
session from any harness.

### A render may name practices

A plugin declares **practices** (`AgentPlugin.practices`): ways of working an install offers as one
choice, each naming the agents it installs and any skills no agent carries, beside the **plumbing**
(`AgentPlugin.plumbing`) every practice is installed with and none is offered as. `projectPluginSet`
renders the practices it is given (`ProjectOpts.practices`); named none, it renders every cell exactly
as a plugin set declaring no practice does, byte for byte. Given names, it renders the union of those
practices' agents and skills, the skills those are given and compose, the plumbing, and the guards a
rendered agent composes (a hook cell that binds a composition is registered only when a rendered
agent composes what it binds; a hook cell that is neither plumbing nor such a guard is left out). An
empty list is refused: no practice is not every practice.

A chosen set must be closed. Before anything is rendered, projection checks that every agent finds
the roles it dispatches (`Agent.dispatches`, matched by anchor against `Agent.holds`) held by an
agent of the set and every skill it is given, with what that composes, carried by the plugin set; a
set that is not is refused by one error naming the practice, the agent, and the role or skill that
is missing. A name that is no declared practice is refused, naming the declared ones. The tree
reports the declared practices (`ProjectedTree.practices`: name, description, whether preselected)
for an install to offer, whatever was rendered.

### An agent is given its skills' closure

An agent's `skills` are the names it declares; what projection gives it is their **closure** over
`composition`: the declared names first, then every skill they transitively compose, breadth-first in
each cell's declaration order, each name once. Each composed name is resolved against the set's
resolved skills, so a later plugin's same-name cell changes the closure, a name no plugin ships is
kept and not expanded, and a composition cycle terminates. The closure is computed once, before any
agent is rendered; every adapter renders the list it is handed.

Where it lands depends on whether the harness's agent definition can name skills it preloads
(`HarnessAdapter.preloadsSkills`), which both shipped adapters answer yes to:

| Harness | The closure becomes                                                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| omp     | front-matter `autoloadSkills` (for a main session, the launcher inlines each skill's body)                                                                                                                                           |
| claude  | subagent: front-matter `skills`; for a main session, a `SessionStart` hook per skill in the definition prints its body (a skill over the hook's output cap is named under `## Required reading` by the hook instead, with a warning) |

A harness that answers no gets the closure as a required-reading declaration, and projection warns
once per agent that has any.

## How deploy places a tree

`deploySingle` places one kind (agents, skills or hooks) of an already-projected render tree into
the **local** root of the harness it is given (`claude` or `omp`): `.claude/` or `.omp/`. Agent
definitions and skill directories are copied. On claude, `settings.json` hook registrations are
merged into any existing file rather than replacing it; on omp, the `enforcing/<scope>/` modules are
placed instead, since omp has no hook config to merge.

Deploy stops at the harness's agent, skill and hook destinations (and the runtime config). A
harness's own model routing — omp's `modelRoles` — is host configuration, not a deployed artifact:
`deploy` never writes it, and only `cratylus install` seeds the missing entries for the roles the
installed agents hold.

Every adapter that declares `scopedRel` also receives one stance manifest per agent that composes a
guard, staged at `enforcing/<agent>/stance/manifest.json` by the projector (`core/enrollment.ts`, one
builder for both harnesses). A cell is a guard when it declares `binds`, the composition that binds an
agent to it; an agent's manifest lists exactly the guards it includes, and a cell that binds nothing
(a notice) is never listed. On omp the manifest lands beside the agent's modules; on claude, whose
hooks stay in `settings.json`, it is the only scoped artifact, and lands under
`.claude/personas/<name>/`. A harness with no `scopedRel` cannot name the running agent, so projection
warns once per guard and carries it as a steer, deploying no mechanism for it.

### The destinations are the adapter's, not the render tree's

A render tree is forge's own STAGING layout — `agents/<name><ext>`, `skills/<name>/`,
`hooks/<id>/`, `enforcing/<scope>/` and `shared/` — and it is deliberately not any harness's layout.
`shared/` holds the hook assets that are the same on every harness, which deploy places under the
vendor-neutral `.agents` root. Deploy asks the adapter where each artifact belongs:

| Artifact                | Port op                  | claude                                                    | omp                                                        |
| ----------------------- | ------------------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
| agent definition        | `agentRel(name)`         | `agents/<name><ext>`                                      | `agent/agents/<name>.md`                                   |
| skill directory         | `skillRel(name, agents)` | `skills/<name>`                                           | `../.agents/skills/<name>` (one copy — read natively)      |
| hook registration       | `hooksFile` (merged)     | `settings.json`                                           | — (no hook config exists, so nothing is merged)            |
| stance manifest         | `scopedRel(file, scope)` | `personas/<agent>/stance/manifest.json`                   | `<scope>/stance/manifest.json` (per agent)                 |
| scoped mechanism module | `scopedRel(file, scope)` | —                                                         | `<scope>/extensions/<file>`                                |
| badge                   | `scopedRel(file, scope)` | `personas/<agent>/cratylus-persona-badge.txt` (per agent) | `<scope>/extensions/cratylus-persona-badge.ts` (per agent) |
| `--config` overlay      | `scopedRel(file, scope)` | —                                                         | `<scope>/omp.yml` (per agent)                              |
| launcher                | `scopedRel(file, scope)` | `personas/_session/claude-agent` (0755, ONE)              | `agent/omp-agent` (0755, ONE for every agent)              |
| status-line worker      | `scopedRel(file, scope)` | `personas/_session/cratylus-status-line.sh` (0755, ONE)   | —                                                          |

`<scope>` is `agent/` for the SESSION copy (a launch that names no agent) or
`agent/personas/<agent>/` for a projected agent — a directory omp scans for nothing, so what lands
there is reachable only from that agent's own `--config` overlay and never from a bare `omp`.

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
`description` on omp: omp's model-role alias for the held role, then omp's default role as the
fallback, so a host that never configured the role runs the agent on the default role
(`modelRoles.default`). An agent holding no role has no `model` key. Which model fills a role is the
host's `modelRoles` entry in `~/.omp/agent/config.yml` (or `config.yaml`, which omp reads only when
config.yml is absent).

**On Claude Code the definition names a tier, never a model version.** Claude Code has no
host-configurable role aliases: a definition's `model` takes an id, a tier alias or `inherit`. The
claude adapter therefore holds its own table from the held role to a tier alias, and an agent's
definition carries `model: <tier>` right after its `description`: `sonnet` for an implementer or
integrator, `opus` for a planner, assayer or architect. An agent holding any other role, or none, has
no `model` and runs on the session's model. The host's own choice outranks the definition: `--model`
on a `claude --agent` main session, and for a dispatched subagent
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` together with `CLAUDE_CODE_SUBAGENT_MODEL=<model>`.

## The harness adapter port

A harness adapter implements `HarnessAdapter` (`@cratylus/forge/harness-adapter`) and is selected by
name through `adapterByName`. The port is the whole of what projection and deploy ask of a harness;
neither knows a concrete harness.

| member                                              | what the harness says                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `substrate`, `home`, `agentExt`             | its canonical name, the substrate it realizes constraints on, its dot-directory and the extension its agent definitions carry      |
| `agentRel`, `skillRel`, `hooksFile`                 | where an agent definition, a skill and the hook config land, relative to the home                                                  |
| `agentDef`, `skillDef`, `hooks`                     | the render of an agent, a skill, and the hook registrations (`hooks` absent where the harness has no hook config)                  |
| `preloadsSkills`, `mainSessionSkillHook`            | whether a definition can name skills it preloads, and how a main session gets them where it cannot                                 |
| `nativeEvents`, `realizes`, `scopes`, `hookCommand` | the event map, whether an event can be realized and narrowed to one agent, and the command a deployed worker is invoked by         |
| `judgeBin`                                          | the CLI that answers a model question, or empty where the harness judges in-process                                                |
| `enforcingSurface`, `scopeActivatedSurface`         | the hook mechanism as code, for a harness whose hook surface is a program rather than a config file                                |
| `scopedRel`                                         | where a scoped artifact lands, per agent or for the session; it places an agent's stance manifest directly under `<root>/<agent>/` |
| `launchSurface`, `launcherFile`                     | the launch spec, and the launcher it emits in the session scope                                                                    |
| `statusLine`, `statusSegment`                       | where the badge shows on a status line that is one command, or on one that is a list of segments                                   |
| `roleRouting`                                       | how a held role routes to a model: its default role, the role nearest each held role, and the config files in read order           |

An event absent from `nativeEvents` is unrealizable on the harness, and projection reports it rather
than fabricating a binding. `scopes` is a stronger demand than `realizes`: firing is not scoping, and
an adapter must never answer yes for an event it cannot realize. `hookCommand` is written against
`$HOME`, not a resolved path, because it is read at run time on whatever host it lands on.

`scopedRel` places more than mechanism: the same per-scope map places the launch spec's overlay and
launcher, because both belong beside the modules they wire. A harness whose hook surface is a
program rather than a config file (omp: its loader scans an `extensions/` directory, or a directory
named in a launch spec's `--config` overlay) has no fragment to merge, so its adapter implements
`scopeActivatedSurface` and `launchSurface`, and the projection stages one artifact per scope for
deploy to place. The map must place an agent's manifest directly under `<root>/<agent>/`, keeping its
scope-relative path, because the workers derive that root from it (`personaRootOf`, bound into a hook
worker's template as the `harness-persona-root` fact).

`launchSurface` takes the composed agents, each once, because on omp the identity a launch carries
includes what the operator sees of it: the badge, one `cratylus-persona-badge.ts` module per agent in
that agent's own `extensions/`, whose text is baked at projection from the agent's mark and name.
Claude's badge is a text file per agent beside one session-scoped status-line worker, which
`statusLine` declares (`file`, and the `command` that runs it, written against `$HOME`). A harness
whose status line is a list of segments declares `statusSegment` instead: the host config files that
hold the layout, the segment an extension's status renders in, the layout in effect when the host
names no preset, and the left list the `custom` preset falls back to. How the badge is made to show
is install's, and the `cratylus` README holds it.

`roleRouting` is optional: claude leaves it absent, since it has no host role map to seed. omp's
offers `default`, `smol`, `slow`, `plan` and `task`, and names `task` the nearest role to an
implementer or integrator, `plan` to a planner, and `default` to any other. Install reads the held
roles off the projected agents and inserts the `modelRoles` entries the host lacks from it, and
[the `cratylus` README](../cli/README.md) holds that.

## Where the boundaries are

Three concerns look adjacent to this pipeline and are deliberately outside it.

**Delivery is npm's.** Getting `@cratylus/forge` and the plugin packages onto a machine is an
ordinary package install. It is a _precondition_ of the pipeline, not a stage of it — `init` cannot run
before the CLI exists.

**Projection is local.** `deploy` writes to a harness root (`.claude/` or `.omp/`) on the machine it
runs on. It has no transport, no host list, and no remote mode.

**Running it across many hosts is yours.** Iterating a fleet is an outer loop _around_ the whole
pipeline, and it is a site-specific concern rather than a feature of this tool. The loop ssh's to each
host, installs the packages, and runs the ordinary local sequence there. `forge` is the body of
that loop, not the loop.

## Library surface

The CLI is a thin shell over exported functions. The subpaths that back the pipeline:

```ts
import { defineConfig, loadConfig, addPlugin } from '@cratylus/forge/config';
import { resolve } from '@cratylus/forge/resolve';
import { projectPluginSet } from '@cratylus/forge/project';
import { deploySingle, userScope, projectScope } from '@cratylus/forge/deploy';
import { adapterByName } from '@cratylus/forge/adapters/registry';
```

`adapterByName` is the single selection point for a harness adapter — `'claude'` or `'omp'` — so a
consumer depends on the adapter port and this selector rather than on a concrete harness module.
Plugin authors also want [`@cratylus/schema`](../schema/README.md), which holds the cell types and
`defineAgentPlugin`. They are no longer forge's, and importing them from the projector was the
inversion `schema` exists to end; `@cratylus/forge/resolve` re-exports `AgentPlugin` and
`defineAgentPlugin` only so the resolver stays addressable through one place.

The other subpaths are `./harness-adapter` (the port and its staging constants), `./catalog` (the
fragment catalogs of a plugin set), `./validate` (the doctrine-free acceptance algorithm, whose data
the corpus injects), `./module-scan`, `./adapters/*` (each harness adapter) and `./cli` (the
projector's Commander commands, which [`cratylus`](../cli/README.md) adds to its own program).

## License

MIT © Lance Caraccioli — see [LICENSE](../../LICENSE).
