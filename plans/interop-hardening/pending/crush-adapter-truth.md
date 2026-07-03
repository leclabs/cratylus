# crush-adapter-truth — crush.json as config home; honest hooks/permissions; CRUSH.md user rules (§3 crush d1–d6)

**Lane** Mav · **wave(5)** · deps: ⊳engine-report-machinery (key-scoped JSON merge).

## Static

- `packages/agent-forge/src/adapters/crush/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Crush" + §3 "crush adapter" ([CR1]–[CR3])
- `packages/agent-forge/test/stories/E8/S8.crush.test.ts` · `E9/read-merge.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S8) · `stories/E9-ir-expressiveness.md` (E9.S4)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/crush/**`.

- MCP: under the `mcp` key of `crush.json` with required-style `type`; fabricated `.crush/mcp.json` never emitted and lifts zero phantoms; foreign keys of `crush.json` preserved [CR1].
- Hooks: capability on — `hooks.PreToolUse` lands in `crush.json` [CR3]; matchers declared regex truthfully (serves convergence's E4.S5/E9.S3 — do not flip those call sites).
- Permissions: capability reflects `permissions.allowed_tools` [CR1].
- User rules: `~/.config/crush/CRUSH.md` (or `~/.config/AGENTS.md`); fabricated `~/.config/crush/AGENTS.md` not written [CR1][CR2].

## Owned tracked ids (8)

| Story | Test (call site)                                                                         |
| ----- | ---------------------------------------------------------------------------------------- |
| E8.S8 | `MCP lives under the mcp key of crush.json with required-style type [CR1]`               |
| E8.S8 | `the fabricated .crush/mcp.json is never emitted [CR1]`                                  |
| E8.S8 | `hooks capability on: hooks.PreToolUse lands in crush.json [CR3]`                        |
| E8.S8 | `permissions capability reflects permissions.allowed_tools [CR1]`                        |
| E8.S8 | `user rules emit to ~/.config/crush/CRUSH.md (or ~/.config/AGENTS.md) [CR1][CR2]`        |
| E8.S8 | `the fabricated ~/.config/crush/AGENTS.md is not written [CR1]`                          |
| E8.S8 | `fabricated-shape import: .crush/mcp.json lifts zero phantom servers (E1.S3) [CR1]`      |
| E9.S4 | `crush.json: mcp lands under the documented "mcp" key with foreign keys preserved [CR1]` |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S8 green: root AGENTS.md rules + skills round-trip; E5.S7 greens: loud agent skip — crush still emits no agent artifact); zero non-owned `story.tracked` flips.
- Story ground: drive compile+import per §2 sheet on a foreign-keyed `crush.json`; observable = one config home, honest capabilities, documented user-rules path.
- Territory: production diff confined to `src/adapters/crush/**`; graduation flips are the only test edits.
