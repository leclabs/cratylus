// plan-states.ts — the CANON home of the sharded-plan-layout state folders, in
// lifecycle order. ONE home, two consumers (DRY): the `praxis` skill's formal
// block (`../skills/praxis.ts`, whose `States ≜ {…}` set derives from here) and
// the canon project template (`./project-template.ts`, whose `planStates` is
// this). It lives here — not as a second export on the praxis skill module — because
// a skill module carries exactly one export (its `Skill`); this is praxis's canon,
// factored out to a sibling both can source.

/** The plan-layout state folders, in task-file lifecycle order. */
export const PLAN_STATES = ['pending', 'ready', 'active', 'completed'] as const;
