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
- `packages/episodic` — the portable agent-memory store (`@leclabs/koine-episodic`): JSONL event store +
  dream routing. A different domain, zero-coupled to koine; extracted from `packages/koine` in the
  structure pass (`plans/repo-structure-firstprinciples`). Name keeps the `koine-` prefix pending a rename.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).
- `pre-commit` runs biome. Every commit green: `pnpm build` + `pnpm test` + `pnpm lint`.
- Push context to the load-bearing depth: repo-wide invariants here; package-load-bearing context in
  the package's own `AGENTS.md` / `CLAUDE.md`.
