import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
// The plan-layout state canon (one home) — the `States` set below derives from it;
// a project template sources its `planStates` from the same home (DRY). Lives in a
// sibling module, not exported here: a skill module has exactly ONE export (its Skill).
import { PLAN_STATES } from '../toolkit/plan-states.js';

const FORMAL_BLOCK = `-- ── declarations: entities ──
intent          ≜ the stated goal
States          ≜ { ${PLAN_STATES.join(', ')} }   — task-state is the folder a task-file sits in
P               ≜ a plan : a set of task-files
content : P → text                                            — a task-file's spec text
spec    : P → ⟨static, scope, accept⟩                        — execution-spec: the shape content(t) must satisfy
static  : P → ℘(path)                                         — pinned inputs: repo paths that exist at authoring time
inputs(t) ≜ static(t) ∪ { content(u) | (t, u) ∈ R }
accept  : P → (return → 𝔹)                                   — the falsifier: a blind test decidable from the return alone
census  : intent → ⟨scope, static, deps⟩                     — the grounding READ of the tree (paths · code · deps) a spec's shape derives from ; delegable to a subagent
executor : P ⇀ agent                                          — the subagent a dispatched task runs on
self     : session                                            — the current session; id from the harness (CLAUDE_SESSION_ID)
live     : session → 𝔹                                        — from the memory session-registry (memory session status): registered ∧ ¬released ∧ ¬stale
owner   : P ⇀ session                                         — the session holding P's active frontier (a plans/<plan>/.owner sidecar); liveness resolved via live()
state   : P → States                                          — recorded state (the folder it occupies)
truth   : P → States                                          — runtime ground-truth state (what actually holds)
R ⊆ P × P
slices  : P → ℘(℘(P))                                         — vertical concern-slices, precomputed at start
mirror  : (state, R, content) → document                     — derives the agent-readable view; emits R + waves explicitly
PLAN.md ≜ mirror(state, R, content)
dp : text → text                                             — de-palimpsest: strip superseded scar-tissue to net-current
ρ, register : text → {LLM, human}                            — reader binding · observed register (home: signify READER BINDING)
conform(a) ⇔ register(a) = ρ(a)
Phase    ≜ { proposed, in-flight, landed, retired }          — a plan's lifecycle phase (plan-level; distinct from States)
Plans    ≜ { P | P a plan on disk }                          — the plan-set : in-scope ∪ archived
commit   ≜ a VCS commit
commits  : P → ℘(commit)                                     — the commits in P's VCS history
lands    : commit × P → 𝔹                                    — c is the trunk merge of P's result
landing  : P ⇀ commit                                        — P's landing-commit, computed from VCS on demand
stored   : P → ℘(commit)                                     — commit refs P persists on disk (sidecar · PLAN.md · content)
archived : P → 𝔹                                             — P's dir resides under plans/.retired/ (folder-as-state)
phase    : P → Phase                                         — runtime plan-phase, derived (no stored field)

-- ── declarations: derived sets ──
blocked(t)  ⇔ ∃ u : (t, u) ∈ R ∧ state(u) ≠ completed
occupied(P) ⇔ owner(P) defined ∧ owner(P) ≠ self ∧ live(owner(P))
frontier(P) ≜ { t | t ∈ P ∧ state(t) = ready }
promote(u)  ≜ { t | (t, u) ∈ R ∧ state(t) = pending ∧ ¬blocked(t) }
next        ≜ { pending ↦ ready, ready ↦ active, active ↦ completed, completed ↦ completed }
W(n)        ≜ ⋃ { wave(i) | i <= n }
wave(0)     ≜ { t | ∄ u : (t, u) ∈ R }
wave(n+1)   ≜ { t | t ∉ W(n) ∧ ∀ u : (t, u) ∈ R ⇒ u ∈ W(n) }
waves       ≜ (wave(0), wave(1), …)
dispatched(P) ⇔ ∃ t ∈ P : state(t) ∈ { active, completed }
done(P)       ⇔ ∀ t ∈ P : state(t) = completed
landed(P)     ⇔ landing(P) defined ∧ ¬ archived(P)
inscope(P)    ⇔ ¬ archived(P)
nextPhase     ≜ { proposed ↦ in-flight, in-flight ↦ landed, landed ↦ retired, retired ↦ retired }

-- ── laws ──
∀ t : content(t) ⊨ spec(t)
∀ t : ∀ p ∈ static(t) : p exists at authoring
∀ t : ∃ r : ¬accept(t)(r)
∀ t : content(t) grounded-by census(intent(t))
∀ t : ¬(content(t) grounded-by census(intent(t))) ⇒ ¬(content(t) ⊨ spec(t))
⋃ slices(P) = P
∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅
slices(P) = argmin over admissible cuts of |R ∩ ⋃ { sᵢ × sⱼ | i ≠ j }|
|frontier(P)| = 1 ⇒ slices mis-cut
(state, R, content) ≽ PLAN.md                               — authority order: PLAN.md is downstream, never the source
dp(dp(c)) = dp(c)
archived(P)                              ⇒ phase(P) = retired
landed(P)                                ⇒ phase(P) = landed
dispatched(P) ∧ ¬ landed(P) ∧ ¬ archived(P) ⇒ phase(P) = in-flight
¬ dispatched(P) ∧ ¬ archived(P)          ⇒ phase(P) = proposed
landing(P) = c ⇔ lands(c, P)
∀ c, c' : lands(c, P) ∧ lands(c', P) ⇒ c = c'
∀ P : stored(P) = ∅
list = { P ∈ Plans | inscope(P) }
retire(P) defined ⇔ landed(P)
∀ P : content(retire(P)) = content(P)
∀ P : retire(P) ∈ Plans
∀ t : ρ(content(t)) = LLM ∧ conform(content(t))
ρ(PLAN.md) = LLM ∧ conform(PLAN.md)
∀ t, r : ρ(r) = LLM ∧ (¬conform(r) ⇒ ¬accept(t)(r))

-- ── operations ──
start     : intent ↦ (P, slices(P), waves)                  — cut into vertical slices + emit the dispatch schedule up front
upsert    : (P, intent) ↦ P' ≜ author census-grounded t(s) ∧ P' = P ∪ {t} ∧ re-slice ∧ re-mirror
list      : ↦ ℘(P)                                          — enumerate the in-scope plans (the one explicit /praxis command affordance)
resume    : P ↦ frontier(P)                                 — re-attach and surface the fan-out set
dispatch   ≜ ∀ t ∈ frontier(P) concurrently : state(t) := active ∧ owner(P) := self ∧ executor(t) runs content(t)
dispatch(P) ⇒ ¬occupied(P)
judge(t, r) ≜ accept(t)(r) ⇒ advance(t) ; ¬accept(t)(r) ⇒ r rejected back to executor(t), state(t) stays active
advance(t) ≜ state(t) := next(state(t)) ; state(t) = completed ⇒ ∀ d ∈ promote(t) : state(d) := ready
update(t)  ≜ content(t) := dp(content(t)) ; PLAN.md := mirror(state, R, content)
merge     : { P₁, P₂, … } ↦ ⋃ Pᵢ
sync       ≜ ∀ t ∈ P : state(t) ≠ truth(t) ⇒ state(t) := truth(t) ;
             ∀ u ∈ P : ∀ d ∈ promote(u) : state(d) := ready ;
             PLAN.md ≠ mirror(state, R, content) ⇒ PLAN.md := mirror(state, R, content)
             post : state = truth ∧ PLAN.md = mirror(state, R, content)
retire    : P ↦ P' ≜ relocate dir(P) under plans/.retired/ ; pre landed(P) ; post phase(P) = retired ∧ content(P') = content(P)
landingOf : P ↦ landing(P)                                   — recompute from VCS each call ; write nothing` as SkillExpression;

export const praxis: Skill = {
  name: 'praxis',
  description: `use this skill to create a plan decomposed into MECE execution shards, where each shard is a self-contained task execution specification with objective, inputs, constraints, dependencies, outputs, and completion criteria.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
};
