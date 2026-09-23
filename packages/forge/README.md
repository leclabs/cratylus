# @cratylus/forge

The build core for [cratylus](../../README.md).

Agents, skills, and hooks are **authored** as typed TypeScript cells inside plugin packages. A project
declares which plugins it extends; `forge` resolves that set into one merged canon and projects it
into harness artifacts on the local machine.

The direction matters. The canon is the source; `~/.claude/` is a projection of it. Nothing in this
pipeline reads a harness's existing configuration and treats it as truth.

## The pipeline

```text
init → add → compose → project → deploy
```

| Stage     | What it does                                                                   |
| --------- | ------------------------------------------------------------------------------ |
| `init`    | scaffolds `cratylus.config.ts` in the project root, extending the canon plugin |
| `add`     | wires another plugin package into that config's `extends`                      |
| `compose` | resolves the plugin set into one merged fragment set, and prints it            |
| `project` | renders the resolved set into a render tree (`.render/`)                       |
| `deploy`  | places the render tree into the local `.claude/` root                          |

Projection goes from composed cells to harness artifacts **directly**. The claude and codex harness
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
  --hooks-dir  .render       # place into ~/.claude
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

Materializes the resolved set into a render tree: `agents/`, `skills/`, `hooks/`, and a `settings.json`
carrying the hook registrations. Skills that need a runtime companion get their shim emitted alongside
them.

```
cratylus project [--config <path>] [--out <dir>] [--harness claude|codex]
```

Defaults: config `<cwd>/cratylus.config.ts`, out `<cwd>/.render`, harness `claude`. On success it prints
the counts it wrote and the exact `deploy` invocation that ships them.

```
cratylus project --out ./build --harness codex
```

### `cratylus deploy`

Places an already-projected render tree into the **local** `.claude/` root. Agent definitions and skill
directories are copied; `settings.json` hook registrations are merged into any existing file rather
than replacing it. Each deployed agent also gets its memory layers seeded, and existing layers are left
untouched.

```
cratylus deploy --agents-dir <dir> --skills-dir <dir> --hooks-dir <dir>
```

| Option               | Effect                                                   |
| -------------------- | -------------------------------------------------------- |
| `--agents-dir <dir>` | render tree `agents/` — the projected definitions        |
| `--skills-dir <dir>` | render tree `skills/` — the projected skill directories  |
| `--hooks-dir <dir>`  | render tree hooks root (`settings.json` + `hooks/<id>/`) |
| `--kind <kind>`      | `agent` \| `skill` \| `hooks` \| `all` (default `all`)   |
| `--scope <scope>`    | `user` \| `project` (default `user`)                     |
| `--home <dir>`       | user-scope `.claude` parent, instead of `~`              |
| `--project <dir>`    | project root for `--scope project` (default cwd)         |
| `--only <names>`     | comma-separated names to deploy                          |
| `--assets <decls>`   | committed skill companions, `<skill>=<spec>[,…]`         |
| `--dry-run`          | print the actions and change nothing                     |

Which directories are required depends on `--kind`: `all` requires all three, `hooks` requires only
`--hooks-dir`, and `agent` or `skill` require `--agents-dir` and `--skills-dir`. Passing less is a
refusal, not a partial run.

#### The destinations are the adapter's, not the render tree's

A render tree is forge's own STAGING layout — `agents/<name><ext>`, `skills/<name>/`,
`hooks/<id>/`, `enforcing/<scope>/` — and it is deliberately not any harness's layout. Deploy asks the
adapter where each artifact belongs:

| Artifact                   | Port op                  | claude / codex                 | omp                                                   |
| -------------------------- | ------------------------ | ------------------------------ | ----------------------------------------------------- |
| agent definition (persona) | `agentRel(name)`         | `agents/<name><ext>`           | `agent/agents/<name>.md`                              |
| skill directory            | `skillRel(name, agents)` | `skills/<name>`                | `../.agents/skills/<name>` (one copy — read natively) |
| hook registration          | `hooksFile` (merged)     | `settings.json` / `hooks.json` | — (no hook config exists)                             |
| scoped mechanism module    | `scopedRel(file, scope)` | —                              | `<scope>/extensions/<file>`                           |
| `--config` overlay         | `scopedRel(file, scope)` | —                              | `<scope>/omp.yml` (per persona)                       |
| launcher                   | `scopedRel(file, scope)` | —                              | `agent/omp-agent` (0755, ONE for every persona)       |

`<scope>` is `agent/` for the SESSION copy (a launch that names no persona) or
`agent/personas/<agent>/` for a projected persona — a directory omp scans for nothing, so what lands
there is reachable only from that persona's own `--config` overlay and never from a bare `omp`.

**The definition is the single source of truth.** `~/.omp/agent/agents/<name>.md` is omp's USER-level
task-agent root: YAML front-matter carrying the `name` and `description` omp requires, and a body that
IS the system prompt. Dispatched as a subagent, omp reads it natively. Launched as a MAIN session —
for which omp has no `--agent` flag at all — `omp-agent <name>` (or a symlink named after the agent,
busybox-style) reads the same bytes, prepends the identity assertion omp's own base prompt would
otherwise win, appends any `autoloadSkills` as required reading, and hands the result to
`--append-system-prompt`. One definition, two readers, nothing to drift — and ONE launcher on the
host rather than one per agent.

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

`scopedRel` (renamed from `enforcingRel`) places more than mechanism now: the SAME per-scope map also
places the launch spec's overlay and launcher, because both belong beside the modules they wire, not in
a directory of their own. A harness whose hook surface is a PROGRAM rather than a config file (omp: its
loader scans an `extensions/` dir, or a directory named in a launch spec's `--config` overlay) has no
fragment to merge, so its adapter implements `scopeActivatedSurface` and `launchSurface`, and the
projection stages one artifact per scope for deploy to place.

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

**Projection is local.** `deploy` writes to a `.claude/` root on the machine it runs on, resolved from
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

`adapterByName` is the single selection point for a harness adapter — `'claude'` or `'codex'` — so a
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
