# koine-episodic — agent conventions

`@leclabs/koine-episodic`: the portable JSONL **EPISODIC** store — ULID source, the open record shape,
`resolveFile`, and the append-only `EpisodicStore`. The runtime that backs `mind/ideas/memory.md`'s
EPISODIC layer. No dependency on any sibling package.

The public surface is re-exported from `src/index.ts`: `ulid`, `resolve`, `record`, `store`.

## The contract is in the corpus

The build-spec is `packages/mind/ideas/memory.md` — sections **EPISODIC schema**, **Routing**, and
**Portability**. Two invariants are load-bearing and must never regress:

- **Portability.** A record stores `(scope, path)`, never an absolute `home` and never a one-way `fid`
  hash. Location is derived per host via `resolveFile(env, scope, path)`. The portability gate: the same
  `(scope, path)` resolves to the same logical store on hosts with different home roots.
- **Open capture.** Encode writes only `{id, scope, path?, body}`. No `kind`/taxonomy and no `routes` at
  capture time — the Dreamer adds routing later. Do not push classification upstream into encode.

## ULID, not UUIDv4

`id` is a ULID (`src/ulid.ts`): lexicographically time-sortable so lines order by mint time. The factory is
**monotonic within a millisecond** (randomness increments). Order within a `(scope, path)` group is by ULID
— never by file position alone. UUIDv7 is an acceptable equivalent if ever swapped; UUIDv4 is not (not
sortable).

## Out of scope here

The dream routing engine (adds `routes`) and compaction are separate packages/tasks. Live-agent EPISODIC
migration is consent-gated and lives elsewhere. Keep this package the store + encode + resolveFile.

## Gates

`pnpm build` + `pnpm test` + `pnpm typecheck` green; `biome check` clean. Tests cover ULID monotonicity,
encode-append, and resolveFile portability across two home roots.
