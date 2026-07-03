# amp-adapter — new adapter: Amp (flat amp.\* settings, .agents/skills native, agents/commands/hooks via plugin emitter)

**Lane** Mav · **wave(5)** · deps: ⊳engine-report-machinery (plugin support mode + emitter route, E5.S1).

## Static

- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Amp" sheet + §1 matrix Amp row ([AM1]–[AM9])
- `packages/agent-forge/test/stories/E10/S1.amp.test.ts` · `E5/S2.amp-agents-via-plugin.test.ts`
- `plans/interop-hardening/stories/E10-adapter-roster.md` (E10.S1) · `stories/E5-plugin-adapters.md` (E5.S2)
- `packages/agent-forge/src/core/adapter/types.ts` · exemplar `src/adapters/crush/**`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **feature (new adapter, plugin-arch)**. Territory: new `src/adapters/amp/**` + append-only roster seam (`src/cli/index.ts`, `package.json` subpath export).

- Roster: amp registered per the new-adapter contract.
- Settings: flat `amp.*` keys in `.amp/settings.json`; MCP under `amp.mcpServers` [AM1].
- Rules: AGENTS.md emitted and lifted on read (cwd→$HOME chain, @-imports) [AM1].
- Skills: natively-read `.agents/skills/` — no bespoke dir [AM4].
- Agents/commands/hooks: via the plugin emitter — `.amp/plugins/agent-forge-agents.ts` default-exporting `amp.createAgent` calls per IR agent [AM1][AM9]; legacy `amp.hooks` never emitted [AM2][AM3]; IR agent fields `amp.createAgent` cannot carry are warned per E4.S2 discipline.

## Owned tracked ids (7)

| Story  | Test (call site)                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| E10.S1 | `amp is on the adapter roster (new-adapter contract)`                                                              |
| E10.S1 | `settings: flat amp.* keys in .amp/settings.json with MCP under amp.mcpServers [AM1]`                              |
| E10.S1 | `skills emit to the natively-read .agents/skills/ — no bespoke dir [AM4]`                                          |
| E10.S1 | `agents+commands+hooks ship via the plugin emitter; legacy amp.hooks never emitted [AM2][AM3]`                     |
| E10.S1 | `rules: AGENTS.md emitted and lifted on read (cwd→$HOME chain, @-imports) [AM1]`                                   |
| E5.S2  | `compile emits .amp/plugins/agent-forge-agents.ts default-exporting amp.createAgent calls per IR agent [AM1][AM9]` |
| E5.S2  | `IR agent fields the amp.createAgent API cannot carry are warned per E4.S2 discipline`                             |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken; zero non-owned `story.tracked` flips (`E5/S3` `amp / kilo / zed: …no shipped adapter` is convergence-owned — verify amp alone does not flip it).
- Story ground: drive compile+import per §2 Amp sheet; observable = a tree/plugin a stock Amp consumes; unrepresentable agent fields surface as warnings, never silently dropped.
- Territory: production diff confined to `src/adapters/amp/**` + declared seams; graduation flips are the only test edits.
