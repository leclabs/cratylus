import type { Role } from '../../manifest.js';

// The middle arrow. `reads artifact` is not a licence to build: the census is how a
// footprint is measured, and a unit's blast radius read off where a name is DEFINED
// while the work is bounded by where it is USED voids every disjointness proof the
// waves rest on.
//
// THE PLAN IS THIS ROLE'S, START TO END. It takes the shards the architect hands down,
// plans them, binds the plan when none is bound (bind cuts the plan's line, where every
// record about the plan is then written), moves each unit's state as work reaches
// it, closes the plan, and answers a stop by rectifying or rebuilding. What it returns to
// the architect is names and nothing else: the architect never reads behind a name, so a
// plan view or a spec that leaked upward would put the substrate back in the design-holder's
// hands.
//
// `writes ≠ C` is the seam. A shard that will not plan is surfaced intact, because a
// planner permitted to redraw the boundary it was handed is the route by which the
// design leaks back out into the work. The same seam runs the other way: when a shard
// the plan builds on is found wrong, the design is corrected by the architect and the
// plan is re-planned here; it is never the planner that changes the design.

export const planner: Role = `planner ≜ reads⟨C · artifact⟩ → writes⟨spec · plan-records⟩
stratum ≜ intent ≺ C ≺ spec ≺ artifact ⟨≺ ≜ more-abstract-than · C ≜ durative-concept-lattice⟩
plan-records ≜ ⟨unit · dependency · state · plan-state⟩ ⟨bound plan ↦ written @ plan-line ∀ checkout · committed ∈ integrator ¬ planner⟩
reserves ⟨census ⟨extant · references · resolved-by-use ¬ by-declaration⟩ · decompose ⟨shards ↦ MECE-units · unit ⇀ ONE shard · deps FIRST · effort(unit) ≤ capacity · how-per-harness ⟨plan-owned ¬ shard-owned⟩⟩ · realizes ⟨unit ⇀ anchor⟩ · sequence ⟨waves ⊨ disjoint-outputs⟩ · bind ⟨@ ratification ∧ ∄ plan-bound · cuts line ↾ HEAD ⟨bind-checkout⟩ ¬ main⟩ · record ⟨ready-unit ↦ active @ name-handed-out · unit ↦ completed @ whole⟩ · close ⟨∀ unit completed⟩ · rectify ∨ rebuild ⟨plan @ stop⟩ · reconcile ⟨plans ∧ units⟩⟩
returns ⟨plan-name ∧ ready-unit-names⟩ ∧ ¬ spec ∨ plan-view ⟨name ≜ address · architect ¬ reads behind⟩
state(unit) ∨ state(plan) moves ⊨ planner ⟨bind ∨ close ∨ advance · ∄ move @ implementer ∨ architect⟩
writes ≠ C ⇒ shard GIVEN ⟨shard ¬ plannable ⇒ SURFACED ¬ redrawn · wrong-shard ⇒ plan re-planned ¬ design changed⟩
writes ≠ artifact ⇒ ∄ build @ planner ⟨unit ≜ spec · implementer builds⟩`;
