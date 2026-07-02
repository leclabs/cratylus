# agent-factory — agent conventions

**agent-factory** is the society layer: canonical culture (`packages/agent-anatomy`) + projection machinery
(`packages/agent-forge`). See `README.md` for the thesis and the civic ontology (oikos ⊂ polis).

## The founders

- **Nico** 📐 — master builder of the constitution, roles, archetypes, the society itself.
- **Mav** ✈️ — master builder of the infrastructure/machinery the society runs on.

`principal-ic` is **intrinsic** to both founders (bound to the _polis_ subject — not a path-scoped
grant). To mutate the culture corpus, be Nico or delegate to him; for infrastructure/build/delivery,
Mav leads.

## Packages

- `packages/agent-anatomy` — the exemplar corpus, a **TS workspace member** (`@leclabs/agent-anatomy`, deps `@leclabs/agent-forge`)
  and **agent-forge's first opinionated plugin**: organ values / agents / skills are typed modules under `src/`
  (the **sole source**); markdown is a **projection**. agent-forge is the **only** projection + deploy machinery
  (`pnpm anatomy:project` / `pnpm anatomy:deploy` via agent-forge's claude adapter); the Python `toolkit/` projector was
  retired — only the shell hooks (`toolkit/{continuity,guardrail}`) remain.
  Corpus rules: `packages/agent-anatomy/ideas/AGENTS.md`. Mutate the `.ts` source via `[[exemplify]]`; the
  acceptance bar is `tsc` + the projection-stability gate (every fragment/skill/agent still projects).
- `packages/agent-forge` — the config IR + translator (`@leclabs/agent-forge`). **One package**;
  `core` / `adapters` / `cli` are source areas under `src/`, exposed via subpath exports + an `agent-forge` bin.
- `packages/agent-memory` — **build-only toolsource** (private; anchor `episodic`) for the agent-memory
  runtime: a JSONL event store + dream routing + the md→JSONL migration. Not a published library (zero
  importers) — `tsup` bundles `src/bin.ts` into one dependency-free `dist/episodic.mjs` that the `memory`
  skill carries to every host (`plans/memory-tool-bundling`). Its former standalone npm identity was
  retired in favor of `@leclabs/agent-memory`.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).
- `pre-commit` runs biome. Every commit green: `pnpm build` + `pnpm test` + `pnpm lint` + `pnpm typecheck`.
  Typecheck is the **`pre-push`** gate (not pre-commit): tsup/esbuild strip types, so `build` passes with
  real `tsc` errors and biome doesn't typecheck — `tsc --noEmit` is the only catch for that class, gated at
  push (the main-bound boundary) where turbo's content cache keeps it ~instant.
- Push context to the load-bearing depth: repo-wide invariants here; package-load-bearing context in
  the package's own `AGENTS.md` / `CLAUDE.md`.

## Memory vault (the cold 5th home)

The corpus keeps the `vault` abstract (substance-over-accident); this polis instance binds it concretely
(directive — `(directive, project)` + agent-held MEMORY for the host-derived path):

- **Personal vault** — the fleet-synced Obsidian git repo at `~/workspaces/obsidian/` (`leclabs/obsidian`,
  `~`-relative so it resolves per host). An agent graduates durable-but-voluminous knowledge here under its
  own namespace `agents/<name>/`, as sharded one-topic notes; reads the whole vault on demand.
- **Project vault** — this repo's `docs/`. Project-scoped reference knowledge (evergreen concept notes,
  ADR rationale `AGENTS.md` only points to, domain maps) lives there.
- **Graduation is a dream-time act.** A fact moves MEMORY → vault when durable but too voluminous to stay
  resident (or when it wants links); MEMORY keeps only a one-line pointer (hot index → cold corpus). The
  vault is queried on demand (file reads / graphify / Obsidian), never loaded at wake.
