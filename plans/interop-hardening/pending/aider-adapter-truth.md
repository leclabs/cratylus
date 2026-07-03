# aider-adapter-truth — conventions wired via .aider.conf.yml read:; no inert fabrications (§3 aider d1,d3)

**Lane** Mav · **wave(5)** · deps: ⊳engine-report-machinery (YAML merge primitive) · ⊳exemplify-pipeline (E6.S6 test context — the owned E6 id runs in the projection suite).

## Static

- `packages/agent-forge/src/adapters/aider/{anatomy,events,paths,read,write}.ts` (or the dir's actual file set — `index.ts` carries AGENTS.md refs)
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "aider" + §3 "aider adapter" ([AI1][AI2])
- `packages/agent-forge/test/stories/E8/S10.aider.test.ts` · `E9/read-merge.test.ts` · `E6/S6.project-every-target.test.ts` · `E2/e2s4-user-compile.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S10) · `stories/E9-ir-expressiveness.md` (E9.S4) · `stories/E6-exemplify-optimization.md` (E6.S6) · `stories/E2-ir-emission.md` (E2.S4)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/aider/**`.

- Wiring: compile emits `.aider.conf.yml` `read:` entries pointing at the emitted conventions file — a stock aider run loads it [AI1][AI2]; merge-safe with an existing conf (foreign keys preserved, `read:` merged not clobbered).
- User scope: `~/.aider.conf.yml` is the surface; fabricated inert `~/AGENTS.md` write removed [AI1].
- Read: models the conf chain — `read:`-wired conventions files lift on import [AI1].

## Owned tracked ids (7)

| Story  | Test (call site)                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| E8.S10 | `compile also emits .aider.conf.yml wiring the conventions file via read: [AI1][AI2]`                      |
| E8.S10 | `.aider.conf.yml wiring is merge-safe with an existing conf (E3.S5) [AI1]`                                 |
| E8.S10 | `the fabricated ~/AGENTS.md user-scope write is gone [AI1]`                                                |
| E8.S10 | `read models the conf chain: read:-wired conventions files lift [AI1]`                                     |
| E9.S4  | `.aider.conf.yml: conventions wired via a merged read: entry, foreign keys preserved [AI1][AI2]`           |
| E6.S6  | `aider: emitted rules are wired for reading via .aider.conf.yml read: — aider has no auto-discovery [AI2]` |
| E2.S4  | `aider user scope emits ~/.aider.conf.yml — a bare ~/AGENTS.md is inert [AI1][AI2]`                        |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S10 green: conventions file emitted at project scope); zero non-owned `story.tracked` flips (E1.S4 unsupported-by-source is engine-owned wave 4; E4.S7 portable-core is convergence-owned).
- Story ground: drive compile on an aider target with a pre-existing `.aider.conf.yml`; observable = merged `read:` chain a stock aider actually loads; import lifts the wired conventions.
- Territory: production diff confined to `src/adapters/aider/**`; graduation flips are the only test edits.
