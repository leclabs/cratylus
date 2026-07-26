# S8 · skills-rewire

**Objective.** Rewire every memory-touching skill from bare `memory <verb>` to `agent-runtime memory <verb>` (the runtime dispatch), completing the thin-shim integration for the memory capability. This folds the c13e911 `--name <self>` work forward onto the runtime handle. Reproject so the deployed SKILL.md carries the runtime invocation.

**Static inputs (pinned):**

- `packages/agent-canon/src/skills/wake/skill.ts` — the `resolve` step (`AGENT_HOME=$(memory home --name <self>)`) + register/dream/load/encode verbs → `agent-runtime memory …`.
- `packages/agent-canon/src/skills/handoff/skill.ts:16` — `release ≜ memory session release --name <self>` → `agent-runtime memory session release --name <self>`.
- `packages/agent-canon/src/skills/{dream,praxis}/skill.ts` + any other `memory `-invoking cell — full `git grep -n "memory "` across `src/skills/` to enumerate the surface (rename-enumerates-every-dimension).
- `packages/agent-runtime` memory dispatch (dep-fed S4) — the exact `agent-runtime memory <verb>` surface to target.
- `packages/agent-canon/src/toolkit/project-cli.ts` — reproject to regenerate SKILL.md.

**Constraints.**

- Preserve c13e911 semantics: home resolution via `agent-runtime memory home --name <self>`; `$AGENT_HOME` override still honored (now by the runtime's memory strategy); no hardcoded path.
- Enumerate the FULL surface via `git grep` (non-vacuous) — every `memory ` call site, not just wake/handoff.
- Reproject + verify the emitted SKILL.md; the projected wake/handoff carry `agent-runtime memory …`, no bare `memory`.
- Do NOT change agent PROCEDURAL memories (per-agent; out of projection scope) — the skill text is the projection fix.

**Dependencies.** S4 (the `agent-runtime memory` verb surface), S6 (projection + thin-shim).

**Outputs.** wake/handoff/(dream/praxis/…) skills rewired to `agent-runtime memory …`; reprojected SKILL.md verified; canon suite green.

**Completion criteria (falsifier).** `git grep -n "\bmemory " packages/agent-canon/src/skills/` returns ZERO bare-`memory` invocations (all `agent-runtime memory …`); the projected `wake/SKILL.md` + `handoff/SKILL.md` carry the runtime handle + the `resolve`-step semantics; canon projects green. REJECTED if any bare `memory` call survives in a skill, if home-resolution semantics diverge from c13e911, or if the projection wasn't re-run/verified.
