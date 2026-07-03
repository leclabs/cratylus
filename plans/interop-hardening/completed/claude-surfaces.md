# claude-surfaces — CLAUDE.md projection + managed regions, .claude/rules, local tier, hook modeling, plugin bundle

**Lane** Mav · **wave(6)** · deps: ⊳claude-mcp-rehoming (same files — serial by owned paths) · ⊳ir-schema-expressiveness (Rule activation `paths:`) · ⊳engine-report-machinery (managed-region primitive, no-local-tier discipline).

## Static

- `packages/agent-forge/src/adapters/claude/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Claude Code" + §3 "claude adapter" ([CC1][CC4][CC5][CC6]) · `completed/standards-compat-research.RETURN.md` [S7]
- `packages/agent-forge/test/stories/E8/S1.claude.test.ts` · `E7/s05-claude-md-projection.test.ts` · `E3/e3s5-foreign-content.test.ts` · `E2/e2s5-local-compile.test.ts` · `E9/read-merge.test.ts` · `E5/S5.claude-plugin-bundle.test.ts`
- `plans/interop-hardening/stories/{E8-divergence-fixes,E7-standards-reach,E3-reimport,E2-ir-emission,E9-ir-expressiveness,E5-plugin-adapters}.md`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix + plugin-bundle feature**. Owned paths: `src/adapters/claude/**` (rules/hooks/CLAUDE.md/local/plugin paths — MCP/settings landed in wave 5) + a compile bundling flag surface in `src/cli/commands/compile.ts` for `--as-plugin`.

- CLAUDE.md: emitted body = exactly the `@AGENTS.md` import (+ at most a fixed managed header), rule bodies absent [S7]; hand-maintained content preserved (marker-delimited managed region, documented markers) [CC1]; foreign `statusLine` settings key survives (E3.S5).
- Rules: non-concat rules → `.claude/rules/*.md`; `.claude/rules/*.md` with `paths:` frontmatter read; `.claude/CLAUDE.md` alt location read; local-scope rules → `CLAUDE.local.md` (the "local has no rules" warning gone) [CC1].
- Hooks: capability declares regex matchers (not glob); non-command hook types (`prompt`) lifted; `if`/`env` fields round-trip read→write [CC6].
- Plugin bundle (E5.S5): full IR → documented Claude plugin tree `.claude-plugin/plugin.json` + `skills/` + `agents/` + `hooks/hooks.json` + `.mcp.json` [CC4][CC5]; plugin.json carries required `name`; hooks use `${CLAUDE_PLUGIN_ROOT}`.

## Owned tracked ids (16)

| Story | Test (call site)                                                                                                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| E8.S1 | `.claude/CLAUDE.md alt location is read [CC1]`                                                                                                      |
| E8.S1 | `.claude/rules/*.md with paths: frontmatter is read [CC1]`                                                                                          |
| E8.S1 | `non-concat rules are written to .claude/rules/*.md [CC1]`                                                                                          |
| E8.S1 | `local-scope rules emit to CLAUDE.local.md [CC1]`                                                                                                   |
| E8.S1 | `CLAUDE.md writes are non-destructive to hand-maintained content (E3.S5) [CC1]`                                                                     |
| E8.S1 | `hook capability declares regex matchers, not glob [CC6]`                                                                                           |
| E8.S1 | `non-command hook types (prompt) are lifted, not silently dropped [CC6]`                                                                            |
| E8.S1 | `hook fields if/env round-trip through read → write [CC6]`                                                                                          |
| E2.S5 | `claude local rules land in CLAUDE.local.md; the "local has no rules" warning is gone [CC1]`                                                        |
| E3.S5 | `foreign settings key statusLine is present byte-identical after import + compile`                                                                  |
| E3.S5 | `forge-managed regions in CLAUDE.md are delimited by documented markers`                                                                            |
| E9.S4 | `CLAUDE.md: hand-written content survives; forge rules sit in a marker-delimited managed region [CC1]`                                              |
| E7.S5 | `emitted CLAUDE.md body is exactly the @AGENTS.md import (+ at most a fixed managed header), rule bodies absent [S7]`                               |
| E7.S5 | `a pre-existing hand-maintained CLAUDE.md is preserved through compile (E3.S5 foreign-content bullet; §3 claude d5)`                                |
| E5.S5 | `a full IR compiles to the documented Claude plugin tree: .claude-plugin/plugin.json + skills/ + agents/ + hooks/hooks.json + .mcp.json [CC4][CC5]` |
| E5.S5 | `the emitted plugin dir passes structural validation: plugin.json carries the required name [CC4] and hooks use ${CLAUDE_PLUGIN_ROOT}`              |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S1 greens incl. wave-5 graduates: `.mcp.json`/`~/.claude.json`/settings-policy; E7.S5's sibling E7.S10 premise carrier: claude writes CLAUDE.md, never AGENTS.md; E3.S5 greens: hand section, forge-managed permissions); zero non-owned `story.tracked` flips (E4.S5/E9.S3 declaration call sites span other adapters — convergence-owned).
- Story ground: drive compile+import over a repo with hand-maintained CLAUDE.md + foreign settings; observable = preserved content, managed markers, `@AGENTS.md` projection, a structurally valid plugin dir.
- Owned paths: production diff confined to declared owned paths; graduation flips are the only test edits.
