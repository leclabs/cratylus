import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
// The plan-layout state canon (one home) — the `States` set below derives from it;
// a project template sources its `planStates` from the same home (DRY). Lives in a
// sibling module, not exported here: a skill module has exactly ONE export (its Skill).
import { PLAN_STATES } from '../../toolkit/plan-states.js';

const FORMAL_BLOCK = `intent          ≜ the stated goal
States          ≜ { ${PLAN_STATES.join(', ')} }
P               ≜ a plan : a set of task-files
content : P → text
spec    : P → ⟨static, scope, accept⟩
static  : P → ℘(path)
inputs(t) ≜ static(t) ∪ { content(u) | (t, u) ∈ R }
accept  : P → (return → 𝔹)
census  : intent → ⟨scope, static, deps⟩
executor : P ⇀ agent
self     ≜ session⟨CLAUDE_SESSION_ID⟩
registered, released, stale : session → 𝔹
live     : session → 𝔹
owner   : P ⇀ session
dir     : P → path
state   : P → States
truth   : P → States
R ⊆ P × P
slices  : P → ℘(℘(P))
mirror  : (state, R, content) → document
PLAN.md ≜ mirror(state, R, content)
depalimpsest(c) ≜ c ↾ live-strata
ρ, register : text → {LLM, human}
conform(a) ⇔ register(a) = ρ(a)
Phase    ≜ { proposed, in-flight, landed, retired }
Plans    ≜ { P | P a plan on disk }
commit   ≜ a VCS commit
commits  : P → ℘(commit)
lands    : commit × P → 𝔹
landing  : P ⇀ commit
stored   : P → ℘(commit)
archived : P → 𝔹
phase    : P → Phase

blocked(t)  ⇔ ∃ u : (t, u) ∈ R ∧ state(u) ≠ completed
live(s)     ⇔ registered(s) ∧ ¬ released(s) ∧ ¬ stale(s)
occupied(P) ⇔ owner(P) defined ∧ owner(P) ≠ self ∧ live(owner(P))
archived(P) ⇔ dir(P) @ plans/.retired/
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

∀ t ∈ P : t @ dir(P)/state(t)
owner(P) @ dir(P)/.owner
registered, released, stale @ memory-session-registry
∀ t : content(t) ⊨ spec(t)
∀ t : ∀ p ∈ static(t) : p exists at authoring
∀ t : ∃ r : ¬accept(t)(r)
∀ t : content(t) grounded-by census(intent(t))
∀ t : ¬(content(t) grounded-by census(intent(t))) ⇒ ¬(content(t) ⊨ spec(t))
∀ t : census(intent(t)) delegable-to agent
⋃ slices(P) = P
∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅
slices(P) = argmin over admissible cuts of |R ∩ ⋃ { sᵢ × sⱼ | i ≠ j }|
|frontier(P)| = 1 ⇒ slices mis-cut
(state, R, content) ≽ PLAN.md
mirror(state, R, content) emits R ∧ waves
depalimpsest(depalimpsest(c)) = depalimpsest(c)
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

start     : intent ↦ (P, slices(P), waves)
upsert    : (P, intent) ↦ P' ≜ author census-grounded t(s) ∧ P' = P ∪ {t} ∧ re-slice ∧ re-mirror
list      : ↦ ℘(P)
resume    : P ↦ frontier(P)
dispatch   ≜ ∀ t ∈ frontier(P) concurrently : state(t) := active ∧ owner(P) := self ∧ executor(t) runs content(t)
dispatch(P) ⇒ ¬occupied(P)
judge(t, r) ≜ accept(t)(r) ⇒ advance(t) ; ¬accept(t)(r) ⇒ r rejected back to executor(t), state(t) stays active
advance(t) ≜ state(t) := next(state(t)) ; state(t) = completed ⇒ ∀ d ∈ promote(t) : state(d) := ready
update(t)  ≜ content(t) := depalimpsest(content(t)) ; PLAN.md := mirror(state, R, content)
merge     : { P₁, P₂, … } ↦ ⋃ Pᵢ
sync       ≜ ∀ t ∈ P : state(t) ≠ truth(t) ⇒ state(t) := truth(t) ;
             ∀ u ∈ P : ∀ d ∈ promote(u) : state(d) := ready ;
             PLAN.md ≠ mirror(state, R, content) ⇒ PLAN.md := mirror(state, R, content)
             post : state = truth ∧ PLAN.md = mirror(state, R, content)
retire    : P ↦ P' ≜ relocate dir(P) under plans/.retired/ ; pre landed(P) ; post phase(P) = retired ∧ content(P') = content(P)
landingOf : P ↦ landing(P)` as SkillExpression;

export const praxis: Skill = {
  name: 'praxis',
  description: `use this skill to create a plan decomposed into MECE execution shards, where each shard is a self-contained task execution specification with objective, inputs, constraints, dependencies, outputs, and completion criteria.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
};
