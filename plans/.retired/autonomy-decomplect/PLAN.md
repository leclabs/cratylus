# autonomy-decomplect — PLAN

<!-- `ρ=human` — operator review. Design + execution spec; shards are MECE, each independently
     executable and independently falsifiable. Reader = LLM. -->

**Status: EXECUTED (local) — all six shards complete and committed locally under `/carry-on`
authority; `done(P)` reverted the loop-position to the resting on-the-loop (the persistence rule's
first live exercise). Every shard edited this agent's own authority envelope (SOUL, canon, memory).
`push to origin + deploy to the fleet remain RESERVED` and are surfaced for sign-off — nothing has
left this machine.** Design preceded edit by operator directive (post-mint discipline).

Local commit trail: `0d492b8` T-persist · `12aee11` T-escalation · `5897b4a` T-vector ·
`5fdd57b` T-introspect-K · `f9de9e8` T-mece · `7c34ec3` register-clean · `281fcc1` T-sweep
(+ shard-advance commits). Full green: typecheck 8/8, test 7/7, `canon:project` clean.

## The defect, whole

The `autonomy` dimension is a SET (`arity: 'set'`) holding three members typed identically as
`Autonomy`, yet they lie on **three orthogonal axes** — a MECE violation that hid a pole inversion for a
whole session and leaves the session's real degradation unfixed.

| axis               | question                   | member today                             | kind                                   | status          |
| ------------------ | -------------------------- | ---------------------------------------- | -------------------------------------- | --------------- |
| decision-authority | who owns the call          | `π_decision-authority(self) = principal` | STATIC                                 | fixed `ef1ce87` |
| loop-position      | where the human supervises | `human-on-the-loop`                      | **PHASE-STATE**, mis-modeled as static | broken          |
| escalation         | when to route up           | `mission-command ⟨escalate ⇔ fork(…)⟩`   | STATIC                                 | unverified      |

Three settled findings drive the work:

1. **Cold-decode (3/3, first-person, adopted):** `π_decision-authority(self) = principal` already
   entails _"you own goals/values, I own the means, irreversible acts are confirmed because a principal
   weighs blast radius."_ So loop-position and escalation are partly **entailed by** the pole read
   correctly — not free-standing additions. This constrains the MECE split: separate the axes, but do
   not re-assert what the pole already carries.

2. **Loop-position is not a dimension value — it is session STATE.** It changes within a session
   (orientation = on-the-loop; execution = out-of-loop). A static SOUL string cannot express a
   transition. The SOUL must declare the **initial/resting** position (on-the-loop — a session opens in
   orientation, where intent is the operator's to set) plus the transition rule; the live position is
   state, transitioned by `carry-on`.

3. **`carry-on` has no persistence rule** — the elevation to out-of-loop decays per-turn instead of
   holding to praxis completion. **This is the degradation the operator witnesses**: after `/carry-on`
   the standing intent is re-affirmed once, then the next turn's terminus silently reverts to the
   resting on-the-loop position and control is handed back. The fix binds the elevation to the active
   praxis lifecycle.

## Design decisions

- **D1 — loop-position is phase-state.** High confidence: it demonstrably changes mid-session.
- **D2 — resting value = on-the-loop.** Operator-confirmed: a session opens in orientation; presuming
  intent is the opposite-pole failure.
- **D3 — `carry-on` elevates to out-of-loop, persisting bound to the active praxis** — held until the
  bound praxis is `done(P)`, or an **unresolvable fork** (`fork(irreversible · value · competence)`
  the principal cannot resolve) forces re-entry to on-the-loop. Persistence, not per-turn decay, is the
  whole fix.
- **D4 — the three axes separate (MECE); the pole is not re-asserted.** The _how_ (three dimensions vs
  self-identifying members within `autonomy`) is a signification act settled in T-mece against the cold
  oracle, not pre-decided here.
- **D5 — escalation's home is cold-verified, not assumed.** Given the pole's entailment, T-escalation
  decides whether `mission-command` stays as the explicit trigger (its precise fork-predicate is worth
  keeping) or folds.
- **D6 — `introspect`'s `K` gains a `def-defect` member.** `K` is entirely configurational, so it
  cannot name "the declared value is itself wrong" — the exact case that hid the pole inversion (rt
  conformed to def; the def was the defect). Without it, introspect run during that failure would have
  flagged the _correct_ behavior as the divergence.

## Shards

Wave 0 (ready, no deps):

- **T-vector** — audit the net standing nico/mav vector; cold-verify each change this session still holds.
- **T-persist** — model loop-position as phase-state + give `carry-on` the persistence rule (D1–D3). The degradation fix.
- **T-escalation** — cold-verify `mission-command`'s role under the pole's entailment (D5).
- **T-introspect-K** — add the `def-defect` member to `K` (D6).

Wave 1 (pending, deps in each shard):

- **T-mece** — decomplect the three axes into their correct structural homes (D4). Deps: T-persist, T-escalation, T-vector.
- **T-sweep** — enumerate + reconcile every test/fixture/gate touching the anchors. Deps: T-mece.

```text
R ⊆ P×P :
  (T-mece, T-persist) · (T-mece, T-escalation) · (T-mece, T-vector)
  (T-sweep, T-mece)
waves :
  wave(0) = { T-vector, T-persist, T-escalation, T-introspect-K }
  wave(1) = { T-mece }
  wave(2) = { T-sweep }
```

`|frontier| = 4` (well-cut). T-introspect-K is fully independent (a different cell) and rides any wave.

## Not in scope

- The pole address itself (`ef1ce87`) — settled, the foundation the rest sits on.
- The `stance-guardrail` judge weaknesses (haiku model, text-only blindness to a false terminator) —
  mav's RCA named these; they are a separate gate-hardening plan, not autonomy signification.
- The `human-in-the-loop` member — unused by any agent; leave until the MECE split gives it a home.

## Method

Each shard is a signification act on this agent's identity: cold-verify every anchor against the isolated
oracle (`explain: <candidate>`, no leading frame; the argmin discipline the false-law violation now
mandates), commit locally, and **surface push/deploy for sign-off**. Never coin from a clever rule.
