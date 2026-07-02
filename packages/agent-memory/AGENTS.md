# episodic — agent conventions

`episodic`: the scoped-memory-v2 runtime — a portable JSONL **EPISODIC** store, the `node(cwd)` scope
resolver, the deterministic dream fold, the dream lock, and the pollution audit. A private **build-only
toolsource**, bundled into the `memory` skill and deployed to every host (`plans/memory-tool-bundling`).
**Not** a published library: zero importers, zero runtime deps. `tsup` bundles `src/bin.ts` → one
dependency-free `dist/episodic.mjs`. Zero-coupled to agent-forge.

## The v2 contract (plans/scoped-memory-v2 SPEC)

The model in one line: every record stores its **cwd**; **scope = `node(cwd)`, computed by the tool —
never reasoned, never stored**; dream is a deterministic fold + a semantic routing pass; stores are the
CoALA types `{EPISODIC.jsonl · SEMANTIC.md · PROCEDURAL.md}` + SOUL (commons).

- **Capture is derived (D2, `src/store.ts`).** Encode writes `{id, session?, host, cwd, body, tags?}`;
  `{session?, host, cwd}` come from the process environment via the injectable `DeriveEnv` seam — never
  caller-supplied. No `kind`, no scope field, no `routes` at capture. The raw log is ALWAYS the agent
  home (single-store); capture never writes into a repo. `tags` refine, never route; a caller-supplied
  `--scope` is accepted as an inert `tags` entry (compat), with no grammar validation.
- **Scope is computed (D3, `src/node.ts`).** `node(cwd, host)` = the nearest ancestor of `cwd`
  (reflexive) holding a boundary marker. Defaults: `.git` (a `.git` FILE — worktree/submodule — resolves
  through to the primary checkout's node) · a package manifest (`package.json`, `pyproject.toml`,
  `Cargo.toml`, `go.mod`) · `PLAN.md` · `$HOME`. **Total**: nonexistent cwd → nearest existing ancestor;
  markerless cwd → its own boundary; a foreign-host cwd is never resolved against the local filesystem
  (only the config-known `$HOME` prefix from `host.<name>.homedir`, else the cwd itself). Marker set
  extends via `memory.scopeMarkers` (glob list) in `.agent-factory.config`. Agents invoke the resolver
  (`episodic node <path>`), never infer it.
- **Dream = fold + route (D4, `src/fold.ts` + `src/route.ts` + `src/dream.ts`).** Pass 1 is the tool:
  `episodic fold` emits the byte-deterministic routing manifest, one `{id, node, basis}` line per record
  in log order; cwd-less (v1/migrated) records land in the explicit `legacy` bucket, never a throw.
  Pass 2 is the injected `Classifier` (LLM reasoning at runtime, deterministic stubs in tests); the
  engine (`applyRoutes`) mechanically lands content and atomically compacts. The v2 target set is
  `SEMANTIC | PROCEDURAL` (home-anchored) · `AGENTS@<absolute node dir>` (→ `<node>/AGENTS.md`, the only
  in-repo write) · `vault@<absolute file>` · `EPISODIC` (retain) · drop (empty set). **The v1 organ
  names (`SELF`, `MEMORY`) are retired and rejected loudly at apply time**, as is tag-grammar
  addressing — targets address by node path + store name only.
- **Rituals (D5, `src/lock.ts` + `src/audit.ts` + CLI).** `read --under <node>` lists same-host records
  whose `node(cwd)` sits under the given node; foreign-host and legacy records report as counts (stderr).
  `lock acquire|release|status` manages `${AGENT_HOME}/dream.lock` (O_EXCL; stale = age > 2h, stolen on
  the next acquire) — it serializes the shared home partition {SEMANTIC, PROCEDURAL, drain}. `audit`
  scans `<home>/{SEMANTIC.md, PROCEDURAL.md}` (the v2 scan set) for scope markers: exit 1 on any
  unpinned hit; allow-file resolution `--allow > <home>/audit-allow.txt > none`; a pin matching nothing
  reports stale without failing (shrink-only ratchet).
- **v1 records stay readable.** `scope`/`path`/`routes` on old records parse as **inert data** — never
  routing. Existing verb invocation shapes (`encode --scope … --body …`, `read`, `drain`, `audit`,
  `migrate`) stay green.

## Portability

A record stores `cwd` + `host` as captured — never an absolute agent-home path, never a one-way hash.
The raw log resolves per host as `<home>/EPISODIC.jsonl`; node resolution is per-host by construction
(the resolver runs where the filesystem is). `.agent-factory.config` is the only cross-host knowledge:
`host.<name>.homedir` (absolute per-host `$HOME`, read by the resolver for foreign records — an additive
field this package reads; schema home: `docs/agent-factory-config-schema.md`) and `memory.scopeMarkers`.

## ULID, not UUIDv4

`id` is a ULID (`src/ulid.ts`): lexicographically time-sortable so lines order by mint time. The factory
is **monotonic within a millisecond**. UUIDv7 is an acceptable equivalent; UUIDv4 is not (not sortable).

## Correctness properties (tested)

- **Atomic compaction** (`src/dream.ts`): never truncate-in-place — sibling tmp, `fsync`, `rename`
  (atomic on POSIX); the rename is an injectable seam so a test simulates the crash exactly there.
  Idempotent: consuming an absent id is a no-op; a second pass re-lands nothing.
- **Fold determinism** (`src/fold.ts`): same log + same fs/config state ⇒ byte-identical manifest
  (fixed key order, log order preserved).
- **Lock staleness** (`src/lock.ts`): strict `age > STALE_MS` (2h) — the boundary is tested at the
  constant.
- **Resolver totality** (`src/node.ts`): every `(cwd, host)` resolves; the suite proves reflexivity,
  nearest-wins precedence, `.git`-file worktree resolution, config-glob shifts, and foreign-host
  isolation from the local fs.

## The migrations (`src/migrate.ts`, `src/migrate-memory.ts`)

`episodic migrate <src.md> <dest.jsonl>` converts a legacy markdown `EPISODIC.md` to JSONL. **No-loss
gated** by two independent legs: a round-trip leg and `assertLinesFromSource` (record line-multiset ⊆
source line-multiset — catches fabrication/dup against the RAW input, not just self-consistency). Never
deletes the source; dryRun + overwrite-guard. Migrated records are cwd-less → the `legacy` fold bucket
by construction. `src/migrate-memory.ts` (MEMORY.md → shards) is library + fixture-tests only, kept for
the D6 harvest tooling era; the v2 clean-slate migration itself is manual by design (SPEC D6 — no
migration machinery beyond these).

## Gates

`pnpm build` + `pnpm test` + `pnpm typecheck` green; `biome check` clean. The bundle is `dist/episodic.mjs`
(no dts, no exports surface — it is the CLI, not a library; node builtins only). Tests cover ULID
monotonicity, derived encode, the node resolver (all D3 falsifiers), fold determinism + legacy bucket,
`read --under` + foreign-host counts, lock conflict/stale-steal at the 2h constant, the v2 audit scan
set + allow-file resolution, the dream pass (v2 targets, v1-organ rejection, split, drop, retention,
atomic + idempotent + crash-safe compaction), and the migration's two-leg no-loss gate.
