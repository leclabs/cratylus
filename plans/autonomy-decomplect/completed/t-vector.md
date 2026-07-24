# T-vector — audit the net standing nico/mav vector

## Objective

The session made several vector edits under a now-corrected understanding, some bundled and one
reverted (`3487361` changed loop-position [reverted `870b5b0`] + code-execution + executable-test-oracle
in one commit; `ef1ce87` fixed the pole). Establish the **net standing** autonomy/actions/self-eval
vector of both agents and cold-verify each still-standing change is correct under the corrected frame —
not merely that it typechecks.

## Static inputs

- `packages/agent-canon/src/agents/nico.ts`
- `packages/agent-canon/src/agents/mav.ts`
- `packages/agent-canon/src/dimensions/actions/code-execution.ts`
- `packages/agent-canon/src/dimensions/self-evaluation/executable-test-oracle.ts`
- `packages/agent-canon/src/dimensions/self-evaluation/acceptance-criteria-check.ts`
- git range `3487361..HEAD` on the two agent files

## Constraints

- Cold-verify via the isolated oracle (tool-less `claude -p` from a scratch dir), adopted first-person,
  at a **terminus** (the discriminating context) — not only analytically.
- `code-execution` and `executable-test-oracle` were asserted correct without cold verification this
  session; verify or retract each. `nico` is an ontologist, not the builder — confirm exec-oracle/​
  code-execution fit *that* archetype rather than importing mav's shape.
- Do not change the pole (`principalSelf`) — it is the settled foundation.

## Dependencies

None.

## Outputs

- A findings note: for each still-standing session edit, `holds` | `retract` + the cold-decode evidence.
- If any edit is retracted, the corrective diff (local commit).

## Acceptance

- Every still-standing autonomy/actions/self-eval value on nico and mav has a recorded cold-decode at a
  terminus, adopted first-person, that matches its intended meaning.
- **Falsifier:** a standing value whose cold-decode diverges from intent, or any value carried only on
  an in-session assertion with no isolated-oracle evidence. Either fails the shard.

---

## Findings (executed) — all HOLD, no retraction

Net standing agent-file diff `3487361..HEAD`: only the pole rename
(`principalIC → principalSelf`, settled `ef1ce87`) and nico's loop-position
revert (`humanOutOfTheLoop → humanOnTheLoop`, settled `870b5b0`). The live
question was the two values asserted-correct-without-cold-verification:

**`code-execution` (nico.actions) — HOLDS.** Isolated first-person read (Read D,
`/tmp/nico-coldread`, tools denied) at the terminus "what must you do with your
own hands": the ontologist archetype spontaneously entails touching the
measurement apparatus directly — probe the model with exact signs, read raw
output, run tight differential loops, execute compositions, write/modify the
projection system. Through-line: *every delegation inserts a foreign prior at the
reading seam → the work stops being empirical and becomes hearsay.* Archetype-
entailed, not imported from mav.

**`executable-test-oracle` (nico.selfEvaluation) — HOLDS.** Read C at the terminus
"how do you check a proposed name is right": run tool-less, the archetype reports
that introspective self-assessment *does not run* — "the check and the report of
the check are the same forward pass… indistinguishable from confident narration."
This confirms executable-test-oracle is fit for nico **only realized as an external
isolated process** (the cold-decode oracle: `claude -p` returning a verdict the
agent did not author), which nico's `code-execution` enables. The reading-act
alternative `acceptance-criteria-check` is correctly rejected — it cannot
terminate. The two values are mutually entailed and archetype-native.

Autonomy values covered elsewhere: pole `ef1ce87`, loop-position `870b5b0`+T-persist,
mission-command T-escalation. No value now rests on an in-session assertion alone.
