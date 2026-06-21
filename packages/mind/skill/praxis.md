---
kind: skill
name: praxis
delineation: Create and work durable, sharded plans ([[sharded-plan-layout]] dirs) — reached by planning intent, not a command grammar; task state is the folder a task-file sits in (pending/ready/active/completed), PLAN.md mirrors it, and `list` is the one explicit affordance.
trigger: /praxis
---

# praxis

Create and work durable plans, each a [[sharded-plan-layout]] directory; resume from it and work it as normal. Reached by **planning intent**, not a command grammar — state the intent, get the operation; the one explicit affordance is **`/praxis list`** (enumerate the in-scope plans). Each task-file is a [[self-sufficient-task]] (five required clauses, blind-test acceptance the falsifier). `start` cuts the plan into **vertical** slices up front — each end-to-end on one concern along the orthogonal boundary ([[shard-by-orthogonal-concern]]) — so the `frontier(P)` set can [[fan-out-the-frontier]] concurrently; a single-next-step frontier is the smell the slices were never cut independent. A plan's commit association is derived on demand, never stored ([[plan-commit-from-git]]); a plan retires once its result lands ([[plan-retirement]]).

Bindings (cite-once): `state` (the folder a task occupies) + `frontier` realize [[sharded-plan-layout]]; `truth` + the authority order `≽` bind [[doc-mirrors-runtime-truth]]; `dp` (de-palimpsest) binds [[clean-slate]] · [[palimpsest]]; `sync` re-derives only on change ([[emit-only-on-change]]); `slices` + `frontier(P)` bind [[fan-out-the-frontier]], each slice a [[self-sufficient-task]]. The formal block follows [[self-sufficient-formalism]]; symbol table `references/formal-symbolic-notation.md`.

```text
States ≜ { pending, ready, active, completed }
next ≜ { pending ↦ ready, ready ↦ active, active ↦ completed, completed ↦ completed }
intent ≜ the stated goal
P ≜ a plan : a set of task-files
content : P → text
state : P → States
truth : P → States
R ⊆ P × P
blocked(t) ⇔ ∃ u : (t, u) ∈ R ∧ state(u) ≠ completed
slices : P → ℘(℘(P))                              — the vertical concern-slices, precomputed at start
⋃ slices(P) = P                                  — collectively exhaustive
∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅     — mutually exclusive: slices don't collide
frontier(P) ≜ { t | t ∈ P ∧ state(t) = ready }   — the fan-out set, dispatched concurrently
promote(u) ≜ { t | (t, u) ∈ R ∧ state(t) = pending ∧ ¬blocked(t) }
dp : text → text
dp(dp(c)) = dp(c)
mirror : (state, R, content) → document
PLAN.md ≜ mirror(state, R, content)
(state, R, content) ≽ PLAN.md

start     : intent ↦ (P, slices(P))
resume    : P ↦ frontier(P)
advance(t) ≜ state(t) := next(state(t)) ; state(t) = completed ⇒ ∀ d ∈ promote(t) : state(d) := ready
sync       ≜ ∀ t ∈ P : state(t) ≠ truth(t) ⇒ state(t) := truth(t) ; ∀ u ∈ P : ∀ d ∈ promote(u) : state(d) := ready ; PLAN.md ≠ mirror(state, R, content) ⇒ PLAN.md := mirror(state, R, content)
             post : state = truth ∧ PLAN.md = mirror(state, R, content)
update(t)  ≜ content(t) := dp(content(t)) ; PLAN.md := mirror(state, R, content)
merge     : { P₁, P₂, … } ↦ ⋃ Pᵢ
```

Harness (claude-code): each plan session gets a generated name; `list` shows it beside the [[sharded-plan-layout]] dir so a later session re-attaches to the same durable plan. Use `/plan` mode for in-session planning; PLAN.md is the durable mirror that outlives the session.
