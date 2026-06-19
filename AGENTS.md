# polis — agent conventions

**polis** is the society layer: canonical culture (`packages/mind`) + projection machinery
(`packages/koine`). See `README.md` for the thesis and the civic ontology (oikos ⊂ polis).

## The founders

- **Nico** 📐 — master builder of the constitution, roles, archetypes, the society itself.
- **Mav** ✈️ — master builder of the infrastructure/machinery the society runs on.

`principal-ic` is **intrinsic** to both founders (a founder-genus disposition, bound to the _polis_
subject — not a path-scoped grant). To mutate the culture corpus, be Nico or delegate to him; for
infrastructure/build/delivery, Mav leads.

## Packages

- `packages/mind` — the exemplar corpus (`ideas/` cells + `toolkit/` projector). Markdown + Python;
  **not** an npm workspace member. Corpus rules: `packages/mind/ideas/AGENTS.md`. Mutate via
  `[[exemplify]]` (resolve → glossary → verify PASS → deploy). Round-trip is the acceptance gate.
- `packages/koine` — the config IR + translator (`@leclabs/koine`, formerly _agentir_). **One package**;
  `core` / `adapters` / `cli` are source areas under `src/`, exposed via subpath exports + a `koine` bin.
- `packages/episodic` — **build-only toolsource** (private; anchor `episodic`) for the agent-memory
  runtime: a JSONL event store + dream routing + the md→JSONL migration. Not a published library (zero
  importers) — `tsup` bundles `src/bin.ts` into one dependency-free `dist/episodic.mjs` that the `memory`
  skill carries to every host (`plans/memory-tool-bundling`). The `@leclabs/koine-episodic` npm identity is
  retired; the long-pending `koine-` rename is closed by that retirement.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).
- `pre-commit` runs biome. Every commit green: `pnpm build` + `pnpm test` + `pnpm lint`.
- Push context to the load-bearing depth: repo-wide invariants here; package-load-bearing context in
  the package's own `AGENTS.md` / `CLAUDE.md`.
