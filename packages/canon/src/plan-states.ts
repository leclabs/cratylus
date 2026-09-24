// plan-states.ts — the CANON home of the sharded-plan-layout state folders, in
// lifecycle order. ONE home, two consumers (DRY): the `plan` skill's formal block
// (`../skills/plan/skill.ts`, whose `States ≜ {…}` set derives from here) and the
// canon project template (`./project-template.ts`, whose `planStates` is this). It
// lives here — not as a second export on the plan skill module — because a skill
// module carries exactly one export (its `Skill`); this is the plan cell's canon,
// factored out to a sibling both can source.
//
// The consumer was `praxis` until that cell was superseded by the design/plan/deliver
// trio: praxis carried understanding, specification and governance in one place, and
// the state set belongs to the middle term alone.

/** The plan-layout state folders, in task-file lifecycle order. */
export const PLAN_STATES = ['pending', 'ready', 'active', 'completed'] as const;

/** `frontier(P)` — the states a shard sits in when the plan is workable AT it
 *  (`{ t | state(t) ∈ { ready, active } }`, where the plan IS, not merely
 *  what is dispatchable). A subset of {@link PLAN_STATES} and not derivable from
 *  their ORDER: `pending` is open too, and is not frontier. */
export const PLAN_FRONTIER = [
  'ready',
  'active',
] as const satisfies readonly (typeof PLAN_STATES)[number][];

/**
 * The plan-tier dotfile MARKERS whose only home is here.
 *
 * A relation with no on-disk carrier is not readable — the reading `plan-set.sh`
 * states in its own words when it explains why `.landed` exists ("exactly parallel
 * to `.superseded-by`"). These are the two markers a reader of the plan set needs
 * that have no other TypeScript home: `.superseded-by` already has one
 * (`plan-set.ts`'s `SUPERSEDED_MARKER`) and is deliberately not restated.
 *
 * `.ruling-owed` is the third carrier this corpus has minted on that reading, and
 * it carries the concept the corpus ALREADY signifies as a ruling owed — "a
 * decision nobody has taken", which the retired praxis cell distinguished from a
 * dependency ("a dep waits itself out, a ruling needs a human"). At the SHARD tier
 * that concept is `ruling-owed(t)`, and it gates `ready`; at the
 * PLAN tier it had no carrier at all, so a fork the principal cannot resolve —
 * irreversible, or above its competence — was unreadable from disk however loudly
 * it had been surfaced. Its content is the fork as it was put to the operator.
 */
export const PLAN_MARKERS = {
  /** `bound(P)` — the plan-level commitment; exactly one plan carries it (WIP=1). */
  bound: '.bound',
  /** `fork⊥(P)` — a fork surfaced to the operator, whose ruling nobody has taken. */
  rulingOwed: '.ruling-owed',
} as const;
