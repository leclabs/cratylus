# polis-machinery (Phase B)

**Goal.** Operationalize culture→config projection into dependable, universal machinery — so an Operator
can base or rebase a project on polis regardless of which agent client they use.

**Scope.** `packages/koine/**` (the IR + translator, ex-agentir) and `packages/mind/toolkit/**` (the
corpus projector), plus the bridge between them, plus continuity & release automation.

**Lead.** Nico (projection semantics, the reconstruction oracle) + Mav (koine engineering, hooks, the
runtime seam). The architecture: `mind corpus (culture) → koine IR (config) → any client`.

**Exit criteria.**
- koine is fully renamed (no `agentir` residue) and culturally aligned (config re-homed as projections
  of the corpus; biome-conformant; green build + test).
- A mind-society's culture compiles to any koine-supported client via the IR.
- The reconstruction oracle gates projection (`accept(F)` mechanical, not manual).
- Continuity-at-workflow-boundary hooks and release self-update hooks are live.

**Carried forward:** `playground/plans/markdown-ast-compose` task 05 → **B2**.
