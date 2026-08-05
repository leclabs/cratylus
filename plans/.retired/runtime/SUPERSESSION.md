# runtime — SUPERSESSION ledger

> Emitted by `runtime/S2` (plan-reconcile), 2026-07-23. Enumerates how the `runtime`
> runtime-plugin architecture supersedes/reshapes the two upstream plans (`skills-refactor`,
> `event-tap`) so no executor builds the dead design. DOC-ONLY reconciliation — zero source touched.

## Why

`runtime` decomplects the **BUILD host** (`forge`: project → deploy) from a net-new
**RUNTIME host** (`@leclabs/runtime`: capability port contracts + runtime loader + one branded
host bin). Capability packages (`memory`, `event-tap`) become **runtime plugins** implementing
those ports; a projected skill script becomes a **thin shim → `runtime <capability> <verb>`**.

This kills the two delivery mechanisms the upstream plans assumed:

- skills-refactor's **dep-free `.mjs` composed at projection** (T4) → replaced by the thin shim (S6).
- event-tap's **self-shipping canon skill with a `.sh` companion** (T2/T3/T4) → replaced by an
  event-tap **runtime plugin** installed per-host (S5/S7), fronted by a thin-shim skill (S8).

## Ledger — die / survive / absorb

| upstream shard                        | fate       | lands in / pointer                    | note                                                                                   |
| ------------------------------------- | ---------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| skills-refactor **T1** dir-shape      | ✅ SURVIVE | — (landed `d8f2a30`)                  | skills/`<name>`/skill.ts shape stands; unaffected.                                     |
| skills-refactor **T2** deploy-recurse | ✅ SURVIVE | — (landed `d8f2a30`)                  | recursive deploy of skill subdirs stands; still carries thin-shim scripts.             |
| skills-refactor **T3** runtime-port   | ✅ SURVIVE | — (landed `d8f2a30`) → feeds S5       | forge `EventTapHost` port + claude adapter; the port the event-tap plugin implements.  |
| skills-refactor **T4** compose-build  | ⛔ DIE     | **`runtime/S6`** (+`S8`)              | dep-free-bundle composition retired; S6 reverses projection to thin shims.             |
| skills-refactor **T5** integrate      | ♻ RE-CUT   | **`runtime/S10`**                     | runtime-companion e2e re-cut as integrate-smoke over the runtime install.              |
| event-tap **T1** derive-verbs         | ✅ SURVIVE | → **`runtime/S5`**                    | cold-derived verb set + anchor = naming input to `cratylus-run tap <verb>`.            |
| event-tap **T2** assets-bridge        | ⛔ DIE     | **`runtime/S6`+`S8`** remove the need | thin shim + per-host plugin install ⇒ no per-skill `.sh` asset ships; gap off-path.    |
| event-tap **T3** mechanism            | 🔀 ABSORB  | → **`runtime/S5`**                    | `event-tap.sh` + passive logger become the `EventTapHost` RuntimePlugin impl.          |
| event-tap **T4** skill-cell           | 🔀 ABSORB  | → **`runtime/S8`**                    | `event-tap.ts` becomes a thin-shim skill (drops the `assets:` companion coupling).     |
| event-tap **T5** integrate-deploy     | ♻ RE-CUT   | → **`runtime/S7`+`S10`**              | per-host runtime install (S7) + e2e smoke (S10); clean-worktree + push-reserved carry. |

Legend: ✅ SURVIVE (intact, may feed a slice) · ⛔ DIE (dead design, superseded) · 🔀 ABSORB
(substance moves into a slice) · ♻ RE-CUT (re-planned under a slice).

## Explicitly NOT absorbed (orthogonal)

- **skills-refactor E3** (projection-engine + shared-authoring modules out of `canon/toolkit`
  into `forge`) — ORTHOGONAL, out of scope; `runtime/PLAN.md` §Relation confirms.
- The **c13e911 home-resolution** work (`requireHome`/`memory home`/seed-target→`~/.agents`) is
  preserved, folded into `runtime/S4` (MemoryStrategy) + `S7` (install subsumes seed-target) —
  a fold within this plan, listed here for completeness, not an upstream-plan supersession.

## De-palimpsest trail

Superseded shards are NOT deleted — each retains its historical spec below a `⛔`/`♻`/`🔀`/`✅` banner
pointing here (partition-then-prune: a committed plan is git-restorable, but a supersession marker keeps
the reasoning legible to a cold reader). Files marked:

- `plans/skills-refactor/PLAN.md` (STATUS + slices table T4/T5 + §Relation tail)
- `plans/skills-refactor/pending/{t4-compose-build.md, t5-integrate.md}`
- `plans/event-tap/PLAN.md` (STATUS + slices table)
- `plans/event-tap/{ready/t1-derive-verbs.md, ready/t2-assets-bridge.md, pending/t3-mechanism.md, pending/t4-skill-cell.md, pending/t5-integrate-deploy.md}`

No `.owner` sidecar touched; neither upstream plan resumed. Reconciliation is DOCS-only.
