# skills-refactor (E1) — align agent-canon skills to the Agent Skills standard shape (mirror)

> Runtime folder-state is authority; this doc is downstream. Owner: `cda9ac7e` (`.owner`). Reader = LLM.

## Intent

Reshape agent-canon skills to the **standardized Agent Skills shape** — self-contained
`src/skills/<name>/` dirs (`skill.ts` → `SKILL.md`, plus `scripts/`/`references/`/`assets/`) —
while **retaining the composable-ESM authoring architecture**, AND establish the **decomplected
runtime-companion architecture**: a companion's runtime logic = a TS **domain module** coding to a
forge **`EventTapHost` port**; the harness realization = a forge **adapter** (Claude: `settings.json`
hook-merge); composed into a **dependency-free standalone `.mjs`** at projection. Unblocks E2 (event-tap).

## Census findings that shaped the cut (path:line, agent a013fad)

- Projection output is **already dir-per-skill** (`adapters/claude/write.ts:189`) → E1 is **source-side only**.
- Companions today are **principle/gate-scoped, NOT skill-runtime** (`cold-oracle` serves 4 skills; `operator-lexicon`, gates = authoring/build-time). → E1 does **not** move them into skill dirs; **event-tap is the first true runtime companion**. Shared-toolkit reorg = **E3, out of scope here**.
- **No forge runtime port; agent-canon has no build** → the port + tsup + composition are **net-new** (reuse `claude/write.ts:237-288` `serializeClaudeHooksReport` + `:126` `mergeJsonKeys`; `agent-memory/tsup.config.ts` bundling precedent).
- Deploy copy is **flat** (`deploy/local.ts:121`) → must recurse for `scripts/`.
- `AgentPlugin.skills` field appears **inert**; enumeration is `project-cli`'s own glob → registry change = the glob only.
- **memory** has no cell in canon (separate `@leclabs/agent-memory` package) → out of E1 scope.

## Slices (MECE, vertical) + R

| id     | slice                                                                                              | deps        | wave | state   |
| ------ | -------------------------------------------------------------------------------------------------- | ----------- | ---- | ------- |
| **T1** | `dir-shape` — 15 cells → `skills/<name>/skill.ts`; re-anchor every gate; projection-stable         | —           | 0    | ready   |
| **T2** | `deploy-recurse` — `placeSkillsLocal`/`ssh` recurse into skill subdirs                             | —           | 0    | ready   |
| **T3** | `runtime-port` — forge `EventTapHost` port + `EventTapHostClaude` adapter                          | —           | 0    | ready   |
| **T4** | `compose-build` — agent-canon tsup build + projectSkills composes domain⊕adapter → `scripts/*.mjs` | T1,T3       | 1    | pending |
| **T5** | `integrate` — clean-worktree gate + end-to-end runtime-companion smoke; deploy (fleet RESERVED)    | T1,T2,T3,T4 | 2    | pending |

`R = {(T4,T1),(T4,T3),(T5,T1),(T5,T2),(T5,T3),(T5,T4)}` · waves `{T1,T2,T3}→{T4}→{T5}` · frontier fan-out 3.

## Design decisions surfaced for review (Operator-on-the-loop)

1. **E1 scope excludes the shared-authoring-toolkit reorg** (cold-oracle et al.) — that's E3. E1 touches only the 15 cells' _location_ + the net-new runtime-companion infra.
2. **The port is extracted from the ONE real Claude adapter** (no speculative VS Code/Codex ports) — YAGNI + simple; a second harness is a drop-in adapter later.
3. **T5 deploy**: LOCAL in-remit; **FLEET + push RESERVED**.

## Relation to the effort chain

E1 (this) → **E2** (`event-tap`, re-cut on the new shape; `plans/event-tap` parked) → **E3** (move the projection-engine + shared-authoring modules out of `agent-canon/toolkit` into `agent-forge`). E1 absorbs the _skill-side_ of the canon↔forge boundary.
