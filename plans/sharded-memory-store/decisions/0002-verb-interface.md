# 0002 — The memory verb interface: `encode · recall · consolidate · graduate · forget`

- **Status:** Accepted (the spine spec; implementation phased per ADR 0001)
- **Date:** 2026-06-20
- **Deciders:** Mav (machinery — owns the verb interface + `episodic` core, per the charter split)

## Context

ADR 0001 D3 fixes a **stable verb interface** as the ports-and-adapters seam the agent, the
constitution, and every future backend speak through. This spec defines it precisely — the load-
bearing seam every other phase (shard layout, recall index, reconciliation, migration) hangs off.

The seam **already exists in miniature**: `episodic`'s core is `EpisodicStore.{encode, read}` (pure
library) behind a thin `cli.ts` transport (`encode`/`read`/`migrate` → argv → stdout). This spec
**generalizes that proven two-layer shape** to all five verbs. No verb signature names a storage
backend or a transport; both are adapters chosen below the interface.

## The port

```ts
// Addressing (ADR D8: portable identity — ULID ids, scope-relative paths, never absolute homes)
type Scope  = 'user' | { project: string }
type Organ  = 'episodic' | 'semantic' | 'identity' | 'vault'  // EPISODIC · MEMORY · SELF · cold vault
type Ref    = { scope: Scope; organ: Organ }                  // a store (a sharded home)
type Id     = string                                          // ULID — time-ordered, host-portable
type Item   = { id: Id; ref: Ref; body: string; meta: Meta }  // one memory
type Meta   = { kind?: string; basis?: 'observed' | 'inferred'; [k: string]: unknown }

interface MemoryStore {
  encode(ref: Ref, item: { body: string; meta?: Meta }): Id
  recall(ref: Ref, query?: Query): Item[]
  consolidate(ref: Ref): ConsolidationResult        // ref.organ = 'episodic' (the raw stream)
  graduate(from: { ref: Ref; id: Id }, to: Ref): Ref
  forget(at: { ref: Ref; id: Id }): void
}
```

### `encode(ref, item) → Id` — create one memory

- **Does:** mints a ULID, persists exactly one new memory into `ref`'s store. The **adapter** decides
  the physical form (append a record to `episodic`'s JSONL stream; write a new shard file for a
  `semantic`/`identity`/`vault` one-memory-one-file home — ADR D2). The verb is form-agnostic.
- **Side-effect:** one durable append/create; never mutates an existing memory (that is `consolidate`).
- **Errors:** `BadScope` (unresolvable scope), `Unwritable` (home not creatable). Never silently drops.
- **Today:** `EpisodicStore.encode` (JSONL append). **Gap:** the `semantic`/`identity`/`vault`
  new-shard form.

### `recall(ref, query?) → Item[]` — retrieve memories

```ts
type Query = { text?: string; filter?: (m: Item) => boolean; limit?: number; order?: 'recent' | 'relevant' }
```

- **Does:** returns items from `ref`, ranked. **No `query` ⇒ load-whole** (ADR D6: start trivial). A
  `text` query is satisfied by whatever index the adapter holds — substring/grep now; FTS5 then
  `sqlite-vec` later — **behind this exact signature** (D6). `order:'relevant'` follows the proven
  recency + importance + relevance blend (Generative Agents).
- **Side-effect:** none (pure read; an index, if present, is a derived cache — D1).
- **Errors:** `BadScope`. A missing store ⇒ `[]`, not an error.
- **Today:** `EpisodicStore.read` == `recall` with no query (load-whole). **Gap:** `query`/ranking.

### `consolidate(ref) → ConsolidationResult` — the dream-time reconcile

```ts
type ConsolidationResult = { routed: { id: Id; to: Ref }[]; updated: Id[]; cleared: Id[]; dropped: Id[] }
```

- **Does:** distils the raw `episodic` stream and routes each item to its home organ (identity→SELF,
  durable→semantic/MEMORY, networked-reference→vault, directive→AGENTS.md), **reconciling
  contradictions** — a new fact that conflicts with an old one _updates_ it (ADR D7: extract → dedup
  → update, not blind append). Consumed raw is cleared. SOUL is never written.
- **Side-effect:** writes/updates target shards (each an `encode`-or-update), then truncates the
  consumed raw records. Atomic per item where possible; a failure leaves the raw record intact.
- **Errors:** `RouteFailure(id)` (no home resolved — leaves the item in EPISODIC, never drops it).
- **Today:** done **in-the-loop** by the `dream` skill (+ partial `dream.ts`/`route.ts` scaffolding).
  This verb makes the routing+reconcile mechanical and callable. **Gap:** the reconcile (D7) engine.

