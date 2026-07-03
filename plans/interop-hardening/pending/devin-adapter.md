# devin-adapter — new adapter: Devin/Windsurf (.devin/rules 4-mode trigger, snake_case hooks, workflows)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (Rule activation metadata → `trigger:` 4-mode frontmatter [WS1]).

## Static

- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Windsurf / Devin Desktop" + §1 matrix row ([WS1]–[WS7])
- `packages/agent-forge/test/stories/E10/S3.devin.test.ts` · `plans/interop-hardening/stories/E10-adapter-roster.md` (E10.S3)
- `packages/agent-forge/src/core/adapter/types.ts` · exemplar `src/adapters/crush/**`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **feature (new adapter)**. Territory: new `src/adapters/devin/**` + append-only roster seam (`src/cli/index.ts`, `package.json` subpath export). Canonical id `devin` with `windsurf` accepted at construction (full alias/status metadata is roster-metadata's, wave 6 — do not add roster status fields here).

- Rules: preferred `.devin/rules/*.md` with `trigger:` 4-mode frontmatter [WS7][WS1]; 12k char/file cap enforced — over-cap splits or warns [WS1].
- Hooks: `hooks.json`, snake_case 12-event dialect [WS2].
- Commands: workflows `.windsurf/workflows/*.md` [WS4].
- MCP: `~/.codeium/windsurf/mcp_config.json` [WS5].

## Owned tracked ids (6)

| Story  | Test (call site)                                                                            |
| ------ | ------------------------------------------------------------------------------------------- |
| E10.S3 | `devin (or its windsurf alias) is on the adapter roster (new-adapter contract) [WS7]`       |
| E10.S3 | `rules emit to the preferred .devin/rules/*.md with trigger: 4-mode frontmatter [WS7][WS1]` |
| E10.S3 | `the 12k char/file rule cap is enforced — over-cap splits or warns [WS1]`                   |
| E10.S3 | `hooks emit to hooks.json in the snake_case 12-event dialect [WS2]`                         |
| E10.S3 | `workflows: commands emit to .windsurf/workflows/*.md [WS4]`                                |
| E10.S3 | `MCP emits to ~/.codeium/windsurf/mcp_config.json [WS5]`                                    |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken; zero non-owned `story.tracked` flips (E10.S5 alias/status ids are roster-metadata-owned — verify they stay tracked).
- Story ground: drive compile+import per §2 sheet; observable = trees a stock Windsurf/Devin reads (trigger modes, event dialect, cap behavior on an over-12k rule).
- Territory: production diff confined to `src/adapters/devin/**` + declared seams; graduation flips are the only test edits.
