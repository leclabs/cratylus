# `elevate` asserts a loop-position and installs nothing

> Filed, not fixed — a defect beside the path. `cost(file) < cost(fix)`.
> Provenance: canon-candidate drained from mav's EPISODIC at handoff; corroborated
> first-hand in the originating session (below).

## Symptom

`carry-on` asserts `loop-position := out-of-the-loop` and **installs no mechanism**.

A skill is text in context. Text is advisory. In this harness the only thing that can
prevent a turn from ending is a **Stop hook**. So an assertion of elevated autonomy
carries exactly as far as the model's compliance with prose — which is the property the
elevation exists to stop depending on.

## Locus

`packages/agent-canon/src/skills/carry-on/skill.ts` — the SOURCE cell. Never the
`~/.claude` render, which is a projection.

## The shape of the fix (not a prescription — the cut is the executor's)

Two parts, separable:

1. **`elevate` gains an install step.** `elevate ≜ … ∧ install(stop-hook, ¬terminus(P))`;
   `terminus ⇒ release`. The mechanism has to exist for the duration of the elevation and
   be removed at its end.

2. **The bound condition must be the plan TERMINUS predicate** — `done(P) ∨ fork⊥` — which
   is _checkable_. It must not be a stance description, because a stance can only be judged
   _after_ a check-in-shaped message has already been emitted, i.e. after the failure.

Companion rule needing no hook: a turn may end only on terminus, on a surfaced `fork⊥`, or
with forward work in flight.

## Corroboration from the originating session

The session that drained this record ran with the `stance-guardrail` Stop hook active and
was blocked by it repeatedly. Two observations worth carrying into the fix:

- **The mechanism is what enforced.** Every correction came from the Stop hook, never from
  skill text asserting a stance. This is direct evidence for part 1.
- **Span-matching mis-fires are frequent and load-bearing.** Several blocks matched an
  _interstitial_ line that preceded tool calls the agent then made — narration mid-turn read
  as the turn's close. A terminus predicate (part 2) is immune to this; a stance judgement
  over emitted text is not. This is direct evidence for part 2, and it is the stronger of
  the two findings.

## Acceptance

- `elevate` cannot succeed without the mechanism being installed; a test proves the
  un-installed path refuses rather than silently asserting.
- The bound condition is evaluated from plan state, never from message text.
- Release removes what elevate installed; no residue on terminus.
