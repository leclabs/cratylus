# memiso-3 · integration gate: concurrent-session no-collision + drain consolidates completed

**Sub-DAG** memory-session-isolation · **Wave** 2 · **Deps** memiso-1 ⊳dep · memiso-2 ⊳dep · **State** pending

## Objective

End-to-end verification that the redesign fixes the reported failure (two nico faces colliding) WITHOUT
breaking cross-`/clear` resume or cross-session consolidation. Drive the real flow, not just unit tests.

## Scenario (must pass whole)

Two sessions A, B in the SAME node, one plan P:

1. A registers (live), dispatches P (owner=A, tasks in active/), encodes a forward next-step.
2. B registers (live), WAKES in the node:
   - B's orient must REPORT P occupied (owner=A live) and NOT bind it. ✅ no plan collision.
   - B's `read --for-session B` must NOT contain A's forward next-step. ✅ no episodic bleed.
3. A `release`s (completed). A fresh session C wakes:
   - C may inherit P (owner completed) and A's forward residue. ✅ cross-`/clear` resume preserved.
4. Dream on C: `drain --completed-only` consolidates A's durable events into the store/AGENTS.md, leaves
   any still-live session's residue untouched. ✅ consolidation across completed sessions intact.

## Acceptance (falsifier — each step is a distinct assertion)

- FAIL if step 2 binds P or leaks A's record to B.
- FAIL if step 3 cannot inherit P or A's completed residue (over-isolation regression).
- FAIL if step 4 fails to consolidate A's events, OR drains a still-live session's residue.
- FAIL if any assertion passes only because behavior was stubbed rather than exercised end-to-end.

## Return

The scenario transcript with each ✅/FAIL assertion evaluated against real tool + skill behavior, plus a
one-line attestation that the originally-reported collision (fresh wake executing a live session's plan)
no longer reproduces.
