# pi-adapter — new adapter: pi (natural config surfaces + the code-emission/plugin-delivery demonstration)

**Lane** Mav · **wave(5)** · deps: ⊳engine-report-machinery (plugin route + skip vocabulary + report channels).

## Static

- `plans/interop-hardening/completed/pi-harness-research.RETURN.md` (WHOLE sheet — [PI1]–[PI13]; the 13 owned ids below are its pre-built criteria)
- `packages/agent-forge/test/stories/E5/S8.pi-demonstration.test.ts` · `E10/S8.pi-natural.test.ts` · `E10/S9.pi-code-emission.test.ts`
- `plans/interop-hardening/stories/E5-plugin-adapters.md` (E5.S8) · `stories/E10-adapter-roster.md` (E10.S8/S9)
- `packages/agent-forge/src/core/adapter/types.ts` · exemplar `src/adapters/crush/**`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **feature (new adapter, two delivery modes)**. Territory: new `src/adapters/pi/**` + append-only roster seam (`src/cli/index.ts`, `package.json` subpath export).

Natural surfaces (E10.S8): roster registration; rules = root AGENTS.md unchanged (native walk-up concat, no `.pi/AGENTS.md`) [PI2]; skills = `.agents/skills/` tree unchanged, frontmatter constraints enforced (name ≤64 `[a-z0-9-]`, description required ≤1024, name = dirname spec-strict) [PI5]; commands → `.pi/prompts/*.md` with description/argument-hint frontmatter + `$1`/`$ARGUMENTS` substitution [PI7]; capabilities honest — hooks/agents/permissions absent as CONFIG surfaces, `mcp: none` by design [PI2].

Code emission (E10.S9 + E5.S8): all code-shaped resources ship as ONE pi package — `package.json {keywords:["pi-package"], pi:{extensions}}`; report carries the install line + full-system-access caution [PI6]; trust-gate warning on every project-scope write [PI2]; hooks map onto `pi.on()` — blocking = `tool_call` veto `{block: true, reason}`, result-mutating = `tool_result`, plus `session_start`/`input`; unverified canonical events land in `.skipped` [PI3]; agents = subagent-pattern (md defs at `.pi/agents/*.md` + registerTool delegate extension) [PI9]; round-trip honesty — code emissions write-only, reimport lifts config surfaces and reports foreign extension files under unlifted-surfaces, never parses TS as config [PI3].

## Owned tracked ids (13)

| Story  | Test (call site)                                                                                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E5.S8  | `skills floor discharged natively: .agents/skills/ emission, name = dirname spec-strict despite pi tolerating the deviation [PI5]`                                                |
| E5.S8  | `agents via code: md defs at .pi/agents/*.md + a registerTool delegate extension per the official subagent example [PI9]`                                                         |
| E5.S8  | `hooks via pi.on(): tool_call veto {block, reason} · tool_result · session_start · input; unverified canonical events land in .skipped [PI3]`                                     |
| E5.S8  | `one pi package: package.json {keywords:["pi-package"], pi:{extensions}} manifest; trust-gate warning on every project-scope write [PI6][PI2]`                                    |
| E10.S8 | `pi is on the adapter roster (new-adapter contract)`                                                                                                                              |
| E10.S8 | `rules: root AGENTS.md lands unchanged (native walk-up concat); no .pi/AGENTS.md — that surface does not exist [PI2]`                                                             |
| E10.S8 | `skills: .agents/skills/ tree unchanged (native discovery); frontmatter constraints enforced (name ≤64 [a-z0-9-], description required ≤1024) [PI5]`                              |
| E10.S8 | `commands → prompt templates .pi/prompts/*.md with description/argument-hint frontmatter and $1/$ARGUMENTS substitution [PI7]`                                                    |
| E10.S8 | `capabilities honest: hooks/agents/permissions absent as CONFIG surfaces (code delivery is E10.S9); mcp none by design [PI2]`                                                     |
| E10.S9 | `all code-shaped resources ship as ONE pi package; report carries the pi install line + full-system-access caution [PI6]`                                                         |
| E10.S9 | `hooks map onto pi.on() per the E5.S8 table; blocking = tool_call veto {block: true, reason}; result-mutating = tool_result [PI3]`                                                |
| E10.S9 | `agents: subagent-pattern emission (md defs + registerTool delegate) — the future Tool-resource serializer seed [PI9]`                                                            |
| E10.S9 | `round-trip honesty: code emissions are write-only; reimport lifts config surfaces and reports foreign extension files under unlifted-surfaces — never parses TS as config [PI3]` |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken; zero non-owned `story.tracked` flips.
- Story ground: drive compile+import per the pi RETURN sheet; observable = a pi package a stock `@earendil-works` pi installs, natural surfaces untouched where native, trust warnings in the report.
- Territory: production diff confined to `src/adapters/pi/**` + declared seams; graduation flips + the roster-growth bite-guards are the only test edits (zed precedent `d318b20`: `test/stories/helpers.ts` roster, `E6/S6` roster count, `E4/capability-honesty` GROUND_TRUTH row, `docs/release-audit-checklist.md` row — mechanical, disclose each in RETURN). Roster-count guards are increment-at-commit-time: siblings are growing the roster concurrently — re-read the count from the tree you commit atop, never a pinned number.
