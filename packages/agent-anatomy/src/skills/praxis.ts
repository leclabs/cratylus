import type { SkillCell } from '../toolkit/skill-cell.js';

const FORMAL_BLOCK = `# ── declarations: entities ──
intent          ≜ the stated goal
States          ≜ { pending, ready, active, completed }   — task-state is the folder a task-file sits in
P               ≜ a plan : a set of task-files               — sharded-plan-layout: state lives in the folder, not a field
content : P → text                                            — a task-file's spec text
spec    : P → ⟨static, scope, accept⟩                        — execution-spec: the shape content(t) must satisfy
static  : P → ℘(path)                                         — pinned inputs: repo paths that exist at authoring time
inputs(t) ≜ static(t) ∪ { content(u) | (t, u) ∈ R }          — dep-fed inputs = the completed deps' task-files, read at dispatch
accept  : P → (return → 𝔹)                                   — the falsifier: a blind test decidable from the return alone
executor : P ⇀ agent                                          — the subagent a dispatched task runs on
self     ≜ the current session                                — id from the harness (CLAUDE_SESSION_ID)
live     : session → 𝔹                                        — from the memory session-registry (episodic session status): registered ∧ ¬released ∧ ¬stale
owner   : P ⇀ session                                         — the session holding P's active frontier (a plans/<plan>/.owner sidecar); liveness resolved via live()
state   : P → States                                          — recorded state (the folder it occupies)
truth   : P → States                                          — runtime ground-truth state (what actually holds)
R ⊆ P × P                                                     — dependency edges: (t,u) ∈ R ⇔ t depends on u
slices  : P → ℘(℘(P))                                         — vertical concern-slices, precomputed at start
mirror  : (state, R, content) → document                     — derives the agent-readable view; emits R + waves explicitly
PLAN.md ≜ mirror(state, R, content)                          — the durable doc, a derived mirror (never the authority)
dp : text → text                                             — de-palimpsest: strip superseded scar-tissue to net-current
ρ, register : text → {LLM, human}                            — reader binding · observed register (home: signify READER BINDING)
conform(a) ⇔ register(a) = ρ(a)                              — the register law every praxis artifact satisfies

# ── declarations: derived sets ──
blocked(t)  ⇔ ∃ u : (t, u) ∈ R ∧ state(u) ≠ completed
occupied(P) ⇔ owner(P) defined ∧ owner(P) ≠ self ∧ live(owner(P))   — a LIVE OTHER session holds P's active frontier
frontier(P) ≜ { t | t ∈ P ∧ state(t) = ready }              — the fan-out set: ready tasks, dispatched concurrently
promote(u)  ≜ { t | (t, u) ∈ R ∧ state(t) = pending ∧ ¬blocked(t) }   — deps freed by u completing
next        ≜ { pending ↦ ready, ready ↦ active, active ↦ completed, completed ↦ completed }
W(n)        ≜ ⋃ { wave(i) | i <= n }                          — strata seen so far
wave(0)     ≜ { t | ∄ u : (t, u) ∈ R }                       — the root stratum
wave(n+1)   ≜ { t | t ∉ W(n) ∧ ∀ u : (t, u) ∈ R ⇒ u ∈ W(n) }  — topo strata
waves       ≜ (wave(0), wave(1), …)                          — the dispatch schedule

# ── laws ──
# self-sufficient-task / execution-spec: each task-file is a complete execution spec — blind-dispatchable:
# runnable detached, no plan prose needed; blind-test acceptance the falsifier.
∀ t : content(t) ⊨ spec(t)
∀ t : ∀ p ∈ static(t) : p exists at authoring                — pin what exists; a dep-fed input is marked, never pinned
∀ t : ∃ r : ¬accept(t)(r)                                    — falsifiability: an acceptance no return can fail is not one
# shard-by-orthogonal-concern: slices are cut along orthogonal boundaries, each end-to-end on one concern.
⋃ slices(P) = P                                              — collectively exhaustive (slices cover the plan)
∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅                — mutually exclusive (slices don't collide)
# maximize-fan-out: among admissible MECE cuts, take the one with fewest cross-slice deps — the widest waves.
slices(P) = argmin over admissible cuts of |R ∩ ⋃ { sᵢ × sⱼ | i ≠ j }|
|frontier(P)| = 1 ⇒ slices mis-cut                          — fan-out-the-frontier: a single-next-step frontier is the smell
# judge-not-author: a rejected return goes back to its executor with the failed criterion; the judge never hand-fixes.
# doc-mirrors-runtime-truth: the runtime state, not the doc, is authoritative.
(state, R, content) ≽ PLAN.md                               — authority order: PLAN.md is downstream, never the source
# clean-slate / anti-palimpsest: dp is idempotent — net-current carries no edit-history scar.
dp(dp(c)) = dp(c)
# plan-retirement: a plan retires once its result lands; commit association is derived on demand, never stored.
# plan-agents-md-is-memory: a plan's AGENTS.md is the semantic memory SINK at plan scope — part of the
# memory system, not the plan system: dream routes plan-scoped items there (open threads · next-steps ·
# plan-durable facts), reconciled as consolidation (dedup · net-current · move-not-copy); wake's orient reads it.
# session-isolation (memory-session-isolation): dispatch stamps owner(P) := self; occupied(P) ⇒ wake's orient
# REPORTS P, never binds it (a live sibling's active frontier is not this session's to resume). No explicit
# clear — a completed/stale owner makes occupied(P) false (P inheritable, cross-/clear resume preserved), and
# the next dispatch refreshes the stamp. Owner-liveness is the memory registry's, not a plan field.
# reader-llm-default: every praxis artifact is agent-read — ρ = LLM standing law, never per-turn discretion.
∀ t : ρ(content(t)) = LLM ∧ conform(content(t))              — the task-file IS the dispatch prompt (blind-dispatchable)
ρ(PLAN.md) = LLM ∧ conform(PLAN.md)                          — the mirror is agent-read: dense, signifier-carries-load
∀ t, r : ρ(r) = LLM ∧ (¬conform(r) ⇒ ¬accept(t)(r))          — a human-register subagent return fails judge as a criterion

# ── operations ──
start     : intent ↦ (P, slices(P), waves)                  — cut into vertical slices + emit the dispatch schedule up front
resume    : P ↦ frontier(P)                                 — re-attach and surface the fan-out set
dispatch   ≜ ∀ t ∈ frontier(P) concurrently : state(t) := active ∧ owner(P) := self ∧ executor(t) runs content(t)   — dispatch stamps ownership; the frontier IS the dispatch set
judge(t, r) ≜ accept(t)(r) ⇒ advance(t) ; ¬accept(t)(r) ⇒ r rejected back to executor(t), state(t) stays active
advance(t) ≜ state(t) := next(state(t)) ; state(t) = completed ⇒ ∀ d ∈ promote(t) : state(d) := ready
update(t)  ≜ content(t) := dp(content(t)) ; PLAN.md := mirror(state, R, content)
merge     : { P₁, P₂, … } ↦ ⋃ Pᵢ
# sync: reconcile to truth, re-promote, re-mirror — emit-only-on-change: rewrite each only if it differs.
sync       ≜ ∀ t ∈ P : state(t) ≠ truth(t) ⇒ state(t) := truth(t) ;
             ∀ u ∈ P : ∀ d ∈ promote(u) : state(d) := ready ;
             PLAN.md ≠ mirror(state, R, content) ⇒ PLAN.md := mirror(state, R, content)
             post : state = truth ∧ PLAN.md = mirror(state, R, content)`;

