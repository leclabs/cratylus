# C2 findings — agent-forge & agent-memory: duplication, concern-mix, purity, dep-direction

Source: Explore census of `packages/agent-forge/src/**`, `packages/agent-memory/src/**`.

## Topology (the headline)

- **agent-forge → agent-anatomy: NO code import.** Forge is deliberately doctrine-agnostic; it discovers
  the corpus as a runtime DIRECTORY (`cli/commands/catalog.ts:30-69`, `catalog/index.ts:12`).
- **agent-anatomy → agent-forge: type-only** (`import type` — erases at compile).
- **agent-memory → nobody; nobody imports it as code.** Bundled as build artifact `dist/episodic.mjs`,
  referenced by STRING PATH only (`genus/memory.md:5`, `deploy/bundle.ts:47`, `project-cli.ts:167`).
- ⇒ The real inter-package seam is a **filesystem-path/bundle contract, not a type contract.**

## Duplication

- **A1** `.agent-factory.config` parsed independently in forge (`deploy/config.ts:29-70`) AND memory (`node.ts:218-248`) — two hand-kept readers of one JSON contract.
- **A2** memory-store filename set + seed TEMPLATE declared in forge (`deploy/seeds.ts:74-78`) while store semantics live in memory (`route.ts:24-40`, `store.ts:32`, `dream.ts`).
- **A3** v1-retirement doctrine (SELF/MEMORY retired) enforced in memory (`route.ts:20-22`, `dream.ts:52-60`) AND restated in forge (`seeds.ts:14-16`).
- **A4** `organTitle` duplicated: `adapters/claude/anatomy.ts:29-31` vs `anatomy/project-human.ts:28-30`.
- **A5** scope/node computation overlap: `agent-memory/node.ts:30-38` vs `agent-forge/deploy/scope.ts:42-63` (both re-derive $HOME / project-root).

## Concern-mixing

- **B1 (CONFIRMED headline)** `deploy/seeds.ts` generates memory-store CONTENT (`semanticSeed:33-50`, `proceduralSeed:52-66`) — memory doctrine leaking into the placement layer. deploy's legit concern = placement (ship bytes, seed-if-absent).
- **B2** deploy hard-codes the memory artifact identity (`bundle.ts:47`, `cli/commands/deploy.ts:78` name `agent-memory`/`episodic.mjs`).
- **B3** harness-neutral anatomy-composition lodged in the claude adapter (`adapters/claude/anatomy.ts`); codex reaches sideways (`adapters/codex/anatomy.ts:23` imports `../claude/anatomy.js`).

## Impurity (pure core recoverable)

- **C1** `semanticSeed`/`proceduralSeed` mix pure template + inline `today()` clock (`seeds.ts:24-31,33,52`). Easy purify: `seed(name, date)`.
- **C2** `dream.compact` (`dream.ts:115-166`) partition logic entangled with fs + `Date.now()`/pid tmp path.
- **C4** `node.loadNodeConfig` read + merge in one shot.
- Good model to follow: `EpisodicStore` seams purity via injectable `DeriveEnv` + `ulid`; pure core in `record.ts`.

## Dependency-direction

- **D1** No cycles in either package (clean DAGs).
- **D2** cross-adapter sideways edge codex→claude (`adapters/codex/anatomy.ts:23`).
- **D3 (latent risk)** clean code-direction upheld only because real coupling is externalized to STRINGS/PATHS the compiler can't enforce — a lower-level change (rename `episodic.mjs`, move `organs/`, change config schema) breaks a higher consumer SILENTLY.
- **D4 (deep cause)** memory doctrine flows the wrong way into deploy BECAUSE forge cannot depend on memory (build-only/private) — so the knowledge was COPIED not imported. Structural cause of A2/A3/B1.
