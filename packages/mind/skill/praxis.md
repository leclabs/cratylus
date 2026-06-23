---
kind: skill
name: praxis
delineation: Create and work durable, sharded plans (sharded-plan-layout dirs) — reached by planning intent, not a command grammar; task state is the folder a task-file sits in (pending/ready/active/completed), PLAN.md mirrors it, and `list` is the one explicit affordance.
trigger: /praxis
---

# praxis

Create and work durable plans, each a **sharded-plan-layout** directory; resume from it and work it as normal. Reached by **planning intent**, not a command grammar — state the intent, get the operation; the one explicit affordance is **`/praxis list`** (enumerate the in-scope plans).

The formal block below stands alone: every term it uses is declared in it. Declarations name the entities; laws state the invariants; operations are the verbs.

```text
# ── declarations: entities ──
intent          ≜ the stated goal
States          ≜ { pending, ready, active, completed }   — task-state is the folder a task-file sits in
P               ≜ a plan : a set of task-files               — sharded-plan-layout: state lives in the folder, not a field
content : P → text                                            — a task-file's spec text
state   : P → States                                          — recorded state (the folder it occupies)
truth   : P → States                                          — runtime ground-truth state (what actually holds)
R ⊆ P × P                                                     — dependency edges: (t,u) ∈ R ⇔ t depends on u
slices  : P → ℘(℘(P))                                         — vertical concern-slices, precomputed at start
mirror  : (state, R, content) → document                     — derives the human-readable view
PLAN.md ≜ mirror(state, R, content)                          — the durable doc, a derived mirror (never the authority)
dp : text → text                                             — de-palimpsest: strip superseded scar-tissue to net-current

# ── declarations: derived sets ──
blocked(t)  ⇔ ∃ u : (t, u) ∈ R ∧ state(u) ≠ completed
frontier(P) ≜ { t | t ∈ P ∧ state(t) = ready }              — the fan-out set: ready tasks, dispatched concurrently
promote(u)  ≜ { t | (t, u) ∈ R ∧ state(t) = pending ∧ ¬blocked(t) }   — deps freed by u completing
next        ≜ { pending ↦ ready, ready ↦ active, active ↦ completed, completed ↦ completed }

# ── laws ──
# self-sufficient-task: each task-file is a complete spec — runnable detached, blind-test acceptance the falsifier.
# shard-by-orthogonal-concern: slices are cut along orthogonal boundaries, each end-to-end on one concern.
⋃ slices(P) = P                                              — collectively exhaustive (slices cover the plan)
∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅                — mutually exclusive (slices don't collide)
|frontier(P)| = 1 ⇒ slices mis-cut                          — fan-out-the-frontier: a single-next-step frontier is the smell
# doc-mirrors-runtime-truth: the runtime state, not the doc, is authoritative.
(state, R, content) ≽ PLAN.md                               — authority order: PLAN.md is downstream, never the source
# clean-slate / anti-palimpsest: dp is idempotent — net-current carries no edit-history scar.
dp(dp(c)) = dp(c)
# plan-retirement: a plan retires once its result lands; commit association is derived on demand, never stored.

# ── operations ──
start     : intent ↦ (P, slices(P))                         — cut the plan into vertical slices up front
resume    : P ↦ frontier(P)                                 — re-attach and surface the fan-out set
advance(t) ≜ state(t) := next(state(t)) ; state(t) = completed ⇒ ∀ d ∈ promote(t) : state(d) := ready
update(t)  ≜ content(t) := dp(content(t)) ; PLAN.md := mirror(state, R, content)
merge     : { P₁, P₂, … } ↦ ⋃ Pᵢ
# sync: reconcile to truth, re-promote, re-mirror — emit-only-on-change: rewrite each only if it differs.
sync       ≜ ∀ t ∈ P : state(t) ≠ truth(t) ⇒ state(t) := truth(t) ;
             ∀ u ∈ P : ∀ d ∈ promote(u) : state(d) := ready ;
             PLAN.md ≠ mirror(state, R, content) ⇒ PLAN.md := mirror(state, R, content)
             post : state = truth ∧ PLAN.md = mirror(state, R, content)
```

Harness (claude-code): each plan session gets a generated name; `list` shows it beside the **sharded-plan-layout** dir so a later session re-attaches to the same durable plan. Use `/plan` mode for in-session planning; PLAN.md is the durable mirror that outlives the session.