export const praxis: SkillCell = {
  name: 'praxis',
  trigger: `/praxis`,
  delineation: `Create and work durable, sharded plans (sharded-plan-layout dirs) — reached by planning intent, not a command grammar; task state is the folder a task-file sits in (pending/ready/active/completed), each task-file a blind-dispatchable execution spec, the plan an explicit topo-DAG of frontier waves, PLAN.md mirrors it, and \`list\` is the one explicit affordance.`,
  verb: `praxis`,
  formalBlock: FORMAL_BLOCK,
  composition: [],
  body: `

# praxis

Create and work durable plans, each a **sharded-plan-layout** directory; resume from it and work it as normal. Reached by **planning intent**, not a command grammar — state the intent, get the operation; the one explicit affordance is **\`/praxis list\`** (enumerate the in-scope plans).

The formal block below stands alone: every term it uses is declared in it. Declarations name the entities; laws state the invariants; operations are the verbs.

\`\`\`text
${FORMAL_BLOCK}
\`\`\`

**Authoring notation** — in a task-file's \`Inputs\`, a static input is a pinned repo path (must exist when the task is written); a dep-fed input is marked \`⊳dep\` and resolves to the dep's completed task-file at dispatch. \`Acceptance\` states the falsifier — the blind test a return can fail; "done"/"codified" without a failing case is not an acceptance.

**Fan-out mapping** — dispatch(frontier) is the concurrent fan-out stage; judge is the acceptance gate (reject-and-return with the failed criterion, never hand-fix); promote opens the next wave. A plan maps 1:1 onto a Workflow — fan-out frontier → judge → promote — with the plan lead as judge.

**Delegation register** — dispatch and return are agent↔agent artifacts: the dispatch prompt is the task-file (ρ=LLM by the standing law above), and an executor's return is authored at register=LLM — dense, structured, signifier-carries-load; a human-register return is a failed acceptance criterion, rejected back to its executor, never repaired by the judge.

**Session ownership** — \`dispatch\` stamps \`owner(P)\` (a \`plans/<plan>/.owner\` sidecar holding the dispatching session id) so a concurrent sibling knows P's active frontier is spoken for. Occupancy is liveness-gated, not a lock: \`occupied(P) ⇔ owner(P)\` is a **live other** session (\`episodic session status <owner>\` = live ∧ ≠ self). A completed or stale owner leaves P inheritable — wake's orient resumes it (cross-\`/clear\` handoff of a plan preserved); a live owner makes orient report-not-bind. The sidecar is refreshed on each dispatch and never needs explicit clearing — the memory registry is the ownership-liveness authority.

Harness (claude-code): each plan session gets a generated name; \`list\` shows it beside the **sharded-plan-layout** dir so a later session re-attaches to the same durable plan. Use \`/plan\` mode for in-session planning; PLAN.md is the durable mirror that outlives the session.
`,
};
