# C1 — census: package-boundary placement (toolkit → forge/anatomy/memory)

**Concern (orthogonal):** WHERE each unit of logic belongs under `ENGINE ⊥ MODEL` (ENGINE.md).
MODEL fixes invariants; ENGINE realizes them + owns `boundary-projection ≜ {deploy, project-human}`.
Hypotheses to test (Operator's, treat as falsifiable): `agent-anatomy/src/toolkit/` does too much;
most is a FORGE concern (projection/harness/build/deploy) and belongs in `agent-forge`; exceptions that
rightly stay in anatomy = skill-scripts + hook-handlers (runtime substance of what an agent IS);
`scope.ts` + `deploy.ts` are unambiguous FORGE concerns.

**Hard constraint (pinned):** dep direction is `agent-anatomy → agent-forge` (anatomy imports
`@leclabs/agent-forge/*`; forge MUST NOT import anatomy — cycle). Any anatomy→forge relocation is legal
ONLY for logic that does not depend on anatomy cells. Flag every candidate that violates this.

**static (pinned inputs):**

- `packages/agent-anatomy/src/toolkit/**` (every file)
- `packages/agent-anatomy/package.json`, `packages/agent-forge/package.json` (dep edges + exports)
- `ENGINE.md`, `MODEL.md` (the boundary law)

**scope:** read-only classification. No edits.

**accept (falsifier):** a table — every `toolkit/**` file × {ANATOMY-CONCERN | FORGE-CONCERN | AMBIGUOUS}
× import-set × cycle-risk-if-relocated (Y/N + why) — grounded at file:line; plus the 3–5 clearest
forge-concerns-in-anatomy named. Fails if any file is unclassified or any classification lacks a
file:line ground.

**dispatched:** Explore agent `a9e053f686a1fb042` (in flight).
