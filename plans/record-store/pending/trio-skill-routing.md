# trio-skill-routing

**Wave 3.** Realizes `skill routing` — for `design`, `plan` and `deliver`, the corpus's trio.

## Intent

Each skill routes its reader's intents to its own domain interface in its own vocabulary and holds
its domain's authority rules; no skill restates another's rules or mentions the record store. One
unit for the three because their formal blocks borrow from each other (`X @ design`, `X @ plan`),
which `boundary-binding.test.ts` resolves; split, they would dangle each other's borrows mid-wave.

- **`design`** — `runtime: { capability: 'design' }`; intents reach show, define, amend, retract,
  reconcile and trace (how a concept came to be, what it stands on, what stands on it) through
  `scripts/design.mjs <verb>`. It holds reconciliation of the design as the architect's alone,
  and states that a planner, implementer or assayer meeting divergence or incoherence reports it
  and never resolves it. It carries the design's laws at `0c9da09c`: one live concept per anchor,
  and a withdrawn concept keeps its anchor until it is reinstated; factors are acyclic and name live
  concepts, so a concept that others factor on cannot be retracted; every gloss and every reason is
  non-empty. The block already states anchor uniqueness, acyclicity, a non-empty gloss and a
  non-empty reason; the live-factor and anchor-retention laws are new to it. Factors form a set, which
  `factors : C → ℘(C)` already states. **The design knows nothing of plans** (`b3b5a64c`), so the
  block drops `realizes : unit ⇀ anchor @ plan` and the unbuilt-concept law
  `∀ c : ∄ unit ⟨realizes(unit) = anchor(c)⟩ ⇒ SURFACE` (lines 42 and 71 at `b3b5a64c`). That law
  moves to `deliver`, which reads both domains and already borrows `realizes @ plan` (`PLAN.md`
  N10). **One sense of
  supersession** (§ Boundaries at `4610c33f`): the lattice law
  `supersede(c, c') ⇒ phase(c) := superseded ∧ supersededBy(c) = c' ∧ c ∈ C`, with `Phase` and
  `supersededBy : C ⇀ C`, reads a superseded concept as replaced by another concept; it is restated
  in the design's sense — a supersession is a new version of the same concept, the prior version
  stays resident as history, and `amend(C) ≜ supersede` keeps its no-overwrite gloss. A concept that
  genuinely becomes another is a retraction plus a definition, and the block says so. The
  commit-keyed `amends`/`accepts` pair goes too; the separation law survives as "a reconciliation is
  an amendment and never shares a record with an acceptance". The piece-level `pin`/`digest` pair
  leaves `design`; `cut`, `closure`, `blast`, `anchor`, `gloss`, `factors` and `denotes` stay. Every
  borrower of a removed sign is migrated (at `4610c33f` none outside the cell:
  `git grep -nE "supersededBy|Phase" -- packages/canon/src ':!packages/canon/src/skills/design'`).
