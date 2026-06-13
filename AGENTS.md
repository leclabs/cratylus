# polis — agent conventions

**polis** is the society layer: canonical culture (`packages/mind`) + projection machinery
(`packages/koine`). See `README.md` for the thesis and the civic ontology (oikos ⊂ polis).

## The founders

- **Nico** 📐 — master builder of the constitution, roles, archetypes, the society itself.
- **Mav** ✈️ — master builder of the infrastructure/machinery the society runs on.

`principal-ic` is **intrinsic** to both founders (a founder-genus disposition, bound to the *polis*
subject — not a path-scoped grant). To mutate the culture corpus, be Nico or delegate to him; for
infrastructure/build/delivery, Mav leads.

## Packages

- `packages/mind` — the exemplar corpus (`ideas/` cells + `toolkit/` projector). Markdown + Python;
  **not** an npm workspace member. Corpus rules: `packages/mind/ideas/AGENTS.md`. Mutate via
  `[[exemplify]]` (resolve → glossary → verify PASS → deploy). Round-trip is the acceptance gate.
- `packages/koine/{core,cli,adapters}` — the config IR + translator (ex-agentir). npm scope
  `@leclabs/koine*`. **Alignment pending:** internal `agentir` identifiers (CLI literal, `.agentir/`
  convention, DESIGN prose) are not yet re-homed — Phase-B work, do not assume done.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).
- `pre-commit` runs biome. Every commit green: `pnpm build` + `pnpm test` + `pnpm lint`.
- Push context to the load-bearing depth: repo-wide invariants here; package-load-bearing context in
  the package's own `AGENTS.md` / `CLAUDE.md`.
