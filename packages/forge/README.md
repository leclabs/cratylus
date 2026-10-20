# @cratylus/forge

The build core for [cratylus](../../README.md): it resolves a plugin set into one merged set of
cells, renders that set into the files a harness reads, and installs them.

This README is for whoever works on the library, or on an adapter for a harness. What an operator
does with the `cratylus` command — install and its flags, the practices, starting a session as an
agent, the badge, uninstall — is [the `cratylus` README](../cli/README.md)'s, which documents each
command to match its `--help`.

Agents, skills, and hooks are typed TypeScript cells inside plugin packages. `forge` resolves a
plugin set into one merged canon, projects it into harness artifacts, and `install` places them on
the local machine.

The direction matters. The canon is the source; OMP's home (`~/.omp/`) is a projection of it.
Nothing in this pipeline reads a harness's existing configuration and treats it as truth.

## The pipeline

```text
resolve → project → install
```

| Stage     | What it does                                                                                  |
| --------- | --------------------------------------------------------------------------------------------- |
| `resolve` | resolves the plugin set into one merged fragment set                                          |
| `project` | renders the resolved set into a render tree, in memory (`projectPluginSet`)                   |
| `install` | places the render tree as the owned root and refers OMP's home into it, user or project scope |

Projection goes from composed cells to OMP artifacts directly, through forge's adapter port. The
plugin set `install` projects is the corpus the `cratylus` command is built with.

## Rendering a tree

`projectPluginSet` materializes the resolved set into a render tree: `agents/`, `skills/`, and
`hooks/`. OMP hook modules are emitted under `enforcing/<scope>/`; skills that need a runtime
companion get their shim emitted alongside them. A shim forwards its arguments to
`cratylus <capability>` with the caller's environment, and it needs no session from any harness.

### A render may name practices

A plugin declares **practices** (`AgentPlugin.practices`): ways of working an install offers as one
choice, each naming the agents it installs and any skills no agent carries, beside the **plumbing**
(`AgentPlugin.plumbing`) every practice is installed with and none is offered as. `projectPluginSet`
renders the practices it is given (`ProjectOpts.practices`); named none, it renders every cell exactly
as a plugin set declaring no practice does, byte for byte. Given names, it renders the union of those
practices' agents, skills they declare and compose, and hooks declared by the chosen practices or
plugin plumbing. An empty list is refused: no practice is not every practice.

A chosen set must be closed under skill composition. Before anything is rendered, projection checks
that every skill an agent is given, with what that composes, is carried by the plugin set; a set
that is not is refused by one error naming the practice, the agent and the skill that is missing.
Whom an agent dispatches is never closed over (decision 0142). A name that is no declared practice
is refused, naming the declared ones. The tree
reports the declared practices (`ProjectedTree.practices`: name, description, whether preselected)
for an install to offer, whatever was rendered.

### An agent is given its skills' closure

An agent's `skills` are the names it declares; what projection gives it is their **closure** over
`composition`: the declared names first, then every skill they transitively compose, breadth-first in
each cell's declaration order, each name once. Each composed name is resolved against the set's
resolved skills, so a later plugin's same-name cell changes the closure, a name no plugin ships is
kept and not expanded, and a composition cycle terminates. The closure is computed once, before any
agent is rendered; every adapter renders the list it is handed.

OMP receives each agent's skill closure in `autoloadSkills`, which it preloads for a dispatched
subagent; for a main session started by `omp --agent <name>` the cratylus extension carries the same
skills' full instructions in every turn's system prompt.

### An agent's text, and the settings its reach and model bind to

An agent's text is rendered from its values: `# <mark> <name>` (the name alone without a mark), its
description, then one section per factor group in catalog order, each value as its anchor and gloss,
marked `(fixed)` where its level is fixed. Reach (perception-scope, action-scope) and model are never
text. On OMP the definition's front matter carries `model: "@<name>"`, the model role named for the
agent, and `spawns: "*"`: every agent keeps omp's default tools and may dispatch any agent
(decision 0142). `key: null` reserves the key of an ipseic agent. The tree reports each agent's tier
and effort (`ProjectedTree.agentModels`), from which each declaration's model falls back to after
its own role.

## How install places a tree

A render tree is placed WHOLE as the owned root, `~/.cratylus/<harness>/` at user scope and
`<project>/.cratylus/<harness>/` at project scope (`deploy/owned-root.ts`): agents under `agents/`,
skills under `skills/`, extension modules under `extensions/`, hook workers under `hooks/`, a
`package.json` naming the modules (`omp.extensions`) and recording the version that projected it,
`runtime.json` where the corpus configures a capability, and `installation.json`, the record of
every reference placed outside the root and every host-file edit. The harness's own surfaces only
refer into it (`linkOwnedRoot`: for omp, a link in `~/.omp/plugins/node_modules` and a dependency
entry in `~/.omp/plugins/package.json`), so uninstall (`unlinkOwnedRoot`, then the root) removes
exactly those, each found from where it points into the root rather than from the record, so none
is left dangling when the root or its record was edited or removed. An installation from before the
owned root is taken back by its deploy manifest (`removeEarlierInstallation`), what it placed
before digests were recorded included.

Model routing is host configuration, not a placed artifact: a declaration names its own role first,
then its tier and effort (decision 0111), and is never rendered with a model. Which model a tier or
a persona's role runs on is the operator's choice (decision 0112): `install` asks for each the host
does not bind and writes the answer into the host's `modelRoles` as the host's own entry, recorded
in no installation record, so upgrade and uninstall keep it; an earlier installation's seeded
entries stay the same way.

