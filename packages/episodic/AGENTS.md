# koine-episodic — agent conventions

`@leclabs/koine-episodic`: the portable JSONL **EPISODIC** store — ULID source, the open record shape,
`resolveFile`, and the append-only `EpisodicStore`. The runtime that backs `mind/ideas/memory.md`'s
EPISODIC layer. No dependency on any sibling package.

The public surface is re-exported from `src/index.ts`: `ulid`, `resolve`, `record`, `store`, `route`,
`dream`.

## The contract is in the corpus

The build-spec is `packages/mind/ideas/memory.md` — sections **EPISODIC schema**, **Routing**, and
**Portability**. Two invariants are load-bearing and must never regress:

- **Portability.** A record stores `(scope, path)`, never an absolute `home` and never a one-way `fid`
  hash. Location is derived per host via `resolveFile(env, scope, path)`. The portability gate: the same
  `(scope, path)` resolves to the same logical store on hosts with different home roots.
- **Open capture.** Encode writes only `{id, scope, path?, body}`. No `kind`/taxonomy and no `routes` at
  capture time — the Dreamer adds routing later. Do not push classification upstream into encode. `routes`
  is written **only** by the dream pass (`src/dream.ts`), and only onto records it retains.

## ULID, not UUIDv4

`id` is a ULID (`src/ulid.ts`): lexicographically time-sortable so lines order by mint time. The factory is
**monotonic within a millisecond** (randomness increments). Order within a `(scope, path)` group is by ULID
— never by file position alone. UUIDv7 is an acceptable equivalent if ever swapped; UUIDv4 is not (not
sortable).

## The dream routing engine (`src/route.ts` + `src/dream.ts`)

The deterministic consuming half of the store — the dream pass over `EPISODIC.jsonl`. The build-spec is
`packages/mind/ideas/dream.md` (the formal routing block) + `memory.md` Routing. Split mechanical from
reasoning:

- **Mechanical (here, deterministic + tested):** `applyRoutes(store, scope, path, classifier)` resolves
  each routed target via `resolveFile`, appends the distilled content to that home, retains EPISODIC
  targets, consumes the rest, then **atomically compacts** the log.
- **Classification (NOT here):** the voice/scope `Classifier` is an injected `(record) => RouteDecision`.
  The runtime Dreamer plugs in LLM reasoning; tests inject a deterministic stub. The engine owns none of
  the reasoning.

Two load-bearing correctness properties, both tested in `test/dream.test.ts`:

- **Atomic compaction.** `compact()` never truncates-in-place: it writes a sibling tmp, `fsync`s it, then
  `rename`s over the original (atomic on POSIX). A crash at the publish point leaves the full original —
  never a partial log, never a lost unconsumed record. The rename is an injectable seam so a test can
  simulate the crash exactly there.
- **Idempotent.** Consuming an absent id is a no-op; a second pass over a drained log re-lands nothing.

## Out of scope here

The voice/scope classifier (LLM reasoning — injected, not built). The live-agent EPISODIC migration is
consent-gated and lives elsewhere.

## Gates

`pnpm build` + `pnpm test` + `pnpm typecheck` green; `biome check` clean. Tests cover ULID monotonicity,
encode-append, resolveFile portability across two home roots, and the dream pass (routing, split, drop,
next-step retention, route write-back, atomic + idempotent + crash-safe compaction).
