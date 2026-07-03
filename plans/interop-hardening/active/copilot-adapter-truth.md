# copilot-adapter-truth — .github/\* surfaces, camelCase hooks envelope, ~/.copilot home (§3 copilot d1–d7)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (Rule activation metadata for `applyTo`).

## Static

- `packages/agent-forge/src/adapters/copilot/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "GitHub Copilot" + §3 "copilot adapter" ([CP1]–[CP8])
- `packages/agent-forge/test/stories/E8/S4.copilot.test.ts` · `E2/e2s4-user-compile.test.ts` · `E4/event-taxonomy.test.ts` · `E7/s07-vendor-rules-dirs.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S4) · `stories/E2-ir-emission.md` (E2.S4) · `stories/E4-roundtrip.md` (E4.S4) · `stories/E7-standards-reach.md` (E7.S7)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/copilot/**`.

- Hooks: emit `.github/hooks/*.json`, documented `{"version":1}` camelCase envelope; delete the ".claude/settings.json is parsed by Copilot" premise; event map re-keyed camelCase, covers `permissionRequest` + `errorOccurred` [CP4].
- User scope: `~/.copilot/` (mcp-config.json); nothing under fabricated `~/.config/github-copilot/`; fabricated-shape import lifts zero phantoms [CP8].
- Skills: repo skills → `.github/skills/`; nothing to fabricated `.copilot/skills/` [CP2].
- Agents: `.github/agents/*.agent.md` [CP1]. Commands: `.github/prompts/*.prompt.md` [CP5].
- Glob rules: `.github/instructions/<id>.instructions.md` with `applyTo` frontmatter [S57] (consumes wave-4 Rule activation metadata).

## Owned tracked ids (14)

| Story | Test (call site)                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------ |
| E8.S4 | `hooks emit to .github/hooks/*.json in the documented {"version":1} camelCase envelope [CP4]`          |
| E8.S4 | `the ".claude/settings.json is parsed by Copilot" premise is deleted [CP4]`                            |
| E8.S4 | `event map is re-keyed to the camelCase dialect [CP4]`                                                 |
| E8.S4 | `event map covers documented permissionRequest and errorOccurred [CP4]`                                |
| E8.S4 | `user scope lives under ~/.copilot/ (mcp-config.json) [CP8]`                                           |
| E8.S4 | `nothing is emitted under the fabricated ~/.config/github-copilot/ [CP8]`                              |
| E8.S4 | `repo skills emit to .github/skills/ [CP2]`                                                            |
| E8.S4 | `nothing is emitted to the fabricated .copilot/skills/ [CP2]`                                          |
| E8.S4 | `agents emit to .github/agents/*.agent.md [CP1]`                                                       |
| E8.S4 | `commands emit as prompt files .github/prompts/*.prompt.md [CP5]`                                      |
| E8.S4 | `fabricated-shape import: ~/.config/github-copilot fixture lifts zero phantom resources (E1.S3) [CP8]` |
| E2.S4 | `copilot user surface is ~/.copilot/ — NOT ~/.config/github-copilot/ [CP8]`                            |
| E4.S4 | `copilot: native names use the documented camelCase dialect, not PascalCase [CP4]`                     |
| E7.S7 | `glob rule emits .github/instructions/<id>.instructions.md with applyTo frontmatter [S57]`             |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S4 greens: root AGENTS.md rules surface, `.vscode/mcp.json` servers round-trip); zero non-owned `story.tracked` flips.
- Story ground: drive compile+import per §2 sheet; observable = a tree a stock Copilot install consumes (documented paths, envelope, dialect).
- Territory: production diff confined to `src/adapters/copilot/**`; graduation flips are the only test edits.