### `graduate({ref, id}, to) → Ref` — move a memory across tiers

- **Does:** relocates one memory from `from.ref` to `to` (e.g. hot `semantic`→cold `vault`). Per ADR
  D2 consolidation is an **`mv`, not a rewrite**: the shard file moves; the source home keeps only a
  one-line pointer (hot index → cold corpus) when policy says so (the MEMORY→vault graduation idiom).
- **Side-effect:** one file move + optional pointer-stub write at the source.
- **Errors:** `NotFound(id)`, `Unwritable(to)`. The move is the unit of work — never a partial copy.
- **Today:** manual at dream-time. **Gap:** the verb + the pointer-stub policy.

### `forget({ref, id}) → void` — remove a memory

- **Does:** retires one memory. **Archive, never silent `rm`** (mirrors the toolkit `place` discipline:
  the store _never prunes_; deletion is an archive-move so git/history keeps the recovery net).
- **Side-effect:** moves the shard to an archive home (or tombstones the record); the live recall set
  no longer returns it.
- **Errors:** `NotFound(id)` (idempotent — forgetting an absent id is a no-op, not an error).
- **Today:** none. **Gap:** the whole verb (the one fully-new addition).

## Boundary: verbs are the library, the shell is the transport (ADR D4)

The five verbs are **pure functions on the `MemoryStore` port** — they take/return plain data (scope,
ids, items as JSON), and name **no transport**. Two adapters sit _above_ them and one family _below_:

```
  transport adapters (above) ──►  MemoryStore (the 5 verbs)  ──►  storage adapters (below)
  ─ CLI: argv → verb → stdout       encode·recall·consolidate      ─ files = source of truth (D1):
    (the shipped `episodic` bin)     ·graduate·forget                JSONL stream + one-file shards
  ─ MCP: tool-call → verb → result  (pure; no I/O assumptions)     ─ derived index (D6, optional):
    (FUTURE, D5 — not built)                                          grep → FTS5 → sqlite-vec
```

- **CLI transport (now):** each subcommand is a thin shim — parse argv, call the verb, serialize the
  return. This is exactly today's `cli.ts` over `EpisodicStore`. koine ships it skill-bundled
  (`deploy: skill-dir` + `bundle:`), zero daemon, zero per-dialect config (ADR D4).
- **Storage adapters (below):** the verbs read/write **files as the source of truth** (D1). An index
  is a _derived, rebuildable_ adapter `recall` consults when present and falls back from to load-whole
  — introduced only when "load whole" breaks (D6). Swapping grep→FTS5→`sqlite-vec` changes **no verb
  signature**.

## MCP holds the seam (ADR D5 — proof, not a build)

When memory goes networked, an MCP server is **another transport adapter over the same five verbs**:
each MCP tool (`memory_encode`, `memory_recall`, …) is a shim calling the identical library function
the CLI calls. Adding it changes **no verb signature and no storage** — it adds one transport beside
the CLI. That this drops in cleanly _is_ the test that the seam is real (D5: built only when a central
store serves remote agents over the wire; until then, files + CLI).

## `migrate` is a bootstrap op, not a steady-state verb

`migrate` (md→JSONL; later monolithic→sharded) is a **one-time admin command** run at a host/agent
boundary, not part of the steady-state five-verb interface — it bootstraps the store into the shape
the verbs operate on. It stays a CLI subcommand on the same library, under the two-leg no-loss gate
(round-trip + independent line-coverage), but it is **not** a `MemoryStore` method.

## Acceptance (blind test)

From this spec alone a fresh engineer can: (a) implement a stub backend satisfying all five verb
signatures + side-effect/error contracts; (b) point to where a future `sqlite-vec` index plugs in
(below `recall`, a derived adapter, no signature change); and (c) point to where an MCP server plugs
in (a transport adapter above the verbs, beside the CLI, no signature change). The current
`EpisodicStore.{encode, read}` is shown to be `encode` + load-whole `recall` — the seam already
standing, the spec only widening it.

## References

- ADR `decisions/0001-memory-store-architecture.md` (D1–D8 — this spec realizes D3, honors D1/D2/D4/D5/D6/D7/D8).
- Corpus: [[memory]] · [[sharded-work-layout]] · [[doc-mirrors-runtime-truth]] · [[defer-the-package-boundary]].
- Code seam: `packages/episodic/src/{store.ts (EpisodicStore), cli.ts (transport), migrate.ts}`.
- Field: CoALA · MemGPT/Letta · mem0 (extract→dedup→update) · Generative Agents (recall scoring) · MCP.
