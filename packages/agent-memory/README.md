# episodic

Build-only **toolsource** for the `episodic` memory tool — bundled into the `memory`
skill and deployed to every host (`plans/memory-tool-bundling`). **Not** a published
library: zero importers, zero runtime dependencies. `tsup` bundles `src/bin.ts` into a
single self-contained `dist/episodic.mjs` that the `memory` skill carries to each host.

## The tool (scoped-memory-v2)

`src/bin.ts` (shebang) → `node episodic.mjs <command>`:

- `encode --home <agent-home> [--tags <a,b>] (--body <text> | --body-json <json> | --body -)`
  — mint a ULID, derive `{session?, host, cwd}` from the process, append one open record to
  `<agent-home>/EPISODIC.jsonl`. The ENCODE affordance. Scope is never stored — it is `node(cwd)`,
  computed at fold time.
- `read --home <dir> [--under <node>] [--count]` — read the log back; `--under` filters same-host
  records by their resolved node (foreign-host/legacy report as counts).
- `node <path>` — resolve a path to its boundary node over the marker lattice. Prints the BARE node
  path so it composes (`read --under "$(episodic node <cwd>)"`); `--json` prints `{node, basis}`.
- `fold --home <dir>` — the deterministic dream-pass-1 routing manifest (`{id, node, basis}` per record).
- `lock (acquire|release|status) --home <dir>` — the dream lock (`dream.lock`, stale > 2h stolen).
- `drain --home <dir> [--keep N]` — archive + clear the raw log post-consolidation (bounded `.bak/`).
- `audit --home <dir> [--allow <f>]` — scope-pollution gate over `{SEMANTIC.md, PROCEDURAL.md}`.
- `migrate <src.md> <dest.jsonl>` — convert a legacy markdown `EPISODIC.md` to JSONL, no-loss gated.

Host invocation (the deployed bundle loses its +x bit over scp, so run via `node`):

```bash
node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/<name> --body '…'
```

## The record

```jsonc
{ "id": "<ULID>", "session": "<sid?>", "host": "<short>", "cwd": "<abs>", "body": <open>, "tags": ["…"?] }
```

All of `{session?, host, cwd}` are derived by the tool at encode — never caller-supplied. `body` is any
JSON value: captured cheap and open, routed later by dream over the fold manifest. v1 records
(`scope`/`path` fields) remain readable as inert data and fold to the `legacy` bucket.

The full contract (node semantics, route targets, rituals) lives in `AGENTS.md` and
`plans/scoped-memory-v2/SPEC.md`.

## Build

`pnpm --filter @leclabs/agent-memory build` → `dist/episodic.mjs` (gitignored). The `memory` skill's
`bundle:` front-matter stages this artifact at deploy; the pipeline runs the build before projection.
