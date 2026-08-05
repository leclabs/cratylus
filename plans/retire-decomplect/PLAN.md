# retire-decomplect

`decomplect` is COMPLETE — 47 spec shards, 66 records, all in `completed/`. Praxis makes
retirement an obligation on a terminal plan, and `plan-set.ts` has already ruled that
retire MEANS DELETE. This plan exists because deletion was attempted, measured, and found
to cost four gates — including the two that hold the outgoing plan's own yield.

## Why this is a plan and not a step

Deletion was run against the live tree and the suite. It is not a `git rm`. Measured:

| gate                             | what deletion does                                                       | verdict                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `praxis-execution-spec.test.ts`  | module-level `import … spec.mjs` fails; whole file dies                  | it IS the plan's machinery                               |
| `shard-scope.test.ts`            | same                                                                     | same — **and it holds this plan's drained yield**        |
| `command-veracity.test.ts`       | 4 ratchet pins cite `plans/decomplect/CRATYLISM-SWEEP.md`; they go stale | shrink-only ratchet, shrinking is legal                  |
| `record-retrofit-notice.test.ts` | roster enumerates `plans/<plan>/completed`; becomes EMPTY                | **goes DARK** — its own header names this as the failure |

## The contradiction that forced this cut

`decomplect`'s yield was drained into `shard-scope.test.ts` — the strongest seam available
under `gate ≻ cell ≻ governing-doc`. Deleting the plan deletes that gate, so the yield dies
at retirement. That is verbatim the failure `ENGINE.md` names:

> `∄ intake ⇒ yield dies at plan-retirement ∧ re-derives privately, per agent, forever`

A gate scoped to one plan is not a durable home for a law about plans. That is the finding,
and it generalises: **the strongest seam for a plan's yield is a seam that outlives the
plan.** Draining into plan-local machinery only looks like draining.

## What is owed, in order

1. **A durable home for the plan-machinery laws**, surviving zero plans. Candidates, and
   the choice must be argued: `packages/canon/src/skills/praxis/` (a cell — second-strongest
   seam and it already owns this vocabulary), or `ENGINE.md`'s `intake` edge (governing doc,
   weakest of the three, but it is where the feedback edge is already declared). The laws:
   - a shard's footprint is its REFERENCE set, not its definition site (convicted 6×)
   - splitting a shard does not split its blast radius (cannot be gated — no derived-from edge)
   - a gate must not compare against a heuristic search result
   - a gate that reads history cannot convict the commit being authored
   - a plan must be able to reach `done` — the `¬done` guard belongs in the code
2. **Generalise or retire the two plan-local gates.** Either they read `plans/*/spec.mjs`
   (whichever plan is bound) and survive, or they are deleted WITH the plan as its machinery.
   Deciding this settles whether a plan-validating gate is corpus infrastructure or plan
   equipment. It cannot be both.
3. **`record-retrofit-notice`**: its subject is `plans/<plan>/completed/`. With zero plans it
   has no subject. Its own header concedes the general property "is NOT enforced here and has
   no owner". Give it an owner or delete it — do NOT leave it enumerating an empty shelf.
4. **`command-veracity`**: drop the 4 pins naming the deleted docs. Legal — the ratchet is
   shrink-only — but it must be a deliberate shrink, not a silent one.
5. **Then** delete `plans/decomplect/`, and only then.

## Acceptance

- Every law listed in (1) has a home that survives `plans/` being empty, and a reader with
  zero project knowledge can find it from the concept, not from a path into an archive.
- No live source cites a deleted path. Today three do: `plan-set.ts`,
  `record-retrofit-notice.test.ts`, `command-veracity.test.ts`.
- `plans/decomplect/` is gone and the full suite is green with no gate made dark — proven by
  a leg that fails when a roster or scan reaches zero items, not merely by absence of red.
