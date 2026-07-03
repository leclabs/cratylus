# continue-adapter-truth — LIST-form config.yaml, .continue/rules + prompts, no AGENTS.md fabrications (§3 continue d1–d3)

**Lane** Mav · **wave(5)** · deps: ⊳engine-report-machinery (YAML merge primitive).

## Static

- `packages/agent-forge/src/adapters/continue/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Continue" + §3 "continue adapter" ([CT1]–[CT4])
- `packages/agent-forge/test/stories/E8/S9.continue.test.ts` · `E9/read-merge.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S9) · `stories/E9-ir-expressiveness.md` (E9.S4)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/continue/**`.

- MCP: emit `.continue/mcpServers/mcp.json` or a valid LIST-form `config.yaml` `mcpServers` (never the map-shaped whole-file clobber); existing user `config.yaml` never map-clobbered — required top-level keys + foreign blocks survive; LIST-form lifts on read without minting phantom server name `0` [CT4][CT1].
- Rules: `.continue/rules/*.md` [CT2]; undocumented root `AGENTS.md` and `~/.continue/AGENTS.md` writes removed; fabricated-shape import (root AGENTS.md) lifts zero phantom rules.
- Commands: invokable prompts `.continue/prompts/*.md` — `prompts: none` retired [CT3].

## Owned tracked ids (9)

| Story | Test (call site)                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| E8.S9 | `MCP emits to .continue/mcpServers/mcp.json or a valid LIST-form config.yaml [CT4][CT1]`                                 |
| E8.S9 | `an existing user config.yaml is never map-clobbered [CT1]`                                                              |
| E8.S9 | `LIST-form config.yaml mcpServers lifts on read [CT4]`                                                                   |
| E8.S9 | `rules emit to .continue/rules/*.md [CT2]`                                                                               |
| E8.S9 | `the undocumented root AGENTS.md write is gone [CT2]`                                                                    |
| E8.S9 | `the undocumented ~/.continue/AGENTS.md write is gone [CT2]`                                                             |
| E8.S9 | `commands emit as invokable prompts .continue/prompts/*.md [CT3]`                                                        |
| E8.S9 | `fabricated-shape import: root AGENTS.md lifts zero phantom rules (E1.S3) [CT2]`                                         |
| E9.S4 | `continue config.yaml: required top-level keys and foreign blocks survive; mcpServers is the documented LIST [CT1][CT4]` |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S9 green: `hooks: none` stays honest); zero non-owned `story.tracked` flips (E4.S3 stale-cells [CT3][CT6] and E4.S7 portable-core span other adapters — convergence-owned).
- Story ground: drive compile+import per §2 sheet over a populated user `config.yaml`; observable = foreign blocks intact, LIST-form mcpServers, documented rule/prompt dirs.
- Territory: production diff confined to `src/adapters/continue/**`; graduation flips are the only test edits.
