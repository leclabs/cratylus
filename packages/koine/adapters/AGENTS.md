# koine-adapters — agent conventions

`@leclabs/koine-adapters`: the 10 official client adapters, one per dialect. Each is a separate **subpath
export** (`@leclabs/koine-adapters/<id>`) so a consumer's bundler tree-shakes to only the adapters it
imports. Depends on `@leclabs/koine-core` for the `Adapter` contract and IR types; nothing depends on it
except `cli`.

## The adapters (`src/<id>/`)

| id         | resource coverage         | hooks (of 28) | shape                                                                      |
| ---------- | ------------------------- | ------------- | -------------------------------------------------------------------------- |
| `claude`   | all 8 (reference adapter) | 19            | `events.ts` + `paths.ts` + `read.ts` + `write.ts`                          |
| `cursor`   | rich                      | 17            | events/paths/read/write                                                    |
| `opencode` | rich                      | 13            | events/paths/read/write — hooks via JS shim plugin + YAML sidecar          |
| `gemini`   | mid                       | 10            | events/paths/read/write — `Before/After Agent/Model` event flavor          |
| `copilot`  | mid                       | 8             | events/paths/read/write — reads `.claude/settings.json` natively for hooks |
| `codex`    | mid                       | 6             | events/paths/read/write — TOML config, Bash-only matchers in practice      |
| `cline`    | rules+                    | 8             | single `index.ts` — multi-file rules in `.clinerules/`                     |
| `crush`    | rules+skills+mcp          | 0             | single `index.ts`                                                          |
| `continue` | rules+mcp                 | 0             | single `index.ts` — `.continue/config.yaml`                                |
| `aider`    | rules only                | 0             | single `index.ts` — **smallest; the worked tutorial example** (~70 lines)  |

The richer adapters split into `events.ts` / `paths.ts` / `read.ts` / `write.ts`; the trivial ones are a
single `index.ts`. Each `src/<id>/index.ts` exports `<id>Adapter` (and a default).

## Authoring rules

- An adapter is a pure implementation of the `core` `Adapter` contract: `detect` / `read` / `write` +
  a declared `capabilities` object. State lives in the filesystem; same input → same output.
- **Declare support honestly.** Set each resource to `full`/`partial`/`none` and push unsupported items to
  `WriteReport.skipped` with a `warnings` line — never drop silently. The engine and the CLI's `--explain`
  surface exactly what you declare. `aider`'s `write` is the canonical pattern: write what's supported,
  warn+skip the rest.
- **Every adapter has a round-trip test** (`test/<id>/round-trip.test.ts`): `read(write(ir))` must recover
  the supported subset. This is the acceptance gate for an adapter — add the test with the adapter.
- New adapters must be **registered in the CLI** — `cli/src/index.ts` hardwires the adapter array; the set
  is not auto-discovered. Adding one means editing that array (and the subpath export in `package.json`).

See `../core/docs/writing-an-adapter.md` for the full walkthrough.
