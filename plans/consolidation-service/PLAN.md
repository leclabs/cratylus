# consolidation-service

> Consolidation stops being an act an agent performs and becomes a service the system runs.

## The datum

**8 of 10 agent homes have never consolidated** — still seed-sized, 470–496 B. Only `mav` and
`nico` have a past. The ritual is agent-invoked, so it runs only when a busy session remembers
to run it. For 80% of the fleet the persistent-being invariant is already failing, silently.

That is not an efficiency problem, and it is why the trigger has to move. A separate agent
that is still _summoned by the primary_ inherits the same failure.

## What the research established, and what it refuted

- **(c) inefficient and disruptive — CONFIRMED.** Wake loads 30,759 B before any work; dream's
  composition closure adds 19,517 B to consolidate records averaging 1,435 B.
  `consolidationOwed` fires at 12 records and `encode` is a per-turn duty, so wake almost
  always fires a dream. `mav`'s PROCEDURAL sits at 7,950/8,000 B — the next dream refuses
  nearly any landing and demands a whole-store rewrite as a _precondition_, in the primary's
  working context.
- **(a) cwd-node confuses continuity — REFUTED.** `node` is computed at fold time, not stored;
  the routing law already reads scope from record text. The live residue is one flag:
  `session begin --under` hard-drops records with no cwd AND records from a foreign host,
  which on a 6-host fleet erases exactly the cross-machine continuity being protected.
- **(b) dream coupled to handoff — REFUTED.** `handoff ⊃ dream` matches the field. The
  disruptive coupling is `wake ⊃ dream`, whose law is _blocking_.

## Shards

| state   | task                     | concern                                                       |
| ------- | ------------------------ | ------------------------------------------------------------- |
| ready   | `t-uncouple-the-trigger` | wake stops performing a dream; handoff enqueues after release |
| pending | `t-close-the-under-flag` | remove the flag that erases cross-host continuity             |

## Not in this plan

The dreamer agent, the scoring layer, and recall-count instrumentation. Each is real and each
is larger than a shard; the two here are the ones that are cell edits and that stop the
bleeding. Recall-count in particular is a prerequisite for scoring and does not exist —
**nothing currently records that a store line was ever used.**
