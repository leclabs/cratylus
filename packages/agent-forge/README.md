# @leclabs/agent-forge

The universal configuration translator for AI coding agents — part of [polis](../../README.md). Author
agent config once in a canonical IR, compile it to every client dialect (Claude Code, Codex, Cursor, …),
and lift any client's existing config back into the IR.

One package, three surfaces:

- **the library** (`@leclabs/agent-forge` / `@leclabs/agent-forge/core`) — the IR types + JSON Schema, the engine
  (read / merge / compile / drift / migrate), validators, serializers, and the **Adapter contract**;
- **the adapters** (`@leclabs/agent-forge/adapters/<client>`) — 10 official adapters, one per client dialect,
  each its own subpath export;
- **the CLI** (`agent-forge`) — the user-facing orchestrator.

## Install

```bash
npm install -g @leclabs/agent-forge     # the CLI
npm install @leclabs/agent-forge        # the library + adapters
```

## Library use

```ts
import { compile, readIR } from '@leclabs/agent-forge'; // or '@leclabs/agent-forge/core'
import { claudeAdapter } from '@leclabs/agent-forge/adapters/claude';
```

## Quick start (CLI)

```bash
cd ~/myproject
agent-forge init                  # creates .agent-forge/
agent-forge import claude         # lifts ~/.claude/ + ./.claude/ + ./CLAUDE.md into IR
agent-forge compile               # compiles to all targets in manifest
```

## Commands

### `agent-forge init`

Bootstraps a new `.agent-forge/` directory with empty resource folders and a stub manifest.

```
agent-forge init [--scope user|project|local]
```

### `agent-forge import <client>`

Reads an existing client's config and lifts it into the IR.

```
agent-forge import claude
agent-forge import opencode --merge       # preserve hand-edited IR resources
agent-forge import codex --from /other/repo
```

### `agent-forge compile [...clients]`

Compiles the IR to the listed clients (or all targets in `manifest.yaml` if none given).

```
agent-forge compile                       # all manifest targets
agent-forge compile claude opencode
agent-forge compile --dry-run --explain   # preview lossy translations
agent-forge compile --strict              # abort on any warning
```

### `agent-forge diff [...clients]`

Shows what would change on next compile, plus drift on already-emitted files.

```
agent-forge diff claude
```

### `agent-forge lint`

Validates the IR against schema and checks resource compatibility against declared targets.

```
agent-forge lint
agent-forge lint --strict                 # capability warnings → errors
```

### `agent-forge adapters`

Lists installed adapters and their per-resource capabilities.

### `agent-forge events [--client <id>]`

Lists the canonical event taxonomy. With `--client`, shows the per-adapter mapping (✓ supported, — absent).

```
agent-forge events                        # all 28 canonical events
agent-forge events --client cursor        # shows 17 cursor mappings + 11 absent
```

### `agent-forge doctor`

Diagnoses installation: IR presence, manifest validity, compile state, per-target detection, drift.

### `agent-forge watch [...clients]`

Auto-recompiles on IR changes (chokidar, ~300ms debounce). Ctrl-C to exit.

```
agent-forge watch
agent-forge watch --debounce 100
```

### `agent-forge migrate`

Applies IR schema migrations between versions.

```
agent-forge migrate                       # use manifest's current version → latest
agent-forge migrate --from 1 --to 2
```

### `agent-forge optimize <source>`

The exemplify leg of the documented **import → optimize → compile** flow: turn
raw human-register context (a verbose `CLAUDE.md`, rule prose, an agent
description) into reader=LLM artifacts, gated and ledgered.

Optimization is **opt-in** — `compile` never runs it implicitly, and the raw
compile path stays byte-verbatim. The semantic stages (conceptualize →
signify → materialize) are LLM passes: the operating agent authors them into
a **plan** file — `{ "concepts": [{ "gloss", "anchor", "home" | "delta" }],
"artifacts": [{ "path", "body" }] }` — and this command is the mechanical
frame that judges it: the accept gate (`REC ≽` — every routed anchor carried
by its home; `minimal` — one name ⇔ one concept; `conform` — a human-register
emission is refused), then the R3 routing manifest
(`.manifests/<source>.json`) in which every concept appears exactly once in
`routes[]`/`delta[]` — a withheld concept refuses loudly. Re-running over
accepted output is a no-op: all-`reuse` routes, empty delta, byte-identical
artifacts.

```
agent-forge optimize CLAUDE.md --plan plan.json               # gate + emit ./optimized
agent-forge optimize CLAUDE.md --plan plan.json --out out2 \
  --prior .manifests/CLAUDE.md.json                           # idempotent re-run
```

Missing `--plan` is a refusal, never a default. Library surface:
`optimize` / `exemplify` / `checkCoverage` / `optimizeRules` (rules are
first-class through the pipeline; scoping metadata is never rewritten),
`renderSkillCell` (prose procedure → formal skill cell), `elevateAgent`
(step-1 persona → 24-organ vector with provenance traces and `ELICIT:`
markers at silent organs), and `projectVector` (the pinned organ-vector →
config-IR agent projection).

## Exit codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| 0    | Success                                        |
| 1    | Generic error                                  |
| 2    | Validation/IO failure (lint, missing manifest) |
| 3    | Drift detected (when `drift_check: error`)     |
| 4    | Lossy translation under `--strict`             |

## Environment variables

| Variable                | Effect                                |
| ----------------------- | ------------------------------------- |
| `AGENT_FORGE_HOME`      | Override `~/.agent-forge/` location   |
| `AGENT_FORGE_CONFIG`    | Override per-invocation manifest path |
| `AGENT_FORGE_LOG_LEVEL` | `error \| warn \| info \| debug`      |

## License

MIT © leclabs
