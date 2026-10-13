---
'@cratylus/schema': minor
'@cratylus/canon': minor
---

Typed handoffs. `@cratylus/schema` adds `JsonSchema`, `AgentContract` and `ContractCheck`, and the one assignment check every handoff runs: `assignmentIn(text)` reads the JSON of a dispatch text's fenced `assignment` block, and `checkAssignment(agent, schema, value)` names each missing and ill-typed field (`lead assignment is missing: examples`). Both reference nothing outside their own bodies, so a harness module may carry their source. `Agent` gains `contract` (the assignment and deliverable schemas) and `persistence` (the per-turn persistence protocol). Canon's assignment and deliverable values carry their schemas (`ASSIGNMENT_CONTRACTS`, `DELIVERABLE_CONTRACTS`), and composition copies them onto the lead, builder, assayer, check-writer and illustrator. The architect's free-text intent has none.

Reach: the read-only derivation is gone. `Agent.readOnly` is removed and no composed agent is narrowed, the assayer included; only handoffs stay a permission.

The architect is restored as the client's principal architect, owning the conceptual design and delivery of the product. `communication-style` gains the optional slot `ordering` (`Slot.optional`), and the architect holds `bottom-line-up-front` there, fixed. Its reconstitution procedure reads each touched context's overview first, then the detail it needs from the concept journal and the ledger, then reads the design, open decisions and cuts in flight back before acting. The persona genus moves from `genus/persona.md` to `genus/persona.ts` (`personaProtocol`), now names all seven drift tells, and is carried on every composed agent.

Guards. `@cratylus/schema` adds `GuardCell` and `GuardJudge`, a hook cell that judges an act through a judge prompt and a JSON verdict instead of a worker, and `Layout.guards`. `guarded(value, guard)` makes a value enforce itself through a guard, so the guard binds exactly the agents composing that value.
