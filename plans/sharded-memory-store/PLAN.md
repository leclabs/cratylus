# sharded-memory-store

**State: DESIGN.** Architecture decided (`decisions/0001-memory-store-architecture.md`);
implementation phases below are **design-first** — scope each with the Operator + Nico before
building. Promoted out of RTB 2026-06-20 once the Operator-driven design crossed into an
initiative (RTB charter's promotion rule).

## Decisions

- `0001-memory-store-architecture` — **Accepted.** Portable sharded files as source of truth ·
  any DB a derived rebuildable index · stable verb interface (`encode/recall/consolidate/
graduate/forget`) · immediate transport = bundled CLI over the shell (not MCP) · MCP a future
  adapter behind the interface · index additive + rebuildable · consolidation reconciles.

## Phases (design-first — not yet scoped into task files)

| #   | Phase                   | Lead       | Gist                                                                         |
| --- | ----------------------- | ---------- | ---------------------------------------------------------------------------- |
| 1   | Verb interface spec     | Mav        | `encode/recall/consolidate/graduate/forget` — the load-bearing seam          |
| 2   | Shard layout            | Mav + Nico | granularity (fact vs topic), dir model, frontmatter, naming                  |
| 3   | Constitution update     | Nico       | [[memory]] resident-layers + [[dream]]/[[wake]] for sharded files            |
| 4   | No-loss migration       | Mav        | monolithic → sharded, 11 agents, two-leg gate                                |
| 5   | Recall index (deferred) | Mav        | grep → FTS5 → embeddings (SQLite + sqlite-vec) — only when load-whole breaks |
| 6   | Reconciliation          | Mav        | `consolidate` updates contradicting facts, not just appends                  |

**Next pick:** Phase 1 (the verb interface) — everything else hangs off it. Scope it with the
Operator first.

## See also

- `decisions/0001-memory-store-architecture.md` — the architecture spine.
- `../run-the-business/completed/vault-reference-home.md` — established sharded notes in a
  namespaced home; this extends sharding inward to SELF/MEMORY.
