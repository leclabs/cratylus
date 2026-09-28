---
"@cratylus/canon": minor
---

The design, plan and deliver skills route to their domain capabilities

`design` declares `runtime: { capability: 'design' }` and scripts its verbs
through `scripts/design.mjs`: show, define, amend, retract, reconcile and trace.
It states the design's laws. There is one live concept per anchor, and a
withdrawn concept keeps its anchor. Factors are acyclic and name live concepts.
Every gloss and every reason is non-empty. A supersession is a new version of
the same concept, and a concept that becomes another is a retraction plus a
definition. Reconciling the design is the architect's alone. The design no
longer mentions plans, and its piece digest is gone.

`plan` declares `runtime: { capability: 'plan', configuration }` and is the one
home of the plan and unit lifecycle states. They reach the runtime as the
configuration deploy emits. `plan-states.ts` no longer feeds the formal block.
Plan verbs are scripted through `scripts/plan.mjs`. The block states the plan
and unit laws. At most one plan is bound, and closed is final. A unit realizes
the concept its pin names. A unit is ready when its dependencies are satisfied
and no owed note blocks it or its plan; the note skill defines `owed`, and plan
borrows it. A pin is retaken only by `revise --repin --reason`, and a unit
whose pin has moved is drifted or suspect. The `mirror` law is deleted.

`deliver` borrows `advance`, `bind`, `close`, `bound` and `ready` from `plan`.
It records acceptance by advancing a unit, and it closes a finished plan where
it used to retire one. It carries the law that a concept nothing builds is
surfaced. It files a defect beside the path through the note capability, and
names the unit `u of plan p`.