### The destinations are the adapter's, not the render tree's

A render tree is forge's staging layout — `agents/<name><ext>`, `skills/<name>/`, `hooks/<id>/` and
scoped artifacts under `enforcing/<scope>/`. It is deliberately not the harness's layout. Install
asks the adapter where each artifact belongs:

| Artifact                        | Port op                  | OMP                            |
| ------------------------------- | ------------------------ | ------------------------------ |
| agent definition                | `agentRel(name)`         | `agent/agents/<name>.md`       |
| skill directory                 | `skillRel(name, agents)` | `../.agents/skills/<name>`     |
| hook module                     | `hooksFile`              | generated extension module     |
| scoped mechanism module         | `scopedRel(file, scope)` | `agent/extensions/<file>`      |
| capability and `--agent` module | `scopedRel(file, scope)` | `agent/extensions/cratylus.ts` |

OMP has one scope, the session's: omp loads `agent/extensions/` in every session and cannot load a
module for one agent alone, so `scopes` answers no for every event, and an enforcing value bound to
agents degrades to a steer, reported as a hook omp cannot scope per agent. Nothing is placed under
`agent/personas/`; a reinstall prunes what an earlier install recorded there, and uninstall removes
it.

**The definition is the single source of truth.** OMP reads `agent/agents/<name>.md` when it
dispatches an agent as a subagent, and `omp --agent <name>` resolves the same declaration through
omp's own discovery to start it as a main session, through the cratylus extension, holding the whole
declaration as dispatch resolves it for a child: its text, model, effort, `autoload-skills`,
`read-summarize`, `advisor` and `prewalk`, and no default personality. Where omp's own dispatch drops
what the declaration says, launch holds what it says — a known omp limitation: `read-summarize: true`
turns summarised reads on (omp's dispatch applies only `false`). One definition, no launcher, nothing
to drift. Every turn carries the handover form of each agent that takes a typed one. The
extension records nothing of a dispatch or its return.

## The harness adapter port

A harness adapter implements `HarnessAdapter` (`@cratylus/forge/harness-adapter`) and is selected by
name through `adapterByName`. OMP is the current implementation; projection and install depend on the
port, not on OMP's concrete rendering functions.

| member                                              | what the harness says                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `name`, `substrate`, `home`, `agentExt`             | its canonical name, substrate, dot-directory and agent-definition extension                 |
| `agentRel`, `skillRel`, `hooksFile`                 | where an agent, skill and hook module land, relative to the harness home                    |
| `agentDef`, `skillDef`, `hooks`                     | how an agent, skill and hook registration are rendered                                      |
| `preloadsSkills`, `mainSessionSkillHook`            | whether an agent definition preloads skills and how a main session gets them                |
| `nativeEvents`, `realizes`, `scopes`, `hookCommand` | the event map, supported events, narrowing and worker invocation                            |
| `enforcingSurface`, `scopeActivatedSurface`         | the emitted hook surface when OMP loads extension code rather than a settings fragment      |
| `scopedRel`                                         | where a scoped artifact lands for an agent or the session                                   |
| `launchSurface`                                     | what is composed from the agents beyond their definitions (OMP's dispatch isolation module) |
| `capabilitySurface`                                 | the capability tools, and on OMP the `--agent` flag that starts a session as an agent       |
| `statusSegment`                                     | how a session's agent appears in OMP's segmented status line                                |

An event absent from `nativeEvents` is unrealizable, and projection reports it rather than
fabricating a binding. `scopes` is a stronger demand than `realizes`: firing is not scoping, and an
adapter must never answer yes for an event it cannot realize. `hookCommand` is written against
`$CRATYLUS_INSTALLATION`, not a resolved path, because it is read at runtime wherever its
installation lands; on OMP the session module sets that variable to its own root for every hook it
runs, so a project installation runs its own workers.

`scopedRel` places a scoped module in its scope's `extensions/` directory, and on OMP every scope is
the session's. `launchSurface` receives
the composed agents once.

## Where the boundaries are

Three concerns look adjacent to this pipeline and are deliberately outside it.

**Delivery is npm's.** Getting `cratylus` and the packages it composes onto a machine is an
ordinary package install. It is a _precondition_ of the pipeline, not a stage of it.

**Placement is local.** `install` writes to the machine it runs on. It has no transport, no host
list, and no remote mode.

**Running it across many hosts is yours.** Iterating a fleet is an outer loop _around_ the whole
pipeline, and it is a site-specific concern rather than a feature of this tool. The loop ssh's to each
host, installs the package, and runs `cratylus install` there. `forge` is the body of that loop, not
the loop.

## Library surface

The command is a thin shell over exported functions. The subpaths that back the pipeline:

```ts
import { projectPluginSet } from '@cratylus/forge/project';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectorCommands } from '@cratylus/forge/cli';
```

`adapterByName` is the single selection point for a harness adapter. OMP is its one implementation;
consumers depend on the adapter port and selector rather than on concrete rendering functions.
The cell types and `defineAgentPlugin` are [`@cratylus/schema`](../schema/README.md)'s. They are
no longer forge's, and importing them from the projector was the
inversion `schema` exists to end.

The other subpaths are `./harness-adapter` (the port and its staging constants), `./catalog` (the
fragment catalogs of a plugin set), `./module-scan` and `./adapters/omp` (the OMP adapter).

## License

MIT © Lance Caraccioli — see [LICENSE](../../LICENSE).
