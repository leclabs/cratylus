# 0001 — Memory store: portable files, swappable index, stable interface

- **Status:** Accepted (architecture spine; implementation phased)
- **Date:** 2026-06-20
- **Deciders:** Operator · Mav (machinery) · Nico (constitution)

## Context

Our memory model keeps converging on database primitives — records, indexes, queries,
routing, consolidation. That convergence is not a smell; **every agent-memory system at
scale lands on the same primitives** (CoALA, MemGPT/Letta, mem0, Zep/Graphiti, LangMem).
The discipline is therefore to **adopt the proven primitives behind a thin portable
interface**, not to grow a bespoke database — and to honor three hard constraints:

- **Portable** — survives any host; one logical person across the fleet.
- **Harness-agnostic** — usable by any agent runtime, not tied to one framework.
- **Easily deliverable by koine** — shippable as config/assets koine already translates.

Where we already align with the field (so this is consolidation, not a rewrite): our
organs map 1:1 onto the canonical taxonomy — EPISODIC = episodic, MEMORY/vault = semantic,
SOUL/SELF = procedural/identity — and our hot (resident) vs cold ([[memory]] vault) tiers
mirror MemGPT's in-context-core vs out-of-context-archive paging.

## Decision

**The spine:** a stable verb interface over sharded files as the source of truth, with any
database as a _derived, rebuildable index_, and richer transports as _future adapters
behind the same interface_ — never current dependencies.

```
agent (SOUL ritual: encode/wake/dream)
  │  shell command (Bash)            ← the harness-agnostic invocation surface
  ▼
episodic CLI  encode · recall · consolidate · graduate · forget
  │  thin adapter over ↓
episodic core library  (the pure verbs = the stable interface)
  │  reads / writes ↓
SHARDED FILES on disk  ← SOURCE OF TRUTH (markdown/JSONL, git-synced, portable, inspectable)
  ┊  (optional · derived · rebuildable)
  └┄ index:  grep → FTS5 → embeddings (SQLite + sqlite-vec)   [add only when load-whole breaks]

future adapter, NOT built:  MCP server over the same core library   [only when memory goes networked]
```

### Numbered decisions

- **D1 — Files are the source of truth; any DB is a derived, rebuildable index.**
  ([[doc-mirrors-runtime-truth]]) Files stay portable, diffable, git-syncable, and readable
  by human _and_ LLM. A database, if introduced, is a cache you can delete and regenerate
  from the files — it never owns the data.
- **D2 — One memory = one file (sharded); consolidation is a `move`, not a rewrite.**
  ([[sharded-work-layout]]) Retires the monolithic `SELF.md`/`MEMORY.md` rewritten wholesale
  every dream (costly, [[palimpsest]]-prone). Hot vs cold = which directory a shard lives in;
  MEMORY→vault graduation is an `mv`.
- **D3 — A stable verb interface decouples agent + corpus from storage.** The agent and the
  constitution speak `encode/recall/consolidate/graduate/forget`; they never see the backend.
  This is the ports-and-adapters seam that makes D6 and the future MCP adapter cheap.
- **D4 — Immediate implementation: the bundled CLI over the shell. Not MCP.** A shell is more
  universal than MCP (every harness has exec; MCP needs support + per-client registration + a
  daemon). koine ships the CLI as a skill-bundled asset — the pattern we _just_ shipped
  (`deploy: skill-dir` + `bundle:`, `memory-home-dual-deploy`). Zero protocol, zero daemon,
  zero per-dialect MCP config.
- **D5 — MCP / any server backend is a FUTURE adapter behind the same interface — not built
  now.** ([[defer-the-package-boundary]]) Because the verbs live in the core library, an MCP
  server is later a thin shim over the same functions. **Trigger to build it:** memory goes
  networked — a central store remote agents query over the wire (the deferred remote-backing
  `HostEnv`/mobility design). Until then: files + CLI.
- **D6 — The recall index is additive and rebuildable; start trivial, scale later.** Begin
  with load-whole / grep ([[context-at-the-load-bearing-depth]]). Add FTS5, then embeddings
  (SQLite + `sqlite-vec` — the most portable conventional DB: single file, zero-server, runs
  wherever `node` does) **only when "load whole" breaks** — behind `recall`, changing neither
  the corpus nor the agent's mental model. Retrieval scoring follows the proven recency +
  importance + relevance blend (Generative Agents).
- **D7 — Consolidation reconciles, not just appends.** A new fact that contradicts an old one
  _updates_ it (mem0's extract → dedup → update), so MEMORY doesn't accrete contradictions.
- **D8 — Portable identity.** ULID ids + scope-relative paths; never absolute homes, never
  one-way hashes. _(Already in place in `episodic`.)_

## Alternatives considered

- **MCP server now** — _rejected._ Overkill for ritual-boundary reads/writes; **less** portable
  than the shell (narrower contract); the heaviest option for koine (per-dialect server config
  - a supervised daemon); premature for a host-local file store. Kept as D5 future adapter.
- **Database as source of truth (SQLite/Postgres+pgvector)** — _rejected._ Forfeits file
  portability, git-sync, and human/LLM inspection; introduces lock-in. A DB is allowed only as
  the D1 derived index.
- **Keep monolithic `SELF.md`/`MEMORY.md`** — _rejected._ Whole-file rewrite per dream is
  costly and palimpsest-prone, and "load whole" does not scale (D2/D6).

## Consequences

- **Positive:** portable + git-syncable + inspectable; zero-daemon; koine-trivial delivery;
  future-proof (swap the impl behind the interface); incremental (pay for an index only at
  scale); the agent's mental model is stable across all of it.
- **Costs / risks:** sharding multiplies small files (needs the D6 index for relevance at
  scale); the verb interface must be designed deliberately (it is the load-bearing seam); a
  one-time no-loss migration of 11 agents' monolithic memories.

## Follow-on (design phase — scope with Operator + Nico before building)

1. **Define the verb interface** precisely (`encode/recall/consolidate/graduate/forget`) — the spine.
2. **Shard layout** — granularity (fact vs topic), directory model, frontmatter, naming.
3. **Recall index** — when to introduce, FTS vs vectors, rebuild story (D6).
4. **Reconciliation in `consolidate`** — contradiction update-vs-append (D7).
5. **No-loss migration** — monolithic → sharded across all agents (reuse the md→JSONL two-leg gate).
6. **Constitution update** — [[memory]] cell's resident-layers model + [[dream]]/[[wake]] for sharded files (Nico).

## References

- Corpus: [[memory]] · [[sharded-work-layout]] · [[doc-mirrors-runtime-truth]] · [[cite-dont-copy]] ·
  [[substance-over-accident]] · [[defer-the-package-boundary]] · [[context-at-the-load-bearing-depth]].
- Field: CoALA (arXiv 2309.02427) · MemGPT/Letta (2310.08560) · Generative Agents (2304.03442) ·
  LangMem (langchain-ai.github.io/langmem) · mem0 · Zep/Graphiti · Model Context Protocol.
