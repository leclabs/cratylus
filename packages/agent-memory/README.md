# episodic

Build-only **toolsource** for the `episodic` memory tool — bundled into the `memory`
skill and deployed to every host (`plans/memory-tool-bundling`). **Not** a published
library: zero importers, zero runtime dependencies. `tsup` bundles `src/bin.ts` into a
single self-contained `dist/episodic.mjs` that the `memory` skill carries to each host.

## The tool

`src/bin.ts` (shebang) → `node episodic.mjs <command>`:

- `encode --home <agent-home> [--scope user|project:<key>] (--body <text> | --body-json <json> | --body -)`
  — mint a ULID, build one open record, append it to `<agent-home>/EPISODIC.jsonl`. The ENCODE affordance.
- `read [--home <dir>] [--count]` — read the store back (raw records, or just the count).
- `migrate <src.md> <dest.jsonl>` — convert a legacy markdown `EPISODIC.md` to the JSONL store,
  no-loss gated (round-trip + independent line-coverage). Never deletes the source.

Host invocation (the deployed bundle loses its +x bit over scp, so run via `node`):

```bash
node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/<name> --scope user --body '…'
```

## The record

```jsonc
{ "id": "<ULID>", "scope": "user" | "project:<key>", "path": "<scope-relative>", "body": <open> }
```

- **`id`** — a ULID: 48-bit ms timestamp + 80-bit randomness, Crockford base32, strictly monotonic
  within a millisecond. Lines sort by mint time lexicographically.
- **`scope`** — single-valued. `user` travels with the agent; `project:<key>` stays with the project.
- **`path`** — scope-relative (defaults to `EPISODIC.jsonl`); never an absolute home, never a hash —
  both would break portability, so the same `(scope, path)` resolves per host.
- **`body`** — any JSON value. Captured cheap and open; the Dreamer routes it later.

## Build

`pnpm --filter episodic build` → `dist/episodic.mjs` (gitignored). The `memory` skill's `bundle:`
front-matter stages this artifact at deploy; the pipeline runs the build before `resolve.py`.

The build-spec for the store semantics (record shape, routing, portability) is the corpus:
`packages/agent-anatomy` — the `memory` and `dream` cells.
