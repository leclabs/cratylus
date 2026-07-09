# Principles (inductively extracted) + memory rethink + per-box SRP audit

Draft by nico (design authority) for adversarial review. ρ=LLM.

## 1. The principles behind the ask (#2 → induction)

- **P1 Single Responsibility** — each box owns exactly ONE responsibility; a responsibility found in the
  wrong box is PORTED out, never left as a "convenient" tenant.
- **P2 Mechanism / Strategy separation** — the deterministic MECHANISM lives in the tool/engine; the
  irreducible REASONING (salience, judgment, consolidation policy) lives with the agent (skills). "The agent
  knows the strategy and interacts via tool calls." The tool never reasons; the agent never re-implements
  mechanics.
- **P3 Uniform abstraction over a domain (Open–Closed)** — a domain's KINDS are exposed through a generic
  interface **per operation-FAMILY**, not one god-interface. Adding a kind within a family = data, not a fork.
  **Caveat (industry-grounded, round-3):** distinct families stay distinct — memory has record-homes
  (append/read/forget) AND resident-prose homes (land/**replace**/forget); procedural memory is prose-edit,
  categorically not CRUD (Letta/LangMem/mem0). Harness ADAPTERS are the clean single-family instance. Do NOT
  weld all memory kinds into one CRUD signature (that was the draft's overbuild — see §2 banner).
- **P4 Ports & adapters / dependency inversion** — every cross-box seam is a CONTRACT PORT; the transport
  (CLI · MCP · lib) and the concrete implementation are ADAPTERS behind it.
- **P5 Self-describing contract (agent as first-class client)** — the interface exposes its TAXONOMY +
  operations so the agent can REASON about and SELECT the right memory. Discoverability is a requirement, not
  a nicety.

## 2. Memory rethink — from episodic-only tool to a uniform memory SERVICE

> **SUPERSEDED by NORTH-STAR §0.2/§2.2 (round-3, grounded).** Two corrections: (1) the current-state below is
> FALSE — the resident-home write-engine `applyRoutes` (`dream.ts:200`) already exists (it is DEAD, not
> absent); the deliverable is WIRE+GENERALIZE, not build. (2) "uniform typed CRUD service" is OVERBUILT — the
> industry shape is two op-families (record vs resident-prose) over the 5 real homes, recall out of the
> portable core, working memory = context (no store). Read §0.2 for the corrected target; below is retained
> for the reasoning trail.

**Defect today (SRP violation):** memory MECHANISM is split by type. `episodic.mjs` mechanically owns only
EPISODIC (encode·read·fold·drain). SEMANTIC/PROCEDURAL are hand-authored MARKDOWN the dream skill edits by
hand; the tool only `audit`s them. So one responsibility (memory mechanism) lives in two boxes (tool + agent
prose), episodic is special-cased, and there is no uniform typed access — violating P1·P2·P3.

**Industry standard (CoALA — already cited in-repo — + the agent-memory frameworks):** memory is a typed
SERVICE. Types: **working** (in-context/session scratch), **episodic** (events/experiences), **semantic**
(facts/knowledge), **procedural** (skills/rules). Uniform operations across types: **write/encode ·
retrieve/read · recall (relevance/semantic search) · consolidate/reflect (episodic→semantic/procedural) ·
forget/drain**. Access is a tool/service interface the agent calls; the agent holds the STRATEGY.

**Target design:**

- **`MemoryStore` PORT** (in `agent-contract`) — the uniform, type-parameterized interface: `write(type,
record) · read(type, filter) · recall(type, query) · consolidate(...) · forget(type, policy)` + a
  self-describing **type registry** (P5) so the agent can enumerate types + operations.
- **agent-memory implements the port for ALL types** — the single MECHANISM home: storage, retrieval,
  indexing/recall, structure, the type registry. No type is special; adding a type = data, not a fork (P3).
- **Transport is an ADAPTER behind the port** — CLI today (portable, zero-install — `episodic.mjs`'s virtue);
  MCP is the best-practice agent-facing option; both are adapters over the same `MemoryStore` core. **FORK
  M-transport (reviewers): CLI vs MCP vs both-over-one-core.**
- **SRP split, sharp:** the tool owns storage/retrieval/structure/recall for every type; the AGENT authors
  the CONTENT (a semantic/procedural record's prose is reasoning) and owns the CONSOLIDATION STRATEGY. dream
  becomes: read episodic (tool) → REASON: distill + route (strategy) → **write** semantic/procedural records
  (tool call), NOT hand-edit markdown. wake: read the typed stores via the tool.
- **Resolves V-mem-contract residual:** the ritual prose references the GENERIC typed operations + the
  taxonomy (a stable self-describing contract), not a per-verb episodic command sprawl. The agent "knows the
  strategy and how to interact" via one uniform interface.
- **TENSION to resolve (reviewers): curated-prose vs record-store.** SEMANTIC/PROCEDURAL are today
  human/LLM-curated PROSE (read whole at wake). Uniform CRUD suits append-records (episodic); does it suit
  curated prose? Proposed line: tool owns WHERE/HOW stored + retrieval; agent authors the prose CONTENT and
  the consolidation edit. Confirm this preserves curated-prose quality or find a better cut.

## 3. Per-box SRP audit — is every responsibility in its box?

> **SUPERSEDED by NORTH-STAR §2.2/§2.3 (round-3/4).** The agent-memory row's "recall/…for ALL types" and the
> `MemoryStore` uniform-CRUD / `SeedProvider` framing are overturned (recall is vault-only; two op-families, not
> CRUD; SeedProvider dropped as a port). The authoritative port surface + per-box responsibilities live in
> NORTH-STAR §0.2, §2.2, §2.3. Retained below for the reasoning trail.

| box                          | THE one responsibility                                                                                                                                                     | ported OUT (belongs elsewhere)                                                          | must NOT absorb                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **agent-contract**           | the shared vocabulary: types + ports (incl. `MemoryStore`, `AcceptPolicy`, `SeedProvider`→folds into MemoryStore?, `BundleArtifact`, `HarnessAdapter`, `FoundingTemplate`) | — (pure; imports nobody)                                                                | any concrete identity literal (P4/invariant-1) |
| **agent-forge** = ENGINE     | manufacture · validate · ship a cell (projection · deploy · adapters · accept ALGORITHM · CLI)                                                                             | corpus doctrine → CANON (V-init, accept-policy); memory mechanics → memory              | doctrine · memory mechanism · corpus identity  |
| **agent-anatomy** = CANON    | the corpus of cells + runtime substance + the memory/consolidation STRATEGY skills (dream·wake) + doctrine (genus)                                                         | projection/deploy/accept tooling → forge; memory MECHANICS (storage/retrieval) → memory | memory mechanism · engine tooling              |
| **agent-memory** = MECHANISM | ALL memory storage/retrieval/recall/consolidation-mechanics for ALL types + the type registry                                                                              | the routing/salience STRATEGY → CANON skills (it never reasons, P2)                     | reasoning · content authoring · doctrine       |
| **adapters** (per harness)   | harness-specific placement + path/token resolution                                                                                                                         | tool identity → generic resolver (V-adapter-path)                                       | tool/corpus identity                           |
| **CLI composition-root**     | wire concretes once (select adapter · load memory transport · discover corpus · inject policy/template)                                                                    | —                                                                                       | business logic (only wiring)                   |

**Open question the audit raises (reviewers):** does `SeedProvider` still exist, or does store-seeding fold
into `MemoryStore` (the memory service knows how to init its own stores — arguably more SRP-correct than a
separate seed port)? And does `working` memory (in-context) need a store at all, or is it the live session
that the tool never persists?
