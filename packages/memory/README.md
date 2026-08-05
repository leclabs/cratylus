# memory

Build-only **toolsource** for the standalone `memory` tool — the memory protocol's
dependency-free CLI. **Not** a published library: zero importers, zero runtime
dependencies. `tsup` bundles `src/bin.ts` into a single self-contained
`dist/memory.mjs`, exposed on PATH via the package `bin` (`memory`) and carried to
every host beside the `memory` skill.

## The tool (scoped-memory-v2)

`src/bin.ts` (shebang) → `memory <command>` (every store verb takes the agent home
as `--home <dir>` OR `--name <name>` ⇒ `~/.agents/<name>`):

- `--version` — print the tool version.
- `install` — host-bootstrap self-check (installs on PATH via the package `bin`; changes no host state).
- `init (--home <dir> | --name <name>)` — provision a fresh home: mkdir + seed `{SEMANTIC.md, PROCEDURAL.md, EPISODIC.jsonl}` if-absent (never clobbered).
- `encode --home <dir> [--session <id>] [--tags <a,b>] (--body <text> | --body-json <json> | --body -)`
  — mint a ULID, derive `{host, cwd}` from the process, bind the session (`--session` > `CLAUDE_SESSION_ID`
  > the sole live registered session; error if none/ambiguous — never sessionless), append one open
  > record to `<home>/EPISODIC.jsonl`. Scope is never stored — it is `node(cwd)`, computed at fold time.
- `read --home <dir> [--under <node>] [--for-session <S>] [--count]` — read the log back; `--under` filters
  same-host records by their resolved node (foreign-host/legacy report as counts); `--for-session` adds the
  liveness filter.
- `node <path>` — resolve a path to its boundary node over the marker lattice. Prints the BARE node
  path so it composes (`read --under "$(memory node <cwd>)"`); `--json` prints `{node, basis}`.
- `fold --home <dir>` — the deterministic dream-pass-1 routing manifest (`{id, node, basis}` per record).
- `lock (acquire|release|status) --home <dir>` — the dream lock (`dream.lock`, stale > 2h stolen).
- `session (register|heartbeat|release|status [<id>]|list) --home <dir> [--session <id>]` — the
  liveness registry; `register` binds `--session` > `CLAUDE_SESSION_ID` > a minted uuid.
- `drain --home <dir> [--keep N]` — archive + clear the raw log post-consolidation (bounded `.bak/`).
- `audit --home <dir> [--allow <f>]` — scope-pollution gate over `{SEMANTIC.md, PROCEDURAL.md}`.
- `migrate <src.md> <dest.jsonl>` — convert a legacy markdown `EPISODIC.md` to JSONL, no-loss gated.

Host invocation once the tool is on PATH:

```bash
memory encode --name <name> --body '…'
```

## The record

```jsonc
{ "id": "<ULID>", "session": "<sid>", "host": "<short>", "cwd": "<abs>", "body": <open>, "tags": ["…"?] }
```

`{host, cwd}` are derived by the tool at encode; `session` is bound at encode (never caller-supplied,
never absent). `body` is any JSON value: captured cheap and open, routed later by dream over the fold
manifest. v1 records (`scope`/`path` fields) remain readable as inert data and fold to the `legacy` bucket.

Each half of the contract has exactly one home, and this README restates none of it: node semantics
in `src/node.ts` (the resolver, and what a node MEANS — where a record was captured, never what it
is about), the route target set in `src/route.ts` (`SEMANTIC · PROCEDURAL · EPISODIC`, with `drop`
modelled as the empty target set rather than a fourth store), and the rituals in the `dream` and
`wake` skill cells under `packages/canon/src/skills/`.

## Build

`pnpm --filter @cratylus/memory build` → `dist/memory.mjs` (gitignored).
