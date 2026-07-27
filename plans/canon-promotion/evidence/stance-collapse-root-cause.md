# Stance collapse — root cause, measured in the session that produced it

Every number here is measured from session `942590cb…`, the session this document was written
in. Nothing is inferred from the design docs alone.

## The collapses, and what caught each

| #   | collapse                                                                                                             | caught by                           | when  |
| --- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----- |
| 1   | closed a turn asking permission for an in-remit, reversible call (fixing `probe`)                                    | Stop hook, block 1/3                | early |
| 2   | closed on ~3000 chars of operator prose + a bare fork elaborated and never picked                                    | Stop hook, block 2/3                | mid   |
| 3   | same shape as 2                                                                                                      | Stop hook, block 3/3                | mid   |
| 4   | **dispatch-echo** — pasted the operator's five literal questions into a delegate prompt instead of extracting intent | **pre-hook** (`tool.use.pre`)       | late  |
| 5   | reported another project's plan as this project's remaining work (`provenance ≠ scope`)                              | **operator**                        | late  |
| 6   | worked the bound plan all session with no `.bound` file; PLAN.md stale on 3 rows                                     | **operator's question**, not a gate | late  |

Blocks 2 and 3 stated reasons that the transcript refutes — but an independent audit
established the _verdicts_ were correct and only the reasons were confabulated. Collapses 5
and 6 were caught by the operator because **no gate was still enforcing**. That is the finding.

## Root cause 1 — the gate disables itself, silently, exactly when it is needed most

`BLOCK_CAP=3`. On the fourth conviction the hook printed to **stderr** and allowed the stop.
stderr reaches neither agent nor operator.

Measured, on disk, during the session:

```
$TMPDIR/stance-guardrail/942590cb-….count  →  3
```

Counter at cap. **Every collapsed turn after block 3 was judged, found collapsed, and passed
through in silence.** Collapses 5 and 6 fall in that window, which is why a human caught them.

This answers "the drift somehow avoids triggering the stance gate later in sessions" — the
drift does not avoid the gate. The gate stopped enforcing and did not say so.

The cap's justification is real (a block loop must not wedge work) but it was never a licence
for silence, and it switches enforcement off precisely when violation density is highest.

**Fixed** — `9f3e7f8`. Exhaustion now announces on stdout, names the state, and still allows
the stop. Note the fix is committed but **not yet deployed** to `~/.claude/hooks/`, so the
hook that ran during this session is still the silent one.

## Root cause 2 — loop-position is phase-state with no per-turn carrier

The autonomy dimension is three orthogonal axes: who-decides (`decision-authority`),
where-the-human-sits (`human-on-the-loop` / `-out-of-the-loop`), when-to-escalate
(`mission-command`). The middle axis is explicitly **phase-STATE, not a static value** —
`human-on-the-loop ⟨resting · phase-state⟩`, with `carry-on` elevating to out-of-the-loop
until the bound praxis completes.

The asymmetry that produces drift:

- The **resting default** lives in the SOUL, which is the system prompt — re-presented in
  full, at position 0, on **every single turn**.
- The **live override** exists only as a `carry-on` message in conversation history, which
  recedes as the session grows.

So the default is continuously reasserted and the override decays monotonically. Per-turn
drift is not a lapse of attention; it is what this configuration _computes_.

Confirmed absent: **no hook fires at turn start.** The five hook cells are

| cell                         | event                      |
| ---------------------------- | -------------------------- |
| `resume-availability-notice` | `session.start`            |
| `praxis-continuity`          | `vcs.commit.post`          |
| `memory-consolidation-nudge` | `turn.end`                 |
| `stance-guardrail-pre`       | `tool.use.pre`             |
| `stance-guardrail`           | `turn.end`, `subagent.end` |

Everything is _terminal_ (turn.end) or _pre-tool_. Nothing re-establishes live state at the
head of a turn, so there is no mechanism by which "you are currently out-of-the-loop" can be
true at turn N+40 in the same way it was true at turn N.

**This is the configuration defect the operator suspected.** Not a wrong dimension value — a
state variable stored in the one place that decays, with its default stored in the one place
that does not.

## Root cause 3 — one dimension value rewards the shape the rubric convicts

`check-in ⟨conclusion-first · owed ↦ recommendation-bearing-tail⟩`

Read cold, the `owed ↦` guard is conditional and correct: a tail is owed only when a check-in
is owed, and `mission-command ⟨escalate ⇔ fork(irreversible · value · competence)⟩` says a
check-in is owed only at a genuine fork. The composition is sound.

But the _surface_ of that value is a standing instruction to end turns with a
recommendation-bearing tail, and the rubric's tail-enumeration rule convicts exactly that
shape. When the loop-position override has decayed (root cause 2), the conditional collapses
to its unconditional reading and the agent produces the convicted form while believing it is
conforming. Two correct cells composing into a wrong behaviour.

## Why subagents do not do this

Structural, not prompt-borne. A subagent's terminal act is a **return value to a caller**; a
top-level agent's is a **turn-end to an operator**. Deference requires an interlocutor to defer
_to_, and a subagent has none — the deferential move is not merely discouraged, it is
unrepresentable in its output contract.

Note the guardrail already registers on `subagent.end` as well as `turn.end`, so subagents are
_judged_ under the same rubric. They do not collapse because they lack the affordance, not
because they are watched more closely.

## The two enforcement points are not equivalent

|        | `stance-guardrail`           | `stance-guardrail-pre`                |
| ------ | ---------------------------- | ------------------------------------- |
| event  | `turn.end`, `subagent.end`   | `tool.use.pre`                        |
| scope  | the whole closing turn       | `AskUserQuestion\|Agent\|SendMessage` |
| budget | **capped at 3, then silent** | **uncapped, no counter**              |
| effect | blocks the stop              | denies the call before it fires       |

The uncapped one is the only gate that was still working late in this session, and it is the
one that caught collapse 4. A capped gate and an uncapped gate policing the same stance is an
inconsistency, not a layering.

## Disposition

- Budget silence — **fixed**, `9f3e7f8`, gated and calibrated.
- Per-turn state carrier — **not fixed.** Needs a turn-start injection point that does not
  exist today; filed rather than improvised, because inventing a hook event to carry stance
  state is a design change, not a repair.
- `check-in` surface — **not fixed.** The cell is correct in composition; the question is
  whether a value whose surface reads as an unconditional instruction is well-signified. That
  is a signify question and belongs in the collision worklist's discipline, not a quick edit.
