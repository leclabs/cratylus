# sharded-memory-store

**State: DESIGN — spine specified.** Architecture decided (`0001`); the verb interface (the
load-bearing seam) is now specified (`0002`). Remaining phases build off it. Mav owns the interface +
`episodic` core + shard machinery + migration; Nico owns the constitution half.

## Decisions

- `0001-memory-store-architecture` — **Accepted.** Portable sharded files = source of truth · any DB a
  derived rebuildable index · stable verb interface · transport = bundled CLI over the shell (not MCP) ·
  MCP a future adapter · index additive · consolidation reconciles.
- `0002-verb-interface` — **Accepted.** The `MemoryStore` port: `encode · recall · consolidate ·
graduate · forget`, each with signature + side-effect contract + error modes; storage- and
  transport-agnostic. Today's `EpisodicStore.{encode, read}` = `encode` + load-whole `recall`; the spec
  widens that seam. CLI = transport now, MCP = future transport over the same verbs; `migrate` = a
  bootstrap admin op, not a steady-state verb.

## Phases

| #   | Phase               | Lead       | State | Gist                                                              |
| --- | ------------------- | ---------- | ----- | ----------------------------------------------------------------- |
| 1   | Verb interface spec | Mav        | ✅    | the load-bearing seam (`0002`)                                    |
| 2   | Shard layout        | Mav + Nico | next  | granularity (fact vs topic), dir model, frontmatter, naming       |
| 3   | Constitution update | Nico       |       | [[memory]] resident-layers + [[dream]]/[[wake]] for sharded files |
| 4   | No-loss migration   | Mav        |       | monolithic → sharded, 11 agents, two-leg gate                     |
| 5   | Recall index        | Mav        |       | grep → FTS5 → sqlite-vec — only when load-whole breaks (D6)       |
| 6   | Reconciliation      | Mav        |       | `consolidate` updates contradicting facts, not just appends (D7)  |

**Next pick:** Phase 2 — `shard-layout` (the spine now anchors it).

## See also

- `decisions/0001-memory-store-architecture.md` · `decisions/0002-verb-interface.md` — the spine.
- `../run-the-business/completed/vault-reference-home.md` — sharded notes in a namespaced home; this
  extends sharding inward to SELF/MEMORY.
