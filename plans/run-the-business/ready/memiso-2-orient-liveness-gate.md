# memiso-2 · orient + drain skill layer: liveness-gated plan-bind ⚡ HIGH PRIORITY

**Sub-DAG** memory-session-isolation · **Wave** 1 · **Deps** memiso-0 ⊳dep (liveness registry) · **State** pending

## Objective

Close the DOMINANT collision surface: wake's **orient** binds any plan with task-files in `active/`,
owner-blind. Make plan-binding liveness-gated, and make dream's drain call the liveness-aware verb.
Skill/prose SOURCE under `packages/agent-anatomy/src/organs/memory` (wake · dream · memory skills) —
edit source, redeploy; never the `.render-ts`/`~/.claude` rendered copies.

## Spec

1. **Plan owner-stamp.** A plan records its executing session: add `owner: <session>` to the plan
   (PLAN.md front-matter or a `.owner` file). Set when a session dispatches the plan's first task
   (state → active). Cleared/loosened when the owner completes.
2. **Orient becomes liveness-gated** (wake skill): auto-bind an `active/`-populated plan ONLY if
   `owner ∈ {me, completed}`. If `owner` is a LIVE other session, the plan is OCCUPIED — orient REPORTS
   it ("plan X is being executed by a live session; not resuming") and does NOT bind. Falls through to
   the next candidate / a clean orientation.
3. **Dream drain** (dream skill): call the memiso-1 liveness-aware `drain --completed-only`, and read
   via `--for-session`; state in the skill that drain never touches a live sibling's residue.
4. **memory skill**: document the governing principle (session-owned-while-live · consolidation-is-the-
   sole-cross-session-merge · liveness axis) so the model is discoverable, not folklore.

## Acceptance (falsifier)

- FAIL if a fresh wake, with a plan whose `owner` is a LIVE other session, BINDS/resumes that plan
  (simulate: session A owns plan P (active, live); session B wakes in the node → B must report-not-bind P).
- FAIL if a plan owned by a COMPLETED session is NOT inheritable (B must be able to resume P once A is
  completed — cross-`/clear` handoff of a plan must still work).
- FAIL if dream's drain touches a live sibling's records (regression against memiso-1).
- FAIL if the memory skill does not state the liveness model.

## Return

Skill diffs + a transcript: A owns P live → B wakes → B reports "occupied, not resuming"; A released →
B wakes → B resumes P. Plus confirmation dream drain uses the completed-only path.
