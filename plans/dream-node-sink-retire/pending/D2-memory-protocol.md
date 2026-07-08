# D2 · MEMORY-PROTOCOL — one curated root, no node sinks

**Objective.** Update the memory protocol (projected into every SOUL's `## Memory Protocol`) to state the
one-curated-root rule and the code-site-comment rule, removing the `AGENTS.md@node` sink language.

## Inputs

- `packages/agent-anatomy/src/genus/memory.md` `## Protocol` section (→ SOUL `## Memory Protocol` via
  `make-base`). The current text describes `AGENTS.md` at scope nodes as an outward memory home.

## Constraints

- Remove `AGENTS.md@node` as a memory home. State: **one hand-curated root `AGENTS.md`** (doctrine pointers ·
  conventions · prereqs; never dream-written); a non-derivable operational gotcha → a **comment at the code
  site**, not a sidecar. Vault stays the networked cold store.
- **Regen gotcha:** after editing `## Protocol`, run `tsx src/toolkit/make-base.ts` to regen `src/agents/base.ts`
  (the SOUL genus). The `codegen` script does NOT do this. Verify `base.ts` reflects the change.
- ρ=LLM density; the `render: verbatim` genus stays R=LLM.

## Acceptance

- FAIL if `grep -iE 'AGENTS\.md.*node|node.*AGENTS\.md|scope node' src/genus/memory.md` still frames a node
  AGENTS.md as a memory home.
- FAIL if `src/agents/base.ts` was not regenerated (its `## Memory Protocol` diverges from `memory.md`).
- FAIL if `pnpm test` reddens (projection-boundary / reader-density).