- **`plan`** — `runtime: { capability: 'plan', … }`; intents reach show, add, revise, advance, bind,
  close and reconcile through `scripts/plan.mjs <verb>`. It holds reconciliation of plans and units
  as the architect's alone. **It is the one home of the plan and unit lifecycle states**
  (§ Boundaries). The states are declared once in this module and carried on the `Skill`'s runtime
  face as the capability's configuration, in the shape `lifecycle-configuration` added. They are
  interpolated into the formal block, which replaces `States ≜ { ${PLAN_STATES…} }` and the
  `plan-states.ts` import.

  The block carries the plan and unit laws at `0c9da09c`:
  - binding a plan returns whichever plan was bound to proposed, so at most one is bound;
  - there is one live plan per name, and one live unit per name within its plan;
  - a plan is revisable (its name and the concepts it realizes, never its state); its state moves
    only through bind and close, and `revise` routes to a unit or a plan;
  - a unit realizes exactly the concept its pin names, and its lifecycle moves forward one step at
    a time;
  - a unit's dependencies are acyclic and name live units of the same plan;
  - a unit is ready when every dependency has reached completion or moved past it, and no owed
    ruling names the unit or its plan;
  - an owed ruling is any live note that blocks a plan or unit, whatever its kind, reached through
    the `note` capability's verbs; one naming a plan blocks binding it and every unit in it.

  It pins and advances. `pin` is taken only when the concept and its whole closure are settled and
  live. A unit is drifted when its pinned version is no longer the concept's only head (the concept
  was amended, withdrawn or diverged), and otherwise suspect. A retraction in the design never
  breaks a plan's laws; it drifts the units pinned to that concept. Both readings are declared here, replacing `pin(s) ≠ digest(s) ⇒ REFUSE`. The `mirror` sign, `advance ⊨ mirror`
  and the `→ mirror →` step are deleted. `R`, the census, outputs, wave and acceptance laws stay
  (`boundary-binding.test.ts`'s fixture borrows `R`).

- **`deliver`** — reads both (show) and records acceptance by advancing a unit (`advance @ plan`).
  `bound(P)` is now the plan entity's state: binding and closing are `plan` verbs the architect uses
  at deliver. The WIP law `∃! P : bound(P)` is now held by binding, which returns the previous plan
  to proposed, and `terminal(P) ⇒ retire(P)` becomes closing, which keeps the plan readable instead
  of deleting it. It gains the unbuilt-concept law from `design` (N10). `file(d)` captures to the notebook through the `note` capability's verb, without
  borrowing from the `note` skill (`PLAN.md` § Contract, W3 isolation).

The canon half of the lifecycle round trip lands here: `event-vocabulary.test.ts` § (c) gains a leg
that emits the host config from the live corpus (so the `plan` skill's declared states), reads it
back with the runtime's reader, and compares it with the `plan` skill's declaration.

Every test comment calling `event-tap` "the last" shim carrier becomes false when `design` and
`plan` declare capabilities; rewrite each without enumerating the carriers, so `note-skill` landing
beside this unit leaves it true.

## Static

- `git show 9e3e1a6f:docs/design/record-store.md` § The three domains, § How they are met,
  § Boundaries.
- `packages/canon/src/skills/{design,plan,deliver}/skill.ts`, `packages/canon/src/skills/event-tap/skill.ts`.
- `packages/canon/test/boundary-binding.test.ts`, `reader-reach.test.ts` (pins on `deliver`'s
  block), `event-vocabulary.test.ts` § (c).
- The landed `design` and `plan` capabilities and the configuration shape; `skill://create-skill`
  and `signify` for every sign changed.

## Deps

`domain-interface`

## Outputs

- `packages/canon/src/skills/design/skill.ts`
- `packages/canon/src/skills/plan/skill.ts`
- `packages/canon/src/skills/deliver/skill.ts`
- `packages/canon/test/boundary-binding.test.ts`
- `packages/canon/test/reader-reach.test.ts`
- `packages/canon/test/event-vocabulary.test.ts`
- `packages/canon/test/bin-name-single-home.test.ts`
- `packages/canon/test/runtime-shim.test.ts`
- `packages/canon/test/capability-keyspace.test.ts`
- `.changeset/trio-skill-routing.md`

## Accept

1. `git grep -nE "mirror|plan-states|PLAN_STATES|digest" -- packages/canon/src/skills/plan packages/canon/src/skills/design`
   prints nothing (at `c501e002` both files hit).
2. `git grep -n "capability: 'design'" -- packages/canon/src/skills/design/skill.ts` and
   `git grep -n "capability: 'plan'" -- packages/canon/src/skills/plan/skill.ts` each hit once.
3. The lifecycle states are declared once, in the `plan` skill:
   `git grep -lE "'(proposed|bound|closed|pending|active|completed)'" -- 'packages/*/src'` lists
   `packages/canon/src/skills/plan/skill.ts`, plus only files `plan-cutover` deletes
   (`packages/canon/src/plan-states.ts`, `packages/runtime/src/capabilities/carry-on/**`) and
   `packages/runtime/src/ports/memory.ts` (`SessionState`, a different concept).
4. `pnpm --filter @cratylus/canon test -- event-vocabulary` passes, including the live leg: the
   states the runtime reads back equal the `plan` skill's declaration.
5. `deliver`'s formal block borrows `advance` from `plan`, names bind and close where it named
   retire, and `pnpm --filter @cratylus/canon test -- boundary-binding reader-reach` passes.
6. `design`'s formal block contains `reconcile` with the architect-only authority over it; the
   two-concept supersession is gone —
   `git grep -nE "supersededBy|Phase|supersede\(c, c'\)" -- packages/canon/src/skills/design` prints
   nothing (at `4610c33f` it hits lines 36–38 and 54) — and
   `git grep -nE "retract.*define|define.*retract" -- packages/canon/src/skills/design/skill.ts`
   hits the law that a concept becoming another is a retraction plus a definition.
7. `git grep -niE "record store|record id|envelope|records/" -- packages/canon/src/skills` prints
   nothing, and `git grep -nE "@ note\b" -- packages/canon/src/skills/design packages/canon/src/skills/plan packages/canon/src/skills/deliver`
   prints nothing.
8. Sole: `git grep -l "capability: 'design'" -- packages/canon/src` and the same for `'plan'` each
   list exactly one file.
9. `plan`'s formal block names `reconcile` with the architect-only authority over it. The return
   quotes the block's one line defining an owed ruling. That line must say a live note blocking a
   plan or unit, and name none of `idea`, `question` or `decision`. A blanket grep for `question`
   cannot serve: at `0c9da09c` it already hits `deliver`'s "three questions" and `plan`'s
   "unanswered question".
10. The design skill knows nothing of plans:
    `git grep -nE "@ plan|realizes" -- packages/canon/src/skills/design/skill.ts` prints nothing (at
    `b3b5a64c` it hits lines 42 and 71). `deliver`'s block carries the unbuilt-concept law, which
    the return quotes.
11. `pnpm verify` passes.
12. `.changeset/trio-skill-routing.md` names `@cratylus/canon`.
