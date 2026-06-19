---
kind: skill
delineation: Create and work durable, sharded plans (sharded-plan-layout dirs) — reached by planning intent, not a command grammar; task state is the folder a task-file sits in (pending/ready/active/completed), PLAN.md mirrors it, and `list` is the one explicit affordance.
trigger: /praxis
---

# /praxis — durable sharded plans

Each plan is a [[sharded-plan-layout]] directory; resume from it and work it as normal. State the intent, get the operation — the precise spec is the formal block:

- **start** — scaffold a fresh plan from an intent.
- **resume** — re-attach and draw the ready frontier.
- **advance** — _assert_ one task's transition (push the truth forward).
- **sync** — _observe_ real progress and reconcile the record to reality.
- **update** — revise a task's content, depalimpsested.
- **merge** — fold several in-scope plans into one.

The one explicit affordance is **`/praxis list`** — enumerate the sharded plans in scope.

## The operations, formally

Bindings: the four states, `state` (the folder a task occupies), and `frontier` (the `ls tasks/ready/` frontier) realize [[sharded-plan-layout]]; `truth` (the runtime state) and the authority order `≽` bind [[doc-mirrors-runtime-truth]]; `dp` (de-palimpsest) binds [[clean-slate]] · [[palimpsest]]; `sync` re-derives only on change ([[emit-only-on-change]]). The symbol table is `references/formal-symbolic-notation.md`.

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
frontier(P) ≜ { t | t ∈ P ∧ state(t) = ready }
promote(u) ≜ { t | (t, u) ∈ R ∧ state(t) = pending ∧ ¬blocked(t) }
dp : text → text
dp(dp(c)) = dp(c)
mirror : (state, R, content) → document
PLAN.md ≜ mirror(state, R, content)
(state, R, content) ≽ PLAN.md

start     : intent ↦ P
resume    : P ↦ frontier(P)
advance(t) ≜ state(t) := next(state(t)) ; state(t) = completed ⇒ ∀ d ∈ promote(t) : state(d) := ready
sync       ≜ ∀ t ∈ P : state(t) ≠ truth(t) ⇒ state(t) := truth(t) ; ∀ u ∈ P : ∀ d ∈ promote(u) : state(d) := ready ; PLAN.md ≠ mirror(state, R, content) ⇒ PLAN.md := mirror(state, R, content)
             post : state = truth ∧ PLAN.md = mirror(state, R, content)
update(t)  ≜ content(t) := dp(content(t)) ; PLAN.md := mirror(state, R, content)
merge     : { P₁, P₂, … } ↦ ⋃ Pᵢ
```

## Which commit last touched a plan — ask git, never store it

A plan's commit association is _derived on demand_ from git, never a stored marker that can drift ([[doc-mirrors-runtime-truth]]):

- last commit that updated a plan — `git log -1 --format='%H %cI' -- {plansDirectory}/{plan}/`
- last commit that touched one task — same, scoped to the task file, with `--follow` so it tracks the file across its ready→active→completed moves.

If a fast local lookup is wanted, cache it **out of the versioned tree** (a gitignored sidecar from a post-commit hook) — regenerable, never authoritative. To mark a deliberate milestone, tag or `git notes` the commit _after_ it exists.

## Harness: claude-code

claude-code assigns each plan session a generated name; `list` can show it beside the sharded-plan dir so a later session re-attaches to the same durable plan. Use the built-in `/plan` mode for in-session planning; PLAN.md is the durable mirror that outlives the session.

## See also

- [[shard-by-orthogonal-concern]] — why a plan decomposes into independent units.
- [[self-sufficient-formalism]] — the convention the formal block above follows.
- [[plan-retirement]] — a plan is a transient scaffold that retires once its result lands; the **standing plan** is the one exception that never does.
