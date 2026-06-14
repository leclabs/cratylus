# koine (cli) — agent conventions

`@leclabs/koine`: the `koine` command — the user-facing orchestrator. The thin layer that wires the
`core` engine to the `adapters` and exposes them as subcommands. Depends on both siblings; nothing depends
on it.

## Wiring (`src/index.ts`)

Built on **cac**. `src/index.ts` declares every subcommand and its options, then dispatches to a
`runX` handler in `src/commands/`. Two facts that bite:

- **The adapter set is hardwired here.** `src/index.ts` imports all 10 adapters and builds the `adapters[]`
  array passed into every command. Adapters are **not** auto-discovered — a new adapter must be added to
  this array (and registered as a subpath export in `@leclabs/koine-adapters`).
- **Commands `process.exit()` with a meaningful code** — they don't just return. The exit-code contract is
  load-bearing for CI/scripting: `0` success · `1` generic · `2` validation/IO (lint, missing manifest) ·
  `3` drift (when `drift_check: error`) · `4` lossy under `--strict`.

## Commands (`src/commands/`)

One file per verb: `init` (bootstrap `.koine/`), `import <client>` (lift a client config into IR;
`--merge` preserves hand-edits), `compile [...clients]` (IR → targets; `--dry-run` / `--strict` /
`--explain`), `diff`, `lint` (`--strict` promotes capability warnings to errors), `adapters` (capability
matrix), `events` (`--client <id>` for per-adapter mapping), `doctor` (diagnose install/manifest/drift),
`watch` (chokidar, ~300ms debounce), `migrate` (`--from`/`--to` IR schema versions).

Default `--scope` is `project` for every command.

## Environment

`KOINE_HOME` (override `~/.koine/`), `KOINE_CONFIG` (per-invocation manifest path), `KOINE_LOG_LEVEL`
(`error|warn|info|debug`).

## Conventions

- All orchestration logic that isn't CLI-shaped belongs in `core`'s engine, not here. The CLI parses args,
  calls the engine/adapters, formats output, and picks the exit code — nothing more.
- Tests (`test/`) exercise commands end-to-end against a temp `.koine/`; keep the exit-code contract under
  test when you touch a command.
