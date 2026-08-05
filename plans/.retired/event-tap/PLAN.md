# event-tap — build plan (mirror)

> **STATUS: RESHAPED into `runtime` (2026-07-23) — event-tap becomes a RUNTIME CAPABILITY.** This
> plan is the E2 seed; its mechanism is now absorbed into the `runtime` runtime-plugin architecture
> (see `plans/runtime/SUPERSESSION.md`). event-tap is no longer a self-shipping canon skill with a
> `.sh` companion — it becomes a **`RuntimePlugin` implementing the `EventTapHost` port**, invoked
> `cratylus-run tap <verb>`, with the skill projected as a **thin shim**. Shard fates:
>
> - **T1 (derive-verbs) SURVIVES** — the cold-derived verb set + anchor feed `runtime/S5` (`cratylus-run tap <verb>`). Kept as an input.
> - **T2 (assets-bridge) DIES** — the thin-shim architecture removes the need to ship a per-skill `.sh` asset (the capability lives in the runtime plugin installed per-host by `runtime/S7`); the `assets:` projection gap is no longer on event-tap's path. **SUPERSEDED-BY `runtime/S6`+`S8`.** (Its earlier "DELETES" note stands, now for the runtime-plugin reason.)
> - **T3 (mechanism) ABSORBS into `runtime/S5`** (event-tap-capability) — `event-tap.sh` + the passive logger become the `EventTapHost` RuntimePlugin impl (claude adapter as capability impl).
> - **T4 (skill-cell) ABSORBS into `runtime/S8`** (skills-rewire) — the `event-tap.ts` cell becomes a thin-shim skill projected against the runtime port.
> - **T5 (integrate-deploy) RE-CUTS under `runtime/S7`+`S10`** — per-host runtime install + e2e smoke.
>
> **Do NOT execute T2/T3/T4/T5 as-is.** (Design: `.scratchpad/tap-skill-draft.md` + `plans/runtime/PLAN.md`.)

> Derived mirror of `(state, R, content)`. Runtime folder-state is authority; this doc is downstream.
> Owner: session `cda9ac7e` (see `.owner`). Reader = LLM.

## Intent

Build the `event-tap` canon skill fragment: a harness-agnostic skill that installs a **temporary,
passive, read-only tap** on an agent's lifecycle events (canon `event`, projected to hooks under the
Claude adapter), captures + inspects the raw payload the harness hands each event handler, then
uninstalls cleanly. **Non-interference is constitutive** — the installed logger emits ∅, exits 0,
never blocks/denies/mutates. Design settled: `.scratchpad/tap-skill-draft.md`.

Ontology: `event-tap` = **skill** (`src/skills/event-tap.ts`, the agent-invoked protocol) + **companion
tool** (`toolkit/event-tap/event-tap.sh`, `install|inspect|uninstall|status`). The passive **logger**
the tool installs at runtime is a hook-worker written by the tool (heredoc), not a static hook cell.

## Census finding that shaped the cut (grounded)

The skill `assets:` companion path is **DECLARED BUT INERT**: `project-cli.ts` `projectSkills`
(L116-141) never reads `cell.assets`; `stageAssets` (`forge/src/deploy/bundle.ts:38-63`) only
fires from the deploy `--assets` flag, which further needs the file pre-staged in `.render-ts`. The
`memory`/`episodic.mjs` exemplar is **retired** (`bundle.ts:9-12`). ∴ `event-tap.sh` has no clean
shipping path today → **T2 (shipping-infra) is a first-class slice**, not a step of deploy.

## Slices (MECE, vertical) + dependency graph R

| id     | slice (one concern, end-to-end)                                       | deps     | wave | state                                      |
| ------ | --------------------------------------------------------------------- | -------- | ---- | ------------------------------------------ |
| **T1** | `derive-verbs` — cold-derive + gate the sub-verb set & anchor         | —        | 0    | **SURVIVES → input to `runtime/S5`**       |
| **T2** | ~~`assets-bridge`~~ — thin-shim removes the per-skill asset-ship need | —        | 0    | **DIES · SUPERSEDED-BY `runtime/S6`+`S8`** |
| **T3** | ~~`mechanism`~~ — `event-tap.sh` + runtime logger                     | T1       | 1    | **ABSORBS → `runtime/S5`**                 |
| **T4** | ~~`skill-cell`~~ — `event-tap.ts` cell                                | T1       | 1    | **ABSORBS → `runtime/S8` (thin-shim)**     |
| **T5** | ~~`integrate-deploy`~~ — clean-worktree gate + project + deploy       | T2,T3,T4 | 2    | **RE-CUT → `runtime/S7`+`S10`**            |

`R = {(T3,T1),(T4,T1),(T5,T2),(T5,T3),(T5,T4)}`

## Waves (dispatch schedule)

- **wave 0** — `{T1, T2}` (fan-out 2; independent)
- **wave 1** — `{T3, T4}` (both freed by T1)
- **wave 2** — `{T5}` (convergence: integrate + deploy)

## Decision points surfaced (Operator-on-the-loop)

- **T2 touches shared infra** (`project-cli.ts` / forge deploy). Recommended: close the `assets:`
  projection gap generally so event-tap is the first honest exemplar. Alternative: manual `--assets`
  plumbing scoped to event-tap only. Flagged for your call at T2 review.
- **T5 deploy** — LOCAL is in-remit; **FLEET + push are RESERVED** for your sign-off.

## Concurrency constraint

`src/skills/` + `test/` are **hot** (a live sibling session edits `create-skill.ts` and adds
`test/*self-sufficiency*`, `test/*symbol-probe*`). **T4's finalize-into-`src/skills/` and the
count-bump must sequence AFTER the sibling settles**, and the count-bump must read the **live** skill
count (the sibling may add skills → not necessarily 16). T1/T2/T3 do not touch the hot dirs.
