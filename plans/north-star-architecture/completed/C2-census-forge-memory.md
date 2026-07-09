# C2 — census: agent-forge & agent-memory (dup · concern-mix · purity · dep-direction)

**Concern (orthogonal):** module structure + cross-package coupling of the ENGINE (`agent-forge`) and the
memory tool (`agent-memory`); where duplication, concern-mixing, impurity, and dependency-direction smells
live. Test Operator hypotheses: `deploy/seeds.ts` owns a memory concern; `scope.ts`/`deploy.ts` are forge
projection/harness concerns; functions should be pure; DI opportunities.

**static:** `packages/agent-forge/src/**`, `packages/agent-memory/src/**`, both `package.json`, `ENGINE.md`.
**scope:** read-only. No edits.
**accept:** module tree + one-line concern each; cross-package import edge list (file:line); four evidence
sections — DUPLICATION, CONCERN-MIXING, IMPURE-FUNCTIONS, DEP-DIRECTION — each finding grounded at file:line.

**Result:** → `../census/C2-forge-memory.md`. Headline: forge↔memory couple only by a filesystem bundle-path
(no code import); forge CANNOT depend on memory ⇒ memory doctrine COPIED into deploy (D4, cause of A2/A3/B1).

**dispatched:** Explore agent `a2370d08cddef9b1d` (completed).
