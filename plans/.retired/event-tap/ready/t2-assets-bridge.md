# T2 — assets-bridge (SUPERSEDED · was ready · wave 0 · deps ∅)

> **⛔ SUPERSEDED-BY `agent-runtime/S6`+`S8` — do NOT execute for event-tap.**
> This slice existed to make a skill's `assets:` companion ship a `.sh` beside SKILL.md. Under the
> `agent-runtime` thin-shim architecture the event-tap mechanism lives in a **runtime plugin** installed
> per-host (`agent-runtime/S7`), and the projected skill is a thin shim → `agent-runtime tap <verb>`; no
> per-skill `.sh` asset ships, so the `assets:` projection gap is off event-tap's path. (The general
> `assets:`-staging idea is not destroyed — it is git-restorable and could be revived as its own concern
> if a non-runtime skill ever needs it — but it is NOT part of this effort chain.) See
> `plans/agent-runtime/SUPERSESSION.md`. Historical spec follows.

---

## Objective

Make a skill's declared `assets:` companion **actually project and ship**, so `event-tap.sh` reaches
the deployed skill dir through the intended mechanism. Today the field is inert end-to-end.

## Static inputs (pinned)

- `packages/agent-canon/src/toolkit/project-cli.ts` (`projectSkills`, L116-141) — writes ONLY SKILL.md; never reads `cell.assets`. **The gap.**
- `packages/agent-forge/src/anatomy/index.ts` (L269-270) — `SkillDeploy.assets?: readonly string[]` ("committed companion assets shipped byte-for-byte" — the promise the pipeline breaks).
- `packages/agent-forge/src/deploy/bundle.ts` (`stageAssets` L38-63; retired `bundle:` note L9-12) — the stager, fired only from deploy `--assets`.
- `packages/agent-forge/src/cli/commands/deploy.ts` (`parseCompanions` L64-90) — the `--assets skill=spec` parse.
- `packages/agent-canon/src/skills/` (any skill dir) + `packages/agent-canon/package.json` (`project` script).

## Constraints

- **General fix, not event-tap-specific.** Any skill with `assets:` must stage.
- Recommended approach: extend `projectSkills` to copy each `cell.assets` entry (resolved against the
  cell's `src` sibling dir, e.g. `toolkit/event-tap/`) into `<out>/skills/<name>/` beside SKILL.md,
  byte-for-byte, so the standard deploy finds it with no manual `--assets`. Preserve exec bit.
- **Must not break an existing gate** (`project` run stays green; no existing skill regresses — none
  declare `assets` today, so the change is additive). Census `memory`'s current companion shipping
  first (bin vs staged) to confirm the chosen path doesn't duplicate a live mechanism.
- **Shared-infra flag:** this edits `project-cli.ts` (and possibly a deploy path). Surface the diff
  for review; if the Operator prefers scope-minimal, fall back to manual `--assets` + a pre-stage
  copy (documented) and note it. Do NOT expand into unrelated forge refactors.

## Deps

∅ (independent infra; parallel with T1).

## Outputs

- The `project-cli` change (diff) that stages `assets`.
- Proof: a skill declaring `assets: ['x.sh']` projects `<out>/skills/<name>/x.sh` present + byte-identical + executable.

## Accept (blind falsifier)

REJECTED if: after `pnpm --filter @leclabs/agent-canon project`, a declared companion is ABSENT from
`.render-ts/skills/<name>/`; OR the fix hardcodes `event-tap` (not general); OR any existing gate
(`project`, `test`, `tsc`, `biome`) regresses; OR it silently duplicates the retired `bundle:` path.
ACCEPTED when a declared `assets` companion provably lands in the projected skill dir, byte-exact +
executable, by a general mechanism, all gates still green.
