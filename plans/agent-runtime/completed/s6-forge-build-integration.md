# S6 · forge-build-integration

**Objective.** Wire the BUILD host to the runtime contract. `agent-forge` deps `@leclabs/agent-runtime`; the projection emits, for a skill's `runtime: {capability}` declaration, a **THIN SHIM script** that calls `agent-runtime <capability> <verb>` (REVERSING skills-refactor T4's dep-free-bundle composition); and forge STOPS carrying the memory seed templates (now owned by agent-memory, S4).

**Static inputs (pinned):**

- `packages/agent-runtime/src/plugin.ts` + ports — the runtime contract forge composes against (dep-fed S1).
- `packages/agent-canon/src/toolkit/project-cli.ts:125-150` — `projectSkills` (today emits SKILL.md only); the site that must ALSO emit the thin-shim `scripts/<cap>.mjs` when a skill declares `runtime`.
- `packages/agent-forge/src/anatomy/index.ts:266-296` — `SkillDeploy`/`Skill.runtime?` field (the companion declaration the projection reads; align with S1's capability naming).
- `packages/agent-forge/src/deploy/{seeds.ts, local.ts:59-73, ssh.ts:155-175}` — the seed sites: forge STOPS sourcing SEED_FILES from itself, sources them from agent-memory (S4 export); the deploy home-target (~/.agents, c13e911) stays.
- `plans/skills-refactor/pending/t4-compose-build.md` — the SUPERSEDED design (read to invert, per S2).

**Constraints.**

- The thin shim is minimal: `agent-runtime <capability> <verb> "$@"` (or the node-app entry) — NOT a bundle of the impl. The impl lives host-side (S3+S4+S5) + is guaranteed by S7's install.
- forge deps `@leclabs/agent-runtime` (workspace:\*); DAG stays acyclic (forge→runtime; runtime NEVER →forge).
- Seed removal: forge's deploy imports seeds from agent-memory; deleting forge's own `seeds.ts` templates. Keep deploy's ~/.agents home-target (c13e911) intact.
- Projection stays dir-per-skill; a skill WITHOUT `runtime` emits SKILL.md only (unchanged).

**Dependencies.** S1. (Consumes S4's seed export + S3's shim target at INTEGRATION — but authored against S1's contract; the seed-import + shim-verb are dep-fed and finalized when S4/S3 land. If S4 not yet complete at dispatch, stub the seed import behind the agreed S4 export name.)

**Outputs.** forge `package.json` +runtime dep; `projectSkills` emits thin-shim `scripts/<cap>.mjs` for `runtime`-declaring skills; forge seeds sourced from agent-memory; forge `seeds.ts` templates removed; tests updated.

**Completion criteria (falsifier).** Projecting a skill with `runtime:{capability:'memory'}` emits a `scripts/*.mjs` that invokes `agent-runtime memory …` (grep the output — NO bundled impl, NO `@leclabs/*` import in the shim); forge no longer defines SEED_FILES templates (they resolve from agent-memory); forge suite green; DAG acyclic (no runtime→forge import). REJECTED if the projected companion is a fat/dep-free bundle, if forge still owns seed templates, or if forge is imported by the runtime.
