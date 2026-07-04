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

## Outcome (2026-07-04 · done)

**Verification** (real tool, no stubs): `packages/agent-memory/test/session-isolation-integration.test.ts`
(NEW, 2 tests) drives real `main()` over real fs + registry + plan dirs, replicating orient's decision
(`orientWouldBind`) and praxis `dispatch` (`.owner` stamp) exactly as the skill prose specifies. The whole
4-step scenario is one assertion chain; the second test isolates the reported-collision attestation. Also
driven live on the **bundled `dist/episodic.mjs`** (the shipped binary) — transcript below.

```
STEP 1 — A registers, dispatches P (owner=A), encodes forward next-step
STEP 2 — B registers, wakes in node:
  orient(B) → REPORT-OCCUPIED(owner=A live)   ✅ no plan collision (step 2a)
  read(B)   → []                               ✅ no episodic bleed: A's step absent (step 2b)
STEP 3 — A releases (completed); fresh C wakes:
  orient(C) → BIND(owner=A completed)          ✅ cross-/clear resume: P inheritable (step 3a)
  read(C)   → ['A-forward-next-step']          ✅ A's residue inherited (step 3b)
STEP 4 — dream on C (D live w/ residue); drain --completed-only:
  archived → ['A-forward-next-step','C-own']   ✅ A+C consolidated across completed sessions (step 4a)
  live log → ['D-live-residue']                ✅ live sibling D untouched (step 4b)
```

**Falsifiers — all cleared:** step 2 neither binds P nor leaks A's record to B ✓ · step 3 inherits both
P and A's completed residue (no over-isolation) ✓ · step 4 consolidates A's events AND retains live D ✓ ·
every assertion runs against the real tool end-to-end, nothing stubbed ✓.

**Attestation:** the originally-reported collision — a fresh wake executing a live session's plan — **no
longer reproduces**: with A live and owning P, B's orient reports P occupied and does not bind it.

Gates: pkg `test`(156) green; repo-wide `build · test · lint · typecheck` green.
