# Ts · reconcile-parallel-work

**Wave** 1 · **Deps** T1 ⊳dep (oracle) · **State** pending
_Prepended reconciliation: the warm face executed some of this plan's work prematurely (triggered by
the re-ground prompt). Absorb it into the plan without trusting the warm face's account._

## Principle

Runtime is authoritative for STATE; the plan + oracle are authoritative for ACCEPTANCE. The plan judges
ARTIFACTS via the oracle gate, never an executor's claim (zero-trust — and this executor was the
mis-aligned party). No artifact wins by provenance; `R_cold` adjudicates.

## Steps

1. From REPO GROUND TRUTH (not the warm face's narrative), inventory every artifact the parallel work
   produced: any law fragment, oracle/harness attempt, realigned fragment, gate wiring.
2. Map each artifact to the plan task it corresponds to (T0 / T1 / T3-shard / T5 …).
3. Judge each mapped artifact through that task's acceptance gate (T1 oracle + the task's falsifier):
   - PASS ⇒ sync state→truth: mark the task completed, adopt the artifact, do NOT re-dispatch it.
   - FAIL ⇒ reject-and-return with the failed criterion; the task stays open (premature mis-aligned
     work is exactly what this plan guards — catching it here is the plan working, not a setback).
4. **Competing homes** — where parallel work created an artifact competing with another (e.g. two law
   fragments, two oracle harnesses, or against the clean-authored staged reference): m2 case, two homes
   for one concept. The oracle decides — artifact(s) with `R_cold ≡ intent` survive; if >1 survives,
   COALESCE to a single canonical home (MECE/DRY). Neither the warm face's nor the clean reference's
   wins by authorship.
5. Emit the reconciled task-state delta (which tasks are now pre-completed, which reopened) so T3 does
   not re-do satisfied work.

## Acceptance (falsifier)

- FAIL if any artifact was adopted on assertion without an oracle transcript proving `R_cold ≡ intent`.
- FAIL if two competing homes for one concept both survive (MECE violated — must coalesce to one).
- FAIL if a task is marked complete while its artifact fails the cold-blind gate (grandfathering
  mis-aligned work — the exact inversion this plan exists to prevent).

## Return

Reconciliation table `[ { artifact, mapped_task, gate: pass|fail, action: adopt|reject|coalesce,
oracle_transcript } ]` + the task-state delta (pre-completed / reopened).

---

## Outcome — PASS (2026-07-03) · reconciliation table

Inventory from repo ground truth (commit dc3ba69), not the warm narrative. Each artifact re-gated by
the T1 oracle (`bin/cold-oracle.sh`); commit's "reproduced" claims TRUSTED FOR NOTHING, re-run independently.

| artifact                                               | mapped_task         | gate | action | oracle evidence                                                                                                 |
| ------------------------------------------------------ | ------------------- | ---- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `organs/engineering-principles/cold-decode-oracle.ts`  | T0 (law)            | PASS | adopt  | R_cold recovers oracle-as-arbiter + m1/m2 noise-detector + correction-direction (project→cold-truth, never f→K) |
| `organs/provenance/nico-archetype-cyan.ts` (realigned) | T3·provenance-shard | PASS | adopt  | R_cold reads clean provenance/standing; exercise ceded to [[human-on-the-loop]]; autonomy-bleed gone            |
| `agents/{nico,mav,principal-ic}.ts` (+import)          | wiring(T0)          | PASS | adopt  | compositional; typecheck+projection-stability green at commit                                                   |
| `skills/exemplify.ts` (cite [[cold-decode-oracle]])    | wiring(T0)          | PASS | adopt  | accept-gate cites the law; green at commit                                                                      |

**Competing homes:** none survive dual. Single law home (blank/ held only task specs — no rival law). Siblings
`self-evaluation/{executable-test-oracle,acceptance-criteria-check}` are MECE-distinct (machine-test / spec-check
≠ cold-LLM-decode) — not competing homes; no coalesce needed.

**Task-state delta:**

- T0 → PRE-COMPLETED (adopt cold-decode-oracle.ts; do NOT re-dispatch). Lean fragment passes the oracle gate;
  the T4 parties/commutation formalism is a ratification concern, not restated in the deployed law (parsimony/DRY).
- T3·provenance-shard → PRE-SATISFIED (adopt realigned definiens). Other T3 shards remain open.
- No task reopened; no artifact adopted on assertion (each has an oracle transcript or the build gate).

**Watch-item (→T3/T4, not a Ts blocker):** whether arb(σ\*(intent)⊥surface)→intent is a Provenance residue or
fully absorbed by human-on-the-loop — a deeper MECE refinement; the oracle saw no bleed, so it does not block.
