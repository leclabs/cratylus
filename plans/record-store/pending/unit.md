# unit

**Wave 1.** Realizes `unit`.

## Intent

"One unit of work in a plan, realizing exactly one concept and carrying its full spec and
lifecycle state. Readiness is computed, never stored: a unit is ready when every dependency is
completed and no owed ruling names it." Factors: `plan`, `pin`, `notebook`.

- A unit's payload is its plan (an entity reference), its full spec — its name, the concept it
  realizes (an entity reference), intent, static inputs, deps (unit references), outputs, acceptance
  criteria — its lifecycle state, and its pin (an opaque value `pin` computes).
- Add writes a unit's first version; revise supersedes it; advance moves it one step along its
  lifecycle and refuses any other move.
- Computed, never written into a record: **ready** (every dep in the state that satisfies a
  dependency, and no owed ruling names the unit or its plan), the **frontier** (ready and in-flight
  units), **waves** as the `plan` skill defines them (`wave(0)` = no deps).
- The domain hands the store its reference relation — a dep on a retracted unit, a dep cycle, a unit
  of a retracted plan, a unit realizing a concept its caller reports retracted — so each surfaces as
  incoherence.
- **Received, never spelled or imported:** the unit lifecycle vocabulary (states in order, and
  which one satisfies a dependency) from the runtime config; plan liveness from `plan-domain`; the
  owed rulings naming units or plans from `notebook`; concept liveness from `design-domain`. Each is
  a parameter this module declares structurally; `domain-interface` composes them.

Isolation (`PLAN.md` § Contract): imports only from `../../record-store/` (never
`immutability-gate.ts`), never `./plan.ts`, `./pin.ts`, another capability directory, the view or
`runtime-config.ts`.

## Static

- `git show 4610c33f:docs/design/record-store.md` § The three domains (`unit`, `plan`, `notebook`,
  `pin`).
- `git show c501e002:packages/canon/src/skills/plan/skill.ts` — `wave`, `frontier`, `blocked`,
  `spec(unit)`.
- The landed `packages/runtime/src/record-store/` and its return's reported signs.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/capabilities/plan/unit.ts` (new)
- `.changeset/unit.md`

## Accept

1. `pnpm --filter @cratylus/runtime typecheck` passes.
2. The return carries a smoke script and its verbatim output, run as
   `pnpm --filter @cratylus/canon exec tsx <absolute path>` against a temporary records root with a
   unit lifecycle built from invented names (`u0`, `u1`, `u2`, the last satisfying a dependency); a
   re-run reproduces the output. With units `A`, `B` (dep `A`), `C` (dep `A`), `D`: waves are
   `[A, D]`, `[B, C]`; ready is `{A, D}`; advancing `A` to its last state makes `B` and `C` ready;
   an owed ruling naming `D` takes it out of ready; an owed ruling naming the plan takes all four
   out; skipping a lifecycle step refuses; a dep cycle reads as incoherence; the payload keys of
   every record written are printed and include no readiness, frontier or wave field.
3. `git grep -nE "'(pending|ready|active|completed)'" -- packages/runtime/src/capabilities/plan packages/runtime/src/capabilities/design packages/runtime/src/capabilities/note`
   prints nothing (the flag-fed `carry-on` hits are `plan-cutover`'s to delete).
4. `git grep -nE "from '\./(plan|pin)|from '\.\./(design|note)/|from '\.\./\.\./(view|runtime-config)|immutability-gate" -- packages/runtime/src/capabilities/plan/unit.ts`
   prints nothing.
5. Sole: the return names the one function computing readiness, and `git grep -n <it> -- packages/runtime/src`
   finds it declared only in `unit.ts` (the carry-on terminus, deleted by `plan-cutover`, reads
   folders and is not a fold).
6. `.changeset/unit.md` names `@cratylus/runtime`.
