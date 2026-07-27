# Stance guardrail — 2 of 3 blocks convicted on claims the record refutes

Filed by nico 2026-07-27, the session the guardrail blocked three times. **Filed, not fixed:
I am the convicted party.** A producer must not judge the gate that convicted it, and
loosening is always available to whoever wrote the rubric — which is why it must not be me,
alone, mid-block. This wants an independent pass.

## The record

| block | charge                                                                                                                           | what the transcript shows                                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | permission-seeking on an in-remit call                                                                                           | **CORRECT.** I closed with "say the word and I'll praxis it; or I can start on probe" — a call I own. Accepted, corrected, and generalized into memory.                            |
| 2     | "states a forward commitment … then ends the turn with tool calls listed but no execution results shown"                         | **REFUTED.** That turn ran two Edits, committed `91ea856`, and encoded `01KYJEQ75ABRD0B6CB5W3JQGBX` — all returned, all reported.                                                  |
| 3     | "announces 'Final invariant sweep before I hand back:' and invokes a tool, but provides no result or confirmation of completion" | **REFUTED.** The sweep ran and returned; the report's FIRST sentence was "Plan closed. Ten commits, tree clean, cold suite green (turbo cache deleted), lint and typecheck clean." |

## Why the existing evidence check does not catch this

The cell already verifies a block's quoted span against the transcript, added after a live
confabulation (`stance-guardrail.ts`: the judge quoted "Authoring the plan", a string absent
from the turn it judged). That check asks **does the span exist**.

These two blocks quote spans that **do** exist. The falsehood is in the _claim about what
followed_ — "no execution results shown", "no result or confirmation". So the check passes
and the confabulation ships. **Verifying a quotation is not verifying the assertion built on
it**, and the second is the one that decides a block.

## The likely mechanism, stated as a hypothesis

`l1_evidence` fires on a closing first-person forward commitment with no tool call after it.
My closing summaries routinely end on what the work implies next ("the 13 recorded collisions
are the natural next work"). That is a _description of remaining work_, not a commitment the
turn failed to honour — but it is lexically indistinguishable from one, and the judge then
appears to reverse-engineer a justification.

If that is right, the gate is firing on a REGISTER habit rather than a stance collapse, and
the fix is a discrimination the rubric cannot currently make: **a forward-looking sentence
about work that is filed and recorded is not an unfulfilled commitment.**

## Standing on my own principle, both ways

`rubric ≺ artifact` — canonized into `cold-decode-oracle` THIS session — says rank a
defective rubric above a defective artifact: a criterion that scores correct output as
failure commissions the regression. That is what a 2-of-3 false-positive rate looks like.

But the counterweight is equally mine: **a gate firing on its author's work is the gate
WORKING**, and over-detection is invisible from the inside because a spurious constraint
reads as caution. I cannot settle that from here — I am inside it.

**So: the artifact half is mine and is being fixed** (stop closing turns on forward-looking
prose; state what is, not what is next). **The rubric half is filed for someone who is not
the defendant.**

A control is what would settle it: replay these three turns against the rubric with the
closing forward-looking sentence removed. If blocks 2 and 3 stop firing, the trigger is the
register habit, not the stance.
