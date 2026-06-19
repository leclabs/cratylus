# @leclabs/koine

The universal configuration translator for AI coding agents — part of [polis](../../README.md). Author
agent config once in a canonical IR, compile it to every client dialect (Claude Code, Codex, Cursor, …),
and lift any client's existing config back into the IR.

One package, three surfaces:

- **the library** (`@leclabs/koine` / `@leclabs/koine/core`) — the IR types + JSON Schema, the engine
  (read / merge / compile / drift / migrate), validators, serializers, and the **Adapter contract**;
- **the adapters** (`@leclabs/koine/adapters/<client>`) — 10 official adapters, one per client dialect,
  each its own subpath export;
- **the CLI** (`koine`) — the user-facing orchestrator.

## Install

```bash
npm install -g @leclabs/koine     # the CLI
npm install @leclabs/koine        # the library + adapters
```

## Library use

```ts
import { compile, readIR } from '@leclabs/koine'; // or '@leclabs/koine/core'
import { claudeAdapter } from '@leclabs/koine/adapters/claude';
```

## Quick start (CLI)

```bash
cd ~/myproject
koine init                  # creates .koine/
koine import claude         # lifts ~/.claude/ + ./.claude/ + ./CLAUDE.md into IR
koine compile               # compiles to all targets in manifest
```

## Commands

### `koine init`

Bootstraps a new `.koine/` directory with empty resource folders and a stub manifest.

```
koine init [--scope user|project|local]
```

### `koine import <client>`

Reads an existing client's config and lifts it into the IR.

```
koine import claude
koine import opencode --merge       # preserve hand-edited IR resources
koine import codex --from /other/repo
```

### `koine compile [...clients]`

Compiles the IR to the listed clients (or all targets in `manifest.yaml` if none given).

```
koine compile                       # all manifest targets
koine compile claude opencode
koine compile --dry-run --explain   # preview lossy translations
koine compile --strict              # abort on any warning
```

### `koine diff [...clients]`

Shows what would change on next compile, plus drift on already-emitted files.

```
koine diff claude
```

### `koine lint`

Validates the IR against schema and checks resource compatibility against declared targets.

```
koine lint
koine lint --strict                 # capability warnings → errors
```

### `koine adapters`

Lists installed adapters and their per-resource capabilities.

### `koine events [--client <id>]`

Lists the canonical event taxonomy. With `--client`, shows the per-adapter mapping (✓ supported, — absent).

```
koine events                        # all 28 canonical events
koine events --client cursor        # shows 17 cursor mappings + 11 absent
```

### `koine doctor`

Diagnoses installation: IR presence, manifest validity, compile state, per-target detection, drift.

### `koine watch [...clients]`

Auto-recompiles on IR changes (chokidar, ~300ms debounce). Ctrl-C to exit.

```
koine watch
koine watch --debounce 100
```

### `koine migrate`

Applies IR schema migrations between versions.

```
koine migrate                       # use manifest's current version → latest
koine migrate --from 1 --to 2
```

## Exit codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| 0    | Success                                        |
| 1    | Generic error                                  |
| 2    | Validation/IO failure (lint, missing manifest) |
| 3    | Drift detected (when `drift_check: error`)     |
| 4    | Lossy translation under `--strict`             |

## Environment variables

| Variable          | Effect                                |
| ----------------- | ------------------------------------- |
| `KOINE_HOME`      | Override `~/.koine/` location         |
| `KOINE_CONFIG`    | Override per-invocation manifest path |
| `KOINE_LOG_LEVEL` | `error \| warn \| info \| debug`      |

## License

MIT © leclabs
