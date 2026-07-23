# event-tap — build plan (mirror)

> **STATUS: PARKED — blocked on E1 (skills-shape + companion-architecture refactor).** This plan is the
> E2 seed but its cut is now SUPERSEDED: T2 (assets-bridge) DELETES (co-location makes shipping
> structural); T3 becomes a TypeScript DOMAIN module coding to a forge `EventTapHost` PORT (the
> settings.json realization moves to a forge Claude adapter, composed at projection); T4/T5 re-cut for
> the Agent-Skills dir-shape (`event-tap/{skill.ts, scripts/, references/, assets/}`, `dirname==name`)
>
> - projection-composition. **Do NOT execute as-is — re-cut after E1 lands.** (Design: `.scratchpad/tap-skill-draft.md` + the E1 companion-architecture.)

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
(L116-141) never reads `cell.assets`; `stageAssets` (`agent-forge/src/deploy/bundle.ts:38-63`) only
fires from the deploy `--assets` flag, which further needs the file pre-staged in `.render-ts`. The
`memory`/`episodic.mjs` exemplar is **retired** (`bundle.ts:9-12`). ∴ `event-tap.sh` has no clean
shipping path today → **T2 (shipping-infra) is a first-class slice**, not a step of deploy.

## Slices (MECE, vertical) + dependency graph R

| id     | slice (one concern, end-to-end)                                                   | deps     | wave | state   |
| ------ | --------------------------------------------------------------------------------- | -------- | ---- | ------- |
| **T1** | `derive-verbs` — cold-derive + gate the sub-verb set & anchor                     | —        | 0    | ready   |
| **T2** | `assets-bridge` — make a skill's `assets:` companion actually project + ship      | —        | 0    | ready   |
| **T3** | `mechanism` — `event-tap.sh` (+ the runtime logger) + its hermetic falsifier test | T1       | 1    | pending |
| **T4** | `skill-cell` — `event-tap.ts` cell passing the 5 skill gates (+ count-bumps)      | T1       | 1    | pending |
| **T5** | `integrate-deploy` — clean-worktree gate + project + deploy (fleet RESERVED)      | T2,T3,T4 | 2    | pending |

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
