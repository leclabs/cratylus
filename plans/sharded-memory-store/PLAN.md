# sharded-memory-store

**State: DESIGN — spine + layout fixed.** Architecture decided (`0001`); the verb interface (the
load-bearing seam) specified (`0002`); the on-disk shard layout fixed (`0003`). Build phases now have a
concrete target. Mav owns the interface + `episodic` core + shard machinery + migration; Nico owns the
constitution half.

## Decisions

- `0001-memory-store-architecture` — **Accepted.** Portable sharded files = source of truth · any DB a
  derived rebuildable index · stable verb interface · transport = bundled CLI over the shell (not MCP) ·
  MCP a future adapter · index additive · consolidation reconciles.
- `0002-verb-interface` — **Accepted.** The `MemoryStore` port: `encode · recall · consolidate ·
graduate · forget`, each with signature + side-effect contract + error modes; storage- and
  transport-agnostic. Today's `EpisodicStore.{encode, read}` = `encode` + load-whole `recall`; the spec
  widens that seam. CLI = transport now, MCP = future transport over the same verbs; `migrate` = a
  bootstrap admin op, not a steady-state verb.
- `0003-shard-layout` — **Accepted.** Granularity follows access pattern: `MEMORY` shards (one memory
  per `MEMORY/<ulid>.md`, frontmatter-tagged, recalled by relevance); `SELF` stays a coherent monolith
  (the reboot seed, loaded whole — _flagged for Nico Phase-3 ratification_); `EPISODIC` already
  record-sharded. Hot = ULID-named under the home; cold = kebab topic-notes in the vault; `forget` →
  `.archive/`. The filing table is the blind-test bar.

## Phases

| #   | Phase               | Lead       | State | Gist                                                                 |
| --- | ------------------- | ---------- | ----- | -------------------------------------------------------------------- |
| 1   | Verb interface spec | Mav        | ✅    | the load-bearing seam (`0002`)                                       |
| 2   | Shard layout        | Mav + Nico | ✅    | granularity + dir model + frontmatter + naming (`0003`)              |
| 3   | Constitution update | Nico       |       | [[memory]] resident-layers + [[dream]]/[[wake]] for sharded files    |
| 4   | No-loss migration   | Mav        | 🔨    | lib+tests done (`migrate-memory.ts`); CLI + live rollout gated on §3 |
| 5   | Recall index        | Mav        |       | grep → FTS5 → sqlite-vec — only when load-whole breaks (D6)          |
| 6   | Reconciliation      | Mav        |       | `consolidate` updates contradicting facts, not just appends (D7)     |

**In progress:** Phase 4 — the `MEMORY.md` → `MEMORY/<ulid>.md` sharding migration is built and
fixture-tested (`packages/episodic/src/migrate-memory.ts`; reuses the proven `extractItems` + two-leg
no-loss gate). **Remaining tail:** the `episodic migrate-memory` CLI subcommand + the live per-agent
rollout — both gated on **Phase 3** (Nico's `[[dream]]`/`[[wake]]` reading `MEMORY/*.md`), since sharding
a live MEMORY while wake still reads the monolith saws off the running protocol. **Next pick:** hand
Phase 3 to Nico (it unblocks the Phase-4 cutover), or build the CLI shim while it lands.

## See also

- `decisions/0001-memory-store-architecture.md` · `decisions/0002-verb-interface.md` ·
  `decisions/0003-shard-layout.md` — the spine.
- `../run-the-business/completed/vault-reference-home.md` — sharded notes in a namespaced home; this
  extends sharding inward to SELF/MEMORY.
