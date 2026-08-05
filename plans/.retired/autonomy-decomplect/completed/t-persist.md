# T-persist — loop-position as phase-state with a persistence rule

## Objective

Fix the degradation the operator witnesses: `carry-on` re-affirms autonomy once, then the elevation
decays per-turn and the next terminus reverts to the resting on-the-loop position, handing control back.
Model loop-position as **session state** (not a static value), and give `carry-on` a **persistence rule**
that holds the out-of-loop elevation bound to the active praxis until completion or an unresolvable fork.

## Static inputs

- `packages/canon/src/skills/carry-on/skill.ts` — currently `check-in-close ↦ human-on-the-loop → human-out-of-the-loop`, no persistence.
- `packages/canon/src/dimensions/autonomy/human-on-the-loop.ts`
- `packages/canon/src/dimensions/autonomy/human-out-of-the-loop.ts` — `⟨intent-before · audit-after⟩`
- `packages/canon/src/skills/praxis/skill.ts` — for `active(P)`, `done(P)`, the praxis lifecycle the persistence binds to.
- `packages/canon/src/skills/wake/skill.ts` — wake binds the work-thread/active plan; the resting position is set here.

## Constraints

- The SOUL declares the **initial/resting** loop-position = on-the-loop (D2); the **live** position is
  state. Do not encode the live position as a static SOUL value.
- Persistence (D3): `carry-on` elevates to out-of-loop and the elevation **holds** from the trigger
  across turns, bound to the active praxis `P`, until `done(P)` **or** an unresolvable
  `fork(irreversible · value · competence)` re-enters on-the-loop. Per-turn decay is the bug; a bound,
  persisting state is the fix.
- The rule must be **carried in the projected artifact** (the `carry-on` formalBlock and/or wake), not
  only in this plan — an un-projected rule does not bind (`understanding≠encoding`).
- Cold-verify: an isolated reader of the rewritten `carry-on` block must reconstruct "the elevation
  persists to praxis completion," not "for this turn."

## Dependencies

None.

## Outputs

- `carry-on/skill.ts` formalBlock rewritten with the persistence rule + praxis binding.
- Whatever minimal annotation makes the resting-vs-live distinction legible (wake and/or the
  loop-position dimension), without encoding live state as a static value.
- A cold-decode transcript demonstrating the persistence reconstructs correctly.

## Acceptance

- The projected `carry-on` SKILL.md, cold-read in isolation, yields: after carry-on the out-of-loop
  stance **persists until the bound praxis completes**, broken only by an unresolvable fork.
- **Falsifier:** a cold reader concludes the elevation lasts one turn, or cannot say what ends it, or the
  rule lives only in the plan and not the projected cell. Any of these fails the shard.
