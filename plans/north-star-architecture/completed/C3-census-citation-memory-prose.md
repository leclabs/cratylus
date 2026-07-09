# C3 — census: citation cruft + memory prose-vs-tool

**Concern (orthogonal):** (1) the legacy markdown citation mechanism (`[[wikilink]]` / backtick cite-by-ref)
— where it lives, what parses/gates it, vs the live ESM/anchor composition; (2) prose (genus/skills) that
RE-DEFINES what the `agent-memory` tool already deterministically encodes.

**static:** `packages/agent-anatomy/src/genus/memory.md`, `packages/agent-anatomy/src/skills/**`,
`packages/agent-memory/src/**`, `packages/agent-anatomy/test/skill-shape.test.ts`,
`packages/agent-forge/src/core/exemplify/**`, tracked `[[…]]` occurrences (git grep).
**scope:** read-only. No edits.
**accept:** citation inventory (classified genuine-vs-incidental, file:line) + list of code that
parses/projects/gates citation; tool-encoded-capability list + prose-duplication table (prose file:line ↔
code file:line it re-states).

**Result:** → `../census/C3-citation-memory-prose.md`. Headline: `[[…]]` parser is orphaned
(`skill-shape.test.ts:86`), docs:check gate unimplemented; a LIVE bare-anchor skill-composition successor
exists (do not kill). `genus/memory.md` + `dream.ts` re-specify tool mechanics (confirmed).

**dispatched:** Explore agent `a624c53923379da41` (completed).
