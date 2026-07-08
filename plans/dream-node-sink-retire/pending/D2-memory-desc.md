# D2 · MEMORY-DESC — drop the AGENTS.md outward-home from memory.md

**Objective.** Remove the `AGENTS.md at scope nodes` outward-home from the memory genus description.

## Static inputs (pinned 2026-07-08)

- `packages/agent-anatomy/src/genus/memory.md:7` — the frontmatter `description:` line: "…plus outward homes
  (**AGENTS.md at scope nodes**, vault), where every record's scope is computed from its cwd…".
- **NOTE (census):** the `## Protocol` body (`:24-51`) is agent-intrinsic memory (SEMANTIC/PROCEDURAL/EPISODIC +
  the episodic tool) and does NOT mention `AGENTS.md@node` — so it is UNTOUCHED and **`make-base` is NOT
  needed** (that regen is for `## Protocol` → `base.ts` changes only).

## Constraints

- Edit `:7` only: drop "AGENTS.md at scope nodes" from the outward-homes; keep `vault`. The scope-computation
  clause (`node(cwd)`) stays — scope is still computed; it just no longer routes to a node AGENTS.md.
- σ_human\* description (human-facing selection line) — stay in that register.
- Do NOT edit the `## Protocol` body.

## Acceptance (falsifier)

- FAIL if `grep -niE 'AGENTS\.md' packages/agent-anatomy/src/genus/memory.md` matches.
- FAIL if the `## Protocol` body was edited (git diff shows a `:24-51` change) — out of scope.
- FAIL if `pnpm test` reds (projection-boundary / reader-density on the memory cell).
