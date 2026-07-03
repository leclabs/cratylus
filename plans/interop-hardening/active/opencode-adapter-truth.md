# opencode-adapter-truth — opencode.json as the one config home; injective events; verified plugin names (§3 opencode d1–d5)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (McpServer command-as-ARRAY) · ⊳engine-report-machinery (key-scoped JSON merge).

## Static

- `packages/agent-forge/src/adapters/opencode/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "opencode" + §3 "opencode adapter" ([OC1]–[OC8])
- `packages/agent-forge/test/stories/E8/S6.opencode.test.ts` · `E4/event-taxonomy.test.ts` · `E5/S4.hook-plugins.test.ts` · `E9/read-merge.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S6) · `stories/E4-roundtrip.md` (E4.S4) · `stories/E5-plugin-adapters.md` (E5.S4) · `stories/E9-ir-expressiveness.md` (E9.S4)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/opencode/**`.

- MCP: under the `mcp` key of `opencode.json`, typed `local`, command as ARRAY; fabricated `.opencode/mcp.json` never emitted; foreign keys of `opencode.json` preserved on write [OC7].
- Permissions/env: no `permissions.json` — IR permissions map to the permission DSL in `opencode.json` [OC8]; no fabricated `env.json` [OC1]; fabricated-shape import (`.opencode/{mcp,permissions,env}.json`) lifts zero phantoms.
- Agents/commands: capabilities on — `.opencode/agents/*.md` with `mode` field [OC2]; `.opencode/commands/*.md` [OC4].
- Events: eventMap injective — `agent.idle` and `turn.end` must not collide on `session.idle`; `toCanonical(toNative(e)) = e`; hook-plugin shim maps ONLY [OC5]-verified event names, unverified excluded until re-verified.

## Owned tracked ids (12)

| Story | Test (call site)                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| E8.S6 | `MCP lives under the mcp key of opencode.json, typed local, command as ARRAY [OC7]`                                 |
| E8.S6 | `the fabricated .opencode/mcp.json is never emitted [OC7]`                                                          |
| E8.S6 | `agents capability on: .opencode/agents/*.md with mode field [OC2]`                                                 |
| E8.S6 | `commands capability on: .opencode/commands/*.md emitted [OC4]`                                                     |
| E8.S6 | `no permissions.json; IR permissions map to the permission DSL in opencode.json [OC8]`                              |
| E8.S6 | `no fabricated env.json is emitted [OC1]`                                                                           |
| E8.S6 | `hook-plugin shim maps only [OC5]-verified event names (E5.S4)`                                                     |
| E8.S6 | `fabricated-shape import: .opencode/{mcp,permissions,env}.json lift zero phantom resources (E1.S3) [OC7][OC8][OC1]` |
| E4.S4 | `opencode: eventMap injective — agent.idle and turn.end must not collide on session.idle`                           |
| E4.S4 | `opencode: toCanonical(toNative(e)) = e (agent.idle and turn.end collide on session.idle)`                          |
| E5.S4 | `opencode: only the [OC5]-verified plugin event names are mapped; unverified names are excluded until re-verified`  |
| E9.S4 | `opencode.json: mcp lands under the documented "mcp" key with foreign keys preserved [OC7]`                         |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S6 green: AGENTS.md+plugin-sidecar round-trip; E5.S4 greens: PreToolUse shim, loud skip; E4.S4 green: verified plugin events exact); zero non-owned `story.tracked` flips.
- Story ground: drive compile+import per §2 sheet on a foreign-keyed `opencode.json`; observable = one config home, no sidecar fabrications, injective event mapping.
- Territory: production diff confined to `src/adapters/opencode/**`; graduation flips are the only test edits.
