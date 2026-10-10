# @cratylus/forge

The build core for [cratylus](../../README.md): it resolves the plugins a project extends into one
merged set of cells and renders that set into the files a harness reads.

This README is for the author of a corpus, or of an adapter for a harness, who works against the
library. What every package is for is [ARCHITECTURE.md](../../ARCHITECTURE.md)'s. What a consumer does
with the `cratylus` command — install and its flags, the practices, starting a session as an
agent, the badge, uninstall — is [the `cratylus` README](../cli/README.md)'s, which documents each
command to match its `--help`.

Agents, skills, and hooks are **authored** as typed TypeScript cells inside plugin packages. A project
declares which plugins it extends; `forge` resolves that set into one merged canon and projects it
into harness artifacts on the local machine.

The direction matters. The canon is the source; OMP's home (`~/.omp/`) is a projection of it.
Nothing in this pipeline reads a harness's existing configuration and treats it as truth.

## The pipeline

```text
init → add → compose → project → deploy
```

| Stage     | What it does                                                               |
| --------- | -------------------------------------------------------------------------- |
| `init`    | scaffolds `cratylus.config.ts` in the project root, extending a plugin     |
| `add`     | wires another plugin package into that config's `extends`                  |
| `compose` | resolves the plugin set into one merged fragment set, and prints it        |
| `project` | renders the resolved set into a render tree (`.cratylus/omp`)              |
| `deploy`  | places the render tree into OMP's home (`.omp/`), at user or project scope |

Projection goes from composed cells to OMP artifacts directly, through forge's adapter port.

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

A chosen set must be closed. Before anything is rendered, projection checks that every role an agent
dispatches (`Agent.dispatches`, matched by anchor against `Agent.holds`) is held by an agent of the
set or supplied natively by the adapter (`nativeAgents`), and that every skill it is given, with
what that composes, is carried by the plugin set; a set that is not is refused by one error naming
the practice, the agent, and the role or skill that is missing. A name that is no declared practice
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
marked `(fixed)` where its level is fixed. Reach (perception-scope, action-scope, handoffs) and model
are never text: they bind to the harness's settings. On OMP the definition's front matter carries
`model: "@<name>"`, the model role named for the agent; `spawns`, the agents its handoffs name, each
mapped through the adapter's `nativeAgents` (`researcher` → `scout`), and `""` for an agent that
hands off to no one; and, only for an agent that changes nothing (`Agent.readOnly`), `tools` listing
omp's reading tools alone. Every other agent keeps omp's default tools. `key: null` reserves the key
of an ipseic agent. The tree reports each agent's tier and effort (`ProjectedTree.agentModels`), from
which install binds its model role.

## How deploy places a tree

`deploySingle` places one kind (agents, skills or hooks) of an already-projected render tree into the
local OMP home. Agent definitions land under `agent/agents/`; skills land in the vendor-neutral
`~/.agents/skills` tree that OMP reads natively. OMP hook registrations are emitted as extension
modules, not merged into a settings file.

Deploy stops at the agent, skill and hook destinations (and the runtime config). Model routing is
host configuration, not a deployed artifact, and `deploy` never writes it.

### The destinations are the adapter's, not the render tree's

A render tree is forge's staging layout — `agents/<name><ext>`, `skills/<name>/`, `hooks/<id>/` and
scoped artifacts under `enforcing/<scope>/`. It is deliberately not the harness's layout. Deploy
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
agents degrades to a steer, reported as a guard omp cannot scope per agent. Nothing is placed under
`agent/personas/`; a reinstall prunes what an earlier install recorded there, and uninstall removes
it.

**The definition is the single source of truth.** OMP reads `agent/agents/<name>.md` when it
dispatches an agent as a subagent, and `omp --agent <name>` resolves the same declaration through
omp's own discovery to start it as a main session, through the cratylus extension, holding the whole
declaration as dispatch resolves it for a child: its text, model, effort, `autoload-skills`,
`spawns`, `read-summarize`, `advisor` and `prewalk`, and no default personality. Where omp's own
dispatch drops what the declaration says, launch holds what it says — a known omp limitation: an
explicitly empty `spawns` with `task` among the `tools` is no one (omp's discovery reads it as `*`),
and `read-summarize: true` turns summarised reads on (omp's dispatch applies only `false`). One
definition, no launcher, nothing to drift.

## The harness adapter port

A harness adapter implements `HarnessAdapter` (`@cratylus/forge/harness-adapter`) and is selected by
name through `adapterByName`. OMP is the current implementation; projection and deploy depend on the
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
| `nativeAgents`                                      | the agents it supplies itself, by the handoff anchor each stands for                        |
| `launchSurface`                                     | what is composed from the agents beyond their definitions (OMP's dispatch isolation module) |
| `capabilitySurface`                                 | the capability tools, and on OMP the `--agent` flag that starts a session as an agent       |
| `statusSegment`                                     | how a session's agent appears in OMP's segmented status line                                |

An event absent from `nativeEvents` is unrealizable, and projection reports it rather than
fabricating a binding. `scopes` is a stronger demand than `realizes`: firing is not scoping, and an
adapter must never answer yes for an event it cannot realize. `hookCommand` is written against
`$HOME`, not a resolved path, because it is read at runtime on whatever host it lands on.

`scopedRel` places a scoped module in its scope's `extensions/` directory, and on OMP every scope is
the session's. `launchSurface` receives
the composed agents once.

## Where the boundaries are

Three concerns look adjacent to this pipeline and are deliberately outside it.

**Delivery is npm's.** Getting `@cratylus/forge` and the plugin packages onto a machine is an
ordinary package install. It is a _precondition_ of the pipeline, not a stage of it — `init` cannot run
before the CLI exists.

**Projection is local.** `deploy` writes to OMP's root (`.omp/`) on the machine it runs on. It has
no transport, no host list, and no remote mode.

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

`adapterByName` is the single selection point for a harness adapter. OMP is its one implementation;
consumers depend on the adapter port and selector rather than on concrete rendering functions.
Plugin authors also want [`@cratylus/schema`](../schema/README.md), which holds the cell types and
`defineAgentPlugin`. They are no longer forge's, and importing them from the projector was the
inversion `schema` exists to end; `@cratylus/forge/resolve` re-exports `AgentPlugin` and
`defineAgentPlugin` only so the resolver stays addressable through one place.

The other subpaths are `./harness-adapter` (the port and its staging constants), `./catalog` (the
fragment catalogs of a plugin set), `./validate` (the doctrine-free acceptance algorithm, whose data
the corpus injects), `./module-scan` and `./adapters/omp` (the OMP adapter).

## License

MIT © Lance Caraccioli — see [LICENSE](../../LICENSE).
