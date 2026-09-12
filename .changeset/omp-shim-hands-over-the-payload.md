---
'@cratylus/forge': patch
---

The omp shim hands the stance worker its payload, so `agent_end` judges the turn

The stance guardrail has never judged an omp turn. It is deployed, opted in
(`agentfactory.stanceGuard=true`), scoped to `mav` and `nico`, and registered on `agent_end` —
and it was firing `sh stance-guardrail.sh` with no stdin. The workers are written to the Claude
hook contract: a JSON envelope on stdin naming a JSONL transcript. `input="$(cat)"` read empty,
the worker exited at its first guard, and every turn of every omp session reported nothing.
A gate that is installed, enabled, and judging NOTHING is indistinguishable from a gate that
finds no fault, which is how the agents' declared laws went unenforced without anyone noticing.

`ExecOptions` is signal · timeout · cwd — there is no stdin — so the shim materializes the
envelope itself: a temp dir per fire, the turn written as the transcript lines the worker's
`jq` already parses, and the envelope arriving by redirect. Only the SHAPE is translated;
the extraction semantics (whole turn since the last real user message, tool activity marked,
text-only projection for the evidence check) stay in their one home inside the worker.

The identity in the envelope is read from PLACEMENT — the module's own grandparent directory
names the scope — so a persona copy reports that persona and the session root reports a name
that matches no allowlist. No runtime identity check was added.

omp takes no result from `agent_end`, so a verdict reaches the session by queueing a
continuation, which is the same shape as refusing the stop. Delivery is bounded to a CHANGED
verdict: `dark` says the judge is unreachable and keeps saying it, and re-opening the turn
forever on an informational fact is a livelock. A block's reason carries a per-session count
and the worker's no-progress detector turns a genuine repeat into a different notice, so a real
block is never suppressed.

Verified end to end on a live `mav` session: the judge received a correctly assembled
`=== OPERATOR === / === AGENT ===` payload, a stub BLOCK produced
`{"decision":"block",…}` through the evidence check, and an interactive session took the
continuation (two `agent_end` fires). With the real judge the worker now reports
`STANCE GUARDRAIL — DARK: the judge did not answer` instead of silence.
