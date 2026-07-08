# D5 · CLAUDE-PARTIALS — retire the node CLAUDE.md → @AGENTS.md imports

**Objective.** Remove the node `CLAUDE.md` partials that exist only to `@`-import a now-empty node `AGENTS.md`.

## Static inputs (pinned 2026-07-08)

- 8 node `CLAUDE.md` importing `@AGENTS.md`: `plans/CLAUDE.md`, `plans/run-the-business/CLAUDE.md`,
  `docs/research/CLAUDE.md`, `docs/ideation/CLAUDE.md`, `packages/agent-forge/CLAUDE.md`,
  `packages/agent-anatomy/CLAUDE.md`, `packages/agent-anatomy/src/toolkit/CLAUDE.md`,
  `packages/agent-memory/CLAUDE.md`.
- `./CLAUDE.md` (root) — imports the curated root `AGENTS.md`. **KEEP.**
- A node `CLAUDE.md` typically reads: "Agent context for this directory is maintained in `AGENTS.md` … imported
  here as a partial: `@AGENTS.md`" (e.g. `src/toolkit/CLAUDE.md:3,5`).

## Constraints

- A node `CLAUDE.md` whose SOLE content is the `@AGENTS.md` import of a now-empty node AGENTS.md → **delete**
  both files (the CLAUDE.md partial and its empty AGENTS.md), unless the AGENTS.md is intentionally curated.
- If a node `CLAUDE.md` carries OTHER content beyond the import, strip only the `@AGENTS.md` import + its
  framing sentence; keep the rest.
- Root `CLAUDE.md` + root `AGENTS.md` UNTOUCHED (curated; if D4=A, root AGENTS.md is a rule-projected file).
- Verify no build/deploy path resolves a deleted `CLAUDE.md`/`AGENTS.md` (grep code path-resolution first).

## Acceptance (falsifier)

- FAIL if a node `CLAUDE.md` still `@`-imports an empty node `AGENTS.md`.
- FAIL if the root `CLAUDE.md`/`AGENTS.md` was altered (beyond a D4 rule projection).
- FAIL if a deleted file is still referenced by a live code path.
