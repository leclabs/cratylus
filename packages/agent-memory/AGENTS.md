# episodic — agent conventions

`episodic`: the portable JSONL **EPISODIC** store + dream routing — a private **build-only toolsource**,
bundled into the `memory` skill and deployed to every host (`plans/memory-tool-bundling`). **Not** a
published library: zero importers, zero runtime deps. `tsup` bundles `src/bin.ts` → one dependency-free
`dist/episodic.mjs`. The runtime that backs the `memory` cell's EPISODIC layer; zero-coupled to agent-forge.

## The contract is in the corpus

The build-spec is `packages/agent-anatomy` — the `memory` and `dream` cells (EPISODIC schema, Routing,
Portability). Two invariants are load-bearing and must never regress:

- **Portability.** A record stores `(scope, path)`, never an absolute `home` and never a one-way `fid`
  hash. Location is derived per host via `resolveFile(env, scope, path)`. The same `(scope, path)`
  resolves to the same logical store on hosts with different home roots.
- **Open capture.** Encode writes only `{id, scope, path?, body}`. No `kind`/taxonomy and no `routes` at
  capture time — the Dreamer adds routing later. `routes` is written **only** by the dream pass
  (`src/dream.ts`), and only onto records it retains.

## ULID, not UUIDv4

`id` is a ULID (`src/ulid.ts`): lexicographically time-sortable so lines order by mint time. The factory
is **monotonic within a millisecond**. Order within a `(scope, path)` group is by ULID, never by file
position alone. UUIDv7 is an acceptable equivalent; UUIDv4 is not (not sortable).

## The dream routing engine (`src/route.ts` + `src/dream.ts`)

The deterministic consuming half of the store — the dream pass over `EPISODIC.jsonl`. Build-spec: the
`dream` cell + `memory` Routing. Split mechanical from reasoning:

- **Mechanical (here, deterministic + tested):** `applyRoutes(...)` resolves each routed target via
  `resolveFile`, appends distilled content to that home, retains EPISODIC targets, consumes the rest,
  then **atomically compacts** the log.
- **Classification (NOT here):** the voice/scope `Classifier` is an injected `(record) => RouteDecision`.
  The runtime Dreamer plugs in LLM reasoning; tests inject a deterministic stub.

Two load-bearing correctness properties, both tested in `test/dream.test.ts`:

- **Atomic compaction.** `compact()` never truncates-in-place: write a sibling tmp, `fsync`, then
  `rename` over the original (atomic on POSIX). A crash at the publish point leaves the full original.
  The rename is an injectable seam so a test can simulate the crash exactly there.
- **Idempotent.** Consuming an absent id is a no-op; a second pass over a drained log re-lands nothing.

## The migration (`src/migrate.ts`)

`episodic migrate <src.md> <dest.jsonl>` converts a legacy markdown `EPISODIC.md` to JSONL. **No-loss
gated** by two independent legs: a round-trip leg and `assertLinesFromSource` (record line-multiset ⊆
source line-multiset — catches fabrication/dup against the RAW input, not just self-consistency). Never
deletes the source; dryRun + overwrite-guard. `wake` self-triggers it on a fresh host.

## The MEMORY sharding migration (`src/migrate-memory.ts`)

The semantic sibling: converts a monolithic `MEMORY.md` (fact bullets under `## ` sections) into one
`MEMORY/<ulid>.md` shard per fact, per `sharded-memory-store/decisions/0003-shard-layout`. **Reuses the
same parser (`extractItems`) and two-leg no-loss gate** as the EPISODIC migration. Bodies are VERBATIM;
the `0003` relevance frontmatter (`topic`/`kind`/`basis`) is the Dreamer's later `consolidate` job, not
mechanically derived — shards carry only `id` + `migrated: MEMORY.md` + `section`. Never deletes the
source; dryRun + overwrite-guard. **Library + fixture-tests only so far**; the CLI subcommand and the
LIVE per-agent rollout are gated on constitution Phase 3 (`[[dream]]`/`[[wake]]` reading `MEMORY/*.md`) —
sharding a live MEMORY while wake still reads the monolith saws off the running protocol.

## Gates

`pnpm build` + `pnpm test` + `pnpm typecheck` green; `biome check` clean. The bundle is `dist/episodic.mjs`
(no dts, no exports surface — it is the CLI, not a library). Tests cover ULID monotonicity, encode-append,
resolveFile portability across two home roots, the dream pass (routing, split, drop, next-step retention,
atomic + idempotent + crash-safe compaction), and the migration's two-leg no-loss gate.
