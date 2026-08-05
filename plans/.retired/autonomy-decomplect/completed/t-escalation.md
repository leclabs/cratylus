# T-escalation — cold-verify mission-command's role under the pole's entailment

## Objective

The corrected pole `π_decision-authority(self) = principal` cold-decodes to already include "irreversible
acts are confirmed because a principal weighs blast radius" and "the operator owns goals/values." So
`mission-command ⟨escalate ⇔ fork(irreversible · value · competence)⟩` is **partly entailed** by the
pole. Decide, against the oracle, whether it stays as the explicit escalation trigger or folds — and if
it stays, that it is not redundantly re-asserting what the pole carries.

## Static inputs

- `packages/canon/src/dimensions/autonomy/mission-command.ts`
- `packages/canon/src/dimensions/autonomy/decision-authority.ts` — the entailing pole.
- The T-vector / pole cold-decode transcripts (what the pole already carries).

## Constraints

- Signification act — cold-verify, never decide by preference. Test: does an agent carrying **only** the
  pole escalate correctly on a `fork(irreversible · value · competence)`? If yes, `mission-command` adds
  nothing the pole lacks and folds. If the pole's escalation is vaguer than the explicit fork-predicate,
  `mission-command` stays for that **precision** — but reworded so it does not re-assert the pole, only
  the trigger the pole leaves implicit.
- Run the argmin form (`explain: <candidate>`, no leading frame) on the pole alone and on pole +
  mission-command; the delta is what mission-command actually contributes.

## Dependencies

None. (Its structural home is T-mece's concern; this shard decides only whether the concept survives and
in what wording.)

## Outputs

- A verdict: `keep-reworded` | `fold` + the cold-decode delta that justifies it.
- If keep-reworded: the corrected `mission-command` value. If fold: the removal + confirmation the pole
  covers escalation, deferred to T-mece to apply structurally.

## Acceptance

- The keep/fold decision is backed by a measured cold-decode delta between pole-alone and
  pole+mission-command, not by assertion.
- **Falsifier:** the verdict rests on preference or on a single leading-frame prompt; or `mission-command`
  is kept while its cold-decode is fully covered by the pole (redundant), or folded while the pole's
  escalation is demonstrably vaguer than the fork-predicate (lossy).

---

## Verdict (executed) — KEEP as-is

Measured cold-decode delta via two isolated first-person reads with identical
non-leading escalation questions (`/tmp/nico-coldread`, tools denied):

- **Read A — pole alone** (`π_decision-authority(self) = principal`): yields a rich
  escalation policy, but organized around reversibility + out-of-scope + ambiguous-
  intent + contradiction. It **omits the `competence` axis entirely** and fuzzes
  `value` into "ambiguous intent with different branches."
- **Read B — pole + mission-command**: yields the exact triad — irreversible /
  value-laden / beyond-competence — plus the structural insight the pole lacks:
  escalate ⇔ a fork that is _also_ one of the three (conjunction), not on scope/
  contradiction regardless of fork.

**Delta = competence (added) + value sharpened + fork∧(any-one) conjunction.** The
pole's escalation is demonstrably vaguer than the fork-predicate, so folding would
be lossy (fails the shard's own falsifier). mission-command's current wording is the
escalation trigger only — it does not re-assert the pole's "decide by default."
Therefore **keep the value unchanged**; no diff to `mission-command.ts`. Structural
home deferred to T-mece.
