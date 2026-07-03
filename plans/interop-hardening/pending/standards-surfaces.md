# standards-surfaces — the neutral trees: nested AGENTS.md, .agents/skills emission + mirror, standards importer

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (Rule `dir` metadata) · ⊳engine-report-machinery (order-sorted rules; doctor/report channels).

## Static

- `plans/interop-hardening/completed/standards-compat-research.RETURN.md` §1 (SKILL.md/AGENTS.md/.agents normative) + §2 matrix + §3 shortlist ([S1][S3][S7][S8][S9][S54][S60][FS9])
- `packages/agent-forge/test/stories/E7/{s02-nested-agents-md,s03-agents-skills-export,s04-claude-skills-mirror,s09-standards-importer}.test.ts` · `E10/S6.second-tier.test.ts`
- `plans/interop-hardening/stories/E7-standards-reach.md` · `stories/E10-adapter-roster.md` (E10.S6)
- `packages/agent-forge/src/core/engine/compile.ts` · `src/cli/commands/doctor.ts` · `src/core/adapter/types.ts`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **feature (neutral output surface + importer)**. Owned paths: new `src/adapters/standards/**` (canonical id from the E7.S9 probe set: `agentsmd¦agents-md¦standards¦agnostic¦neutral` — implementer picks one, test accepts any probed name) · `src/cli/commands/doctor.ts` (mirror-drift check) · engine emission glue in `src/core/engine/**` limited to nested-AGENTS.md/.agents-skills routing (no adapter-dialect edits — w5 adapter dirs are foreign owned paths).

- Nested AGENTS.md (E7.S2): `dir`-scoped rule → self-sufficient `<dir>/AGENTS.md` (anaphora denylist pinned by the test); one IR correct under closest-wins replacement [S1] AND codex root-to-cwd concatenation [S9].
- Neutral skills (E7.S3): `.agents/skills/<name>/SKILL.md` with ONLY spec fields, name = parent dir [S3][S60]; the standing guard (no IR file under `.agents/`, no harness extras) stays green.
- Claude mirror (E7.S4): `.claude/skills` = symlink (target verified) or byte-equal copy of `.agents/skills` [S8]; divergent mirror fails `agent-forge doctor`.
- Standards importer (E7.S9): dedicated roster importer lifting root+nested AGENTS.md + `.agents/skills` into IR [S1][S3][S60].
- Second-tier reach (E10.S6): Antigravity + Goose rows served by the emitted `.agents/skills/` tree [FS9][S54] — via the second-tier table, no bespoke adapters (parsimony guard stays green).

## Owned tracked ids (8)

| Story  | Test (call site)                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| E7.S2  | `packages/a-scoped rule emits a self-sufficient packages/a/AGENTS.md (anaphora denylist pinned; E9.S2 dep)`                                     |
| E7.S2  | `same IR is correct under closest-wins replacement [S1] AND Codex root-to-cwd concatenation [S9] (truth table)`                                 |
| E7.S3  | `compile emits .agents/skills/<name>/SKILL.md with ONLY spec fields, name = parent dir [S3][S60] (adapters emit vendor dirs only, §3 codex d1)` |
| E7.S4  | `.claude/skills resolves to the identical skill set: symlink (target verified) or byte-equal copy, authored once in .agents/skills [S8]`        |
| E7.S4  | `a mirror that diverges from its .agents/skills source fails agent-forge doctor (drift guard)`                                                  |
| E7.S9  | `a dedicated standards importer is in the adapter roster and lifts root+nested AGENTS.md + .agents/skills into IR [S1][S3][S60]`                |
| E10.S6 | `standards output reaches Antigravity via .agents/skills/ [FS9]`                                                                                |
| E10.S6 | `standards output reaches Goose via .agents/skills/ [S54]`                                                                                      |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E7.S3 standing guard; E7.S8 unmerged-proposals guard — no `.agents/rules/`, no frontmattered AGENTS.md; E10.S6 greens: reach rows, config-gated knobs, parsimony guard); zero non-owned `story.tracked` flips.
- Story ground: drive compile+import; observable = a neutral tree a standards-native harness (codex walk-up, Zed/Goose skills discovery) actually consumes; importer round-trips it.
- Owned paths: production diff confined to declared owned paths + roster seam; graduation flips are the only test edits.
