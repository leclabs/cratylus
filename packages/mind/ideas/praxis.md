---
kind: skill
delineation: Create and work durable, sharded plans (sharded-plan-layout dirs) — reached by planning intent, not a command grammar; task state is the folder a task-file sits in (pending/ready/active/completed), PLAN.md mirrors it, and `list` is the one explicit affordance.
trigger: /praxis
---

# /praxis — durable sharded plans

A skill for creating and working **durable, sharded plans** on disk. An agent reaches it by planning intent — "start a plan for X", "pick the auth plan back up", "fold these plans together" — not by memorizing a command set. Each plan is a [[sharded-plan-layout]] directory; the agent resumes from it and works it as it normally would.

praxis ≜ invokes [[sharded-plan-layout]] · binds [[clean-slate]] · [[palimpsest]] · [[doc-mirrors-runtime-truth]]

## What it helps with

Surfaced by intent, not commands — state what you want and the skill does the matching plan-operation:

- **start a plan** — scaffold a fresh [[sharded-plan-layout]] dir from the stated intent.
- **resume a plan** — re-attach to an existing plan and draw from the ready frontier.
- **advance a task** — the `mv` of [[sharded-plan-layout]]; you *assert* one decided transition (push the truth forward), then promote the now-unblocked dependents and re-mirror PLAN.md.
- **sync a plan** — bring the record into agreement with reality: the agent did work, but its tasks may not be `mv`'d and PLAN.md not re-mirrored yet. *Observe* real progress (don't assert it), advance the genuinely-done tasks, promote the now-unblocked dependents, and re-mirror PLAN.md ([[doc-mirrors-runtime-truth]] — the runtime wins, the record is corrected). Idempotent: already-current ⇒ no-op ([[emit-only-on-change]]).
- **update a plan** — revise a task's (or the plan's) content in place, **depalimpsested** ([[clean-slate]]): rewrite to the clean current state and strip the superseded strata, never accreting a "previously / now / amended-by" [[palimpsest]]. The `dp` operator in the model below is that strip; re-mirror PLAN.md after.
- **merge plans** — fold several in-scope plans into one.

The one explicit affordance is **`/praxis list`** — enumerate the sharded plans in scope so you (or the agent) can see what exists and pick one up. Everything else is best reached by stating the intent.

## The operations, formally

State is the folder a task sits in; `truth` is the real-world state it should mirror — **sync** enforces `state = truth` (binds [[doc-mirrors-runtime-truth]]); `R` is the prestructured dependency relation; `dp` is the de-palimpsest strip that **update** applies (binds [[clean-slate]] · [[palimpsest]]):

```text
States ≜ pending → ready → active → completed

P ≜ a plan, a set of task-files
state : P → States                                   the recorded state — where a task-file sits
truth : P → States                                   the real-world state — work actually done
R ⊆ P × P            (t, u) ∈ R ⇔ t blocked until u completed

frontier(P) ≜ { t │ t ∈ P ∧ state(t) = ready }       the open frontier = ls tasks/ready/
PLAN.md ≜ mirror(state, R)                            derived, never authoritative

start  : intent ↦ P                                  scaffold a fresh sharded-plan-layout
resume : P ↦ frontier(P)                             re-attach, draw the ready frontier
advance: state(t) := next(state(t))                  assert one transition (the mv)
         state(u) = completed ⇒ ∀ t ∈ promote(u) : state(t) := ready
sync   : ∀ t ∈ P : state(t) := truth(t) , then promote, then PLAN.md := mirror(state, R)
         post: state = truth ∧ PLAN.md current        the record catches up to reality
merge  : { P₁, P₂, … } ↦ ⋃ Pᵢ                        fold in-scope plans into one

promote(u) ≜ { t │ (t, u) ∈ R ∧ state(t) = pending ∧ ∀ x : (t, x) ∈ R ⇒ state(x) = completed }

dp ≜ de-palimpsest
update : P → P ,  content(update(t)) = dp(content(t))    revise to clean current-state
dp(dp(c)) = dp(c)                                        idempotent — no stratum survives twice
```

## Which commit last touched a plan — ask git, never store it

Don't keep a commit hash in the plan: a file cannot contain its own commit's hash, so a stored marker is stale the instant it's written. The association is a **query over git**, the real history:

- last commit that updated a plan — `git log -1 --format='%H %cI' -- {plansDirectory}/{plan}/`
- last commit that touched one task — same, scoped to the task file, with `--follow` so it tracks the file across its ready→active→completed moves.

git history is the runtime truth; the plan's commit association is _derived on demand_, never a mirror that can drift ([[doc-mirrors-runtime-truth]]). If a fast local lookup is ever wanted, cache it **out of the versioned tree** (a gitignored sidecar written by a post-commit hook) — a regenerable cache, never committed, never authoritative. To mark a deliberate milestone (not just "last touched"), tag or `git notes` the commit _after_ it exists — which sidesteps the chicken-and-egg entirely.

## Harness: claude-code

claude-code assigns each plan session a generated name; `list` can show it beside the sharded-plan dir so a later session re-attaches to the same durable plan. Use the built-in `/plan` mode for in-session planning; PLAN.md is the durable mirror that outlives the session.

## See also

- [[sharded-plan-layout]] — the directory structure praxis manages.
- [[shard-by-orthogonal-concern]] — why a plan decomposes into independent units.
- [[clean-slate]] — the disposition **update** enacts: strip the palimpsest to net-green.
- [[doc-mirrors-runtime-truth]] — the principle **sync** enforces: the runtime wins, the record is corrected.
