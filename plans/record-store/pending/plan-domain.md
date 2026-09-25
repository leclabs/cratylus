# plan-domain

**Wave 1.** Realizes `plan`.

## Intent

Plans as a domain over the record store: each plan one DAG of units, each unit realizing exactly
one concept and carrying its spec and lifecycle state, with readiness computed from dependencies
and never stored.

- A unit's payload is its whole spec — anchor, the plan (DAG) it belongs to, the concept it
  realizes (an entity reference), intent, static inputs, deps (unit references), outputs,
  acceptance criteria — plus its stored lifecycle state, an optional owed ruling (the fork as it
  was put), and its pin. The pin is an opaque value here; `pin` computes it and `domain-interface`
  composes the two.
- The lifecycle vocabulary's one home is this module (PLAN.md § Contract, decision D1): stored
  states `pending`, `active`, `completed`; `ready` ⇔ `pending` ∧ every dep `completed` ∧ no ruling
  owed; `frontier` = `ready` ∪ `active`; waves as the `plan` skill defines them (`wave(0)` = no
  deps). None of `ready`, `frontier` or a wave number is ever written into a record.
- Add writes a unit's first version; revise supersedes it; advance moves `pending → active →
completed` and refuses any other move.
- The domain hands the store its reference relation — a dep on a retracted unit, a dep cycle, a
  unit realizing a concept its caller reports retracted — so each surfaces as incoherence.

Plan membership is a unit's plan name, read from the design's "plans (DAGs of units)". Ruling R1
(PLAN.md) may make a plan an entity of its own; that would be a revision of this module, and
`domain-interface`'s outputs include it.

Isolation (PLAN.md § Contract): imports only from `../../record-store/` (never
`immutability-gate.ts`), never `./pin.ts`, another capability directory or the view.

## Static

- `git show 9cc32431:docs/design/record-store.md` § The three domains (`plan`), § How they are met
  (`view`: owed rulings, wave order, frontier).
- `git show 9cc32431:packages/canon/src/skills/plan/skill.ts` — `wave`, `frontier`, `blocked`,
  `ruling-owed`, `spec(unit)`.
- The landed `packages/runtime/src/record-store/` and its return's reported signs.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/capabilities/plan/plan.ts` (new), plus any further new file in that
  directory other than `pin.ts` (`pin`'s), `index.ts` and `dispatch.ts` (`domain-interface`'s)
- `.changeset/plan-domain.md`

## Accept

1. `pnpm --filter @cratylus/runtime typecheck` passes.
2. The return carries a smoke script and its verbatim output, run as
   `pnpm --filter @cratylus/canon exec tsx <absolute path>` against a temporary records root; a
   re-run reproduces the output. With units `A`, `B` (dep `A`), `C` (dep `A`), `D`: waves are
   `[A, D]`, `[B, C]`; ready is `{A, D}`; advancing `A` to `completed` makes `B` and `C` ready; a
   ruling owed on `D` takes it out of ready and lists it; advancing `B` from `pending` straight to
   `completed` refuses; a dep cycle reads as incoherence; the payload keys of every record written
   are printed and include none of `ready`, `frontier`, `wave`.
3. `git grep -nE "from '\./pin|from '\.\./(design|note)/|from '\.\./\.\./view|immutability-gate" -- packages/runtime/src/capabilities/plan`
   prints nothing.
4. Sole: the return names the one declaration of the lifecycle states, and
   `git grep -nE "'pending'|'active'|'completed'" -- packages/runtime/src` hits outside that
   module only where it did at `9cc32431`: `packages/runtime/src/capabilities/carry-on/` (flag
   names, disposed by `plan-cutover` under ruling R2) and `packages/runtime/src/ports/memory.ts`
   (`SessionState`, a different concept).
5. `.changeset/plan-domain.md` names `@cratylus/runtime`.
