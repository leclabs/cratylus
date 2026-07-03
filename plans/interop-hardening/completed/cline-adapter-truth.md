# cline-adapter-truth — .clinerules hooks/workflows, AGENTS.md-native rules, documented homes (§3 cline d1–d6)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (Rule activation `paths:` metadata).

## Static

- `packages/agent-forge/src/adapters/cline/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Cline" + §3 "cline adapter" ([CL1]–[CL6])
- `packages/agent-forge/test/stories/E8/S7.cline.test.ts` · `E4/event-taxonomy.test.ts` · `E4/matcher-semantics.test.ts` · `E7/s01-agents-md-canonical.test.ts` · `E7/s07-vendor-rules-dirs.test.ts` · `E5/S3.skills-native-guard.test.ts` · `E2/e2s4-user-compile.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S7) · `stories/E4-roundtrip.md` (E4.S4/S5) · `stories/E7-standards-reach.md` (E7.S1/S7) · `stories/E5-plugin-adapters.md` (E5.S3) · `stories/E2-ir-emission.md` (E2.S4)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/cline/**`.

- Hooks: per-event executable scripts in `.clinerules/hooks/` [CL2][CL3]; fabricated `.cline/hooks.json` never emitted and lifts zero phantoms; event set = the documented 6 (no TaskComplete/PreCompact) [CL2]; matcher on a hook warns `matcher-unsupported` instead of silently emitting one.
- Rules: plain rule → root `AGENTS.md` (native reader [S22]), not a `.clinerules` file; glob rule → `.clinerules/<id>.md` with `paths:` frontmatter preserving activation; global rules → `~/Documents/Cline/Rules`, never `~/.cline/rules` [CL1].
- Skills: capability on — `.cline/skills/` emitted (native SKILL.md discovery [CL5]). Commands: workflows `.clinerules/workflows/*.md` [CL4].
- MCP: undocumented project `.cline/mcp.json` not emitted silently — warn or omit [CL6].

## Owned tracked ids (15)

| Story | Test (call site)                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------- |
| E8.S7 | `hooks emit as per-event executable scripts in .clinerules/hooks/ [CL2][CL3]`                         |
| E8.S7 | `the fabricated .cline/hooks.json is never emitted [CL2]`                                             |
| E8.S7 | `event set is the documented 6 — no TaskComplete/PreCompact mappings [CL2]`                           |
| E8.S7 | `global rules emit to ~/Documents/Cline/Rules [CL1]`                                                  |
| E8.S7 | `skills capability on: .cline/skills/ emitted [CL5]`                                                  |
| E8.S7 | `commands emit as workflows .clinerules/workflows/*.md [CL4]`                                         |
| E8.S7 | `project MCP: undocumented .cline/mcp.json is not emitted silently — warn or omit [CL6]`              |
| E8.S7 | `fabricated-shape import: .cline/hooks.json lifts zero phantom hooks (E1.S3) [CL2]`                   |
| E4.S4 | `cline: fabricated TaskComplete/PreCompact are gone (documented set is 6 events) [CL2]`               |
| E4.S5 | `cline: matcher on a hook warns matcher-unsupported instead of silently emitting one [CL2]`           |
| E7.S1 | `cline (AGENTS.md-native per matrix [S1]/[S22]) is served by the same root AGENTS.md artifact`        |
| E7.S7 | `cline: plain rule lands in root AGENTS.md (native reader [S22]), not as a .clinerules file`          |
| E7.S7 | `glob rule emits .clinerules/<id>.md with paths: frontmatter preserving activation [S22]`             |
| E5.S3 | `cline: native SKILL.md discovery exists [CL5] but the adapter does not yet emit skills to that path` |
| E2.S4 | `cline global rules land under ~/Documents/Cline/Rules — NOT ~/.cline/rules [CL1]`                    |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S7 greens: `~/.cline/mcp.json` user CLI target, multi-file `.clinerules/*.md` round-trip; E4.S4 green: cline injective); zero non-owned `story.tracked` flips (E4.S3 stale-cells and E4.S7 portable-core span other adapters — convergence-owned; verify they stay tracked).
- Story ground: drive compile+import per §2 sheet; observable = a tree a stock Cline reads (root AGENTS.md, documented homes, 6-event hooks).
- Territory: production diff confined to `src/adapters/cline/**`; graduation flips are the only test edits.
