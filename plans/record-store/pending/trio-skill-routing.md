# trio-skill-routing

**Wave 3.** Realizes `skill routing` — for `design`, `plan` and `deliver`, the corpus's trio.
**Ruling owed: R1** (PLAN.md) — what `deliver`'s `bound`, `elect` and `retire` route to.

## Intent

Each skill routes its reader's intents to its own domain interface in its own vocabulary and holds
its domain's authority rules; no skill restates another's rules or mentions the record store. One
unit for the three because their formal blocks borrow from each other (`X @ design`,
`X @ plan`), which `boundary-binding.test.ts` resolves; split, they would dangle each other's
borrows mid-wave.

- **`design`** — `runtime: { capability: 'design' }`; intents reach show, define, amend, retract,
  reconcile, trace through `scripts/design.mjs <verb>`. It holds reconciliation as the
  architect's alone, and states that a planner, implementer or assayer meeting divergence reports
  it and never picks a head. The lattice's supersession, retraction, divergence and reconciliation
  take the place of `Phase`, `supersededBy` and the commit-keyed `amends`/`accepts` pair — the
  separation law survives as "a reconciliation is an amendment and never shares a record with an
  acceptance". The piece-level `pin`/`digest` pair leaves `design` (the pin is now per unit,
  `plan`'s). `cut`, `closure`, `blast`, `anchor`, `gloss`, `factors`, `denotes` stay.
- **`plan`** — `runtime: { capability: 'plan' }`; intents reach show, add, revise, advance through
  `scripts/plan.mjs <verb>`. It pins and advances: `pin`, drifted and suspect are declared here and
  replace `pin(s) ≠ digest(s) ⇒ REFUSE`. `States` restates the plan domain's vocabulary (stored
  `pending`, `active`, `completed`; `ready` computed) instead of importing `PLAN_STATES`. The
  `mirror` sign, `advance ⊨ mirror` and the `→ mirror →` step are deleted. `R`, the census,
  outputs, wave and acceptance laws stay (`boundary-binding.test.ts`'s fixture borrows `R`).
- **`deliver`** — reads both (show), and records acceptance by advancing a unit (`advance @ plan`).
  `file(d)` captures to the notebook through the `note` capability's verb, without borrowing from
  the `note` skill (PLAN.md § Contract, W3 isolation). `bind`, `elect` and `retire` route as R1
  decides.

Every test comment that calls `event-tap` "the last" shim carrier becomes false when `design` and
`plan` declare capabilities; rewrite each without enumerating the carriers, so `note-skill`
landing beside this unit leaves it true.

## Static

- `git show 9cc32431:docs/design/record-store.md` § How they are met (`skill routing`,
  `domain interface`), § The three domains, § Boundaries (the `mirror` law is deleted).
- `packages/canon/src/skills/{design,plan,deliver}/skill.ts`; `packages/canon/src/skills/event-tap/skill.ts`.
- `packages/canon/test/boundary-binding.test.ts`, `reader-reach.test.ts` (pins on `deliver`'s
  block).
- The landed `design` and `plan` capabilities' verbs; `create-skill` and `signify` for every sign
  changed.

## Deps

`domain-interface`

## Outputs

- `packages/canon/src/skills/design/skill.ts`
- `packages/canon/src/skills/plan/skill.ts`
- `packages/canon/src/skills/deliver/skill.ts`
- `packages/canon/test/boundary-binding.test.ts`
- `packages/canon/test/reader-reach.test.ts`
- `packages/canon/test/bin-name-single-home.test.ts`
- `packages/canon/test/runtime-shim.test.ts`
- `packages/canon/test/capability-keyspace.test.ts`
- `.changeset/trio-skill-routing.md`

## Accept

1. `git grep -nE "mirror|plan-states|PLAN_STATES|digest" -- packages/canon/src/skills/plan packages/canon/src/skills/design`
   prints nothing (at `9cc32431` both files hit).
2. `git grep -n "capability: 'design'" -- packages/canon/src/skills/design/skill.ts` and
   `git grep -n "capability: 'plan'" -- packages/canon/src/skills/plan/skill.ts` each hit once.
3. `deliver`'s formal block has a line borrowing `advance` from `plan`, and
   `pnpm --filter @cratylus/canon test -- boundary-binding` passes.
4. `design`'s formal block contains `reconcile` and the architect-only authority over it, and
   neither `Phase` nor `supersededBy`.
5. `git grep -niE "record store|record id|envelope|records/" -- packages/canon/src/skills` prints
   nothing.
6. `git grep -nE "@ note\b" -- packages/canon/src/skills/{design,plan,deliver}` prints nothing.
7. `deliver`'s `bind`, `elect`, `retire` match ruling R1.
8. Sole: `git grep -l "capability: 'design'" -- packages/canon/src` and the same for `'plan'`
   each list exactly one file.
9. `pnpm verify` passes.
10. `.changeset/trio-skill-routing.md` names `@cratylus/canon`.
