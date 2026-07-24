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
