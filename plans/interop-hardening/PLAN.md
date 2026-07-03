# interop-hardening — pressure-test and harden the library's capability surface

**The initiative.** The repo stands on a stable foundation; this plan strengthens, improves, fixes,
and pressure-tests every intended capability of the library (agent-forge as the common tongue +
agent-anatomy as its opinionated corpus): harness interop (import → IR → export, round-trip
accurate), the conventional `.{namespace}/` output surface, plugin-architecture adapters where a
harness lacks native support, and the context-optimization pipeline (raw operator context →
exemplify → reader=LLM artifacts). Method: research the landscape → a full user-story library →
tests that cover every story (failing tests define the gap) → implementation shards that close it.

## Status mirror

DAG: `wave(0) {harness-landscape-research · standards-compat-research}` →
`wave(1) {capability-user-stories ⊳ both}` → `wave(2) {story-coverage-tests ⊳ stories}` →
`wave(3) {author-implementation-shards ⊳ tests}` → `wave(4+) {the emitted implementation shards}`.

**Active:**

- `capability-user-stories` — the full story library over the capability floor; consumes both
  research RETURNs (in `completed/`, dep-fed).

**Pending:**

- `story-coverage-tests` — an executable test per story; failing tests are the gap statement.
- `author-implementation-shards` — one ⟨static, scope, accept⟩ shard per failing-test cluster,
  emitted into `pending/`.

**Completed:** `harness-landscape-research` · `standards-compat-research` (RETURN.md beside each —
the wave-1 dep-fed inputs).
