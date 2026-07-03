# claude-mcp-rehoming — MCP out of settings.json into .mcp.json / ~/.claude.json; settings merge-safe

**Lane** Mav · **wave(5)** · deps: ⊳engine-report-machinery (merge primitives, import-report channels).

## Static

- `packages/agent-forge/src/adapters/claude/{anatomy,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Claude Code" + §3 "claude adapter" ([CC7][CC8])
- `packages/agent-forge/test/stories/E8/S1.claude.test.ts` · `E7/s06-mcp-dialects.test.ts` · `E9/read-merge.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S1) · `stories/E7-standards-reach.md` (E7.S6) · `stories/E9-ir-expressiveness.md` (E9.S4)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/claude/**` — MCP + settings.json surfaces ONLY (rules/hooks/CLAUDE.md/local/plugin surfaces belong to `claude-surfaces`, wave 6, same files later — do not touch those code paths).

- Emit: project-scope servers → repo-root `.mcp.json` under `mcpServers` [CC7][S44]; user-scope → `~/.claude.json` [CC7]; `mcpServers` never written into settings.json at any scope — settings carries policy keys only [CC8].
- Read: settings.json-only `mcpServers` fixture lifts zero phantom servers (fabricated-shape import, E1.S3 discipline) [CC8].
- Merge: settings.json writes preserve foreign keys byte-for-byte (use the wave-4 engine merge primitive) [CC8].

## Owned tracked ids (7)

| Story | Test (call site)                                                                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| E8.S1 | `project-scope MCP servers emit to .mcp.json at repo root [CC7]`                                                                        |
| E8.S1 | `user-scope MCP servers emit to ~/.claude.json [CC7]`                                                                                   |
| E8.S1 | `mcpServers never appears in settings.json — policy keys only [CC8]`                                                                    |
| E8.S1 | `user-scope settings.json carries no mcpServers key [CC8]`                                                                              |
| E8.S1 | `fabricated-shape import: settings.json-only mcpServers lifts zero phantom servers (E1.S3) [CC8]`                                       |
| E7.S6 | `claude project scope: servers land in repo-root .mcp.json under mcpServers [S44] (adapter writes settings.json instead, §3 claude d1)` |
| E9.S4 | `claude settings.json: foreign keys survive a compile byte-for-byte [CC8]`                                                              |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S1 green companions: policy keys, settings.local.json; E3.S5 green: forge-managed permissions survive); zero non-owned `story.tracked` flips.
- Story ground: drive `compile`/`import` on a claude target with a foreign-keyed settings.json + both MCP scopes; inspect emitted files and lifted IR — observable behavior per E8.S1/E7.S6/E9.S4 story acceptance.
- Territory: production diff confined to claude MCP/settings code paths; graduation flips are the only test edits.
