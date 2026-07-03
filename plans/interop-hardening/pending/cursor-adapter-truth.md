# cursor-adapter-truth — .mdc rules, agents/commands emission, hooks version:1, MCP shape (§3 cursor d1–d6)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (Rule activation metadata for `.mdc`; McpServer `auth`).

## Static

- `packages/agent-forge/src/adapters/cursor/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Cursor" + §3 "cursor adapter" ([CU1]–[CU6])
- `packages/agent-forge/test/stories/E8/S5.cursor.test.ts` · `E7/s06-mcp-dialects.test.ts` · `E7/s07-vendor-rules-dirs.test.ts` · `E1/E1.S8.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S5) · `stories/E7-standards-reach.md` (E7.S6/S7) · `stories/E1-harness-import.md` (E1.S8: two-step agent law, persona-verbatim)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix + import feature**. Territory: `src/adapters/cursor/**`.

- Rules: written as `.cursor/rules/*.mdc` (never `.md` there); `.mdc` fixtures read (description/globs/alwaysApply) [CU1]; glob rule emits `.mdc` with that frontmatter [S19]; the UNVERIFIED-as-consumed `~/.cursor/AGENTS.md` write removed [CU1].
- Hooks: `hooks.json` carries required `"version": 1` [CU2].
- Agents: emit `.cursor/agents/*.md` with documented frontmatter [CU3]; import lifts persona-verbatim (body byte-equal; name/description/model mapped; no organ guessed); raw import→export round-trip lossless on the body (E1.S8, two-step agent law step 1).
- Commands: capability on — `.cursor/commands/*.md` [CU6].
- MCP: remote entry exactly `{url, headers?, auth?}` — no undocumented `type` key [CU5][S45].

## Owned tracked ids (11)

| Story | Test (call site)                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------- |
| E8.S5 | `hooks.json carries the required "version": 1 [CU2]`                                                           |
| E8.S5 | `rules are written to .cursor/rules/*.mdc, never .md in that dir [CU1]`                                        |
| E8.S5 | `.cursor/rules/*.mdc fixtures are read (description/globs/alwaysApply) [CU1]`                                  |
| E8.S5 | `agents emit to .cursor/agents/*.md with documented frontmatter [CU3]`                                         |
| E8.S5 | `commands capability on: .cursor/commands/*.md emitted [CU6]`                                                  |
| E8.S5 | `remote MCP drops the undocumented type key [CU5]`                                                             |
| E8.S5 | `the UNVERIFIED-as-consumed ~/.cursor/AGENTS.md is no longer written [CU1]`                                    |
| E7.S6 | `cursor: remote entry shape is exactly {url, headers?, auth?} — no undocumented type key [S45] (§3 cursor d6)` |
| E7.S7 | `glob rule emits .cursor/rules/<id>.mdc with description/globs/alwaysApply frontmatter [S19]`                  |
| E1.S8 | `cursor agent lifts persona-verbatim: body byte-equal, name/description/model mapped, no organ guessed [CU3]`  |
| E1.S8 | `raw import→export round-trip is lossless on the body: emitted cursor agent ≡ persona verbatim [CU3]`          |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S5 greens: camelCase hook events, root AGENTS.md + stdio MCP round-trip; E1.S8 green: body-is-data); zero non-owned `story.tracked` flips. Scope also declares `matchers: regex` truthfully in anatomy [CU2-class] serving convergence's E4.S5/E9.S3 without flipping them — verify those call sites stay tracked.
- Story ground: drive compile+import per §2 sheet; observable = .mdc/agents/commands trees a stock Cursor reads, and a persona-verbatim agent round-trip byte-checked.
- Territory: production diff confined to `src/adapters/cursor/**`; graduation flips are the only test edits.
