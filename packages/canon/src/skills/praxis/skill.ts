import type { Skill, SkillExpression } from '../../manifest.js';
// The plan-layout state canon (one home) — the `States` set below derives from it;
// a project template sources its `planStates` from the same home (DRY). Lives in a
// sibling module, not exported here: a skill module has exactly ONE export (its Skill).
import { PLAN_STATES } from '../../toolkit/plan-states.js';

const FORMAL_BLOCK = `intent          ≜ the stated goal
States          ≜ { ${PLAN_STATES.join(', ')} }
P               ≜ a plan : a set of task-files
content : P → text
static  : P → ℘(path)
constraints : P → ℘(invariant)
outputs : P → ℘(artifact)
inputs(t) ≜ static(t) ∪ { content(u) | (t, u) ∈ R }
deps(t)   ≜ { u | (t, u) ∈ R }
accept  : P → (return → 𝔹)
pre     : P → return
spec(t) ≜ ⟨ intent(t), inputs(t), constraints(t), deps(t), outputs(t), accept(t) ⟩
census  : intent → ⟨scope, static, deps⟩
executor : P ⇀ agent
self     ≜ session⟨AGENT_SESSION_ID⟩
registered, released, stale : session → 𝔹
live     : session → 𝔹
owner   : P ⇀ session
bound    : P → 𝔹 ⟨plan-level commitment · persists across sessions · ¬ shard-state⟩
gates    : P × P → 𝔹
electable ≜ { P ∈ Plans | ¬ terminal(P) ∧ ¬ occupied(P) }
act      ≜ a thing the executor does
serves   : act × P → 𝔹
cost     : act → effort
defect   ≜ ⟨symptom, locus, provenance⟩
owns     : defect ⇀ P
impedes  : defect × P → 𝔹
refs     : P → ℘(path) ⟨what a shard's outputs compile against⟩
sign     ≜ a name the corpus bears
rewrites : P → ℘(sign) ⟨the signs t re-signifies⟩
occurs   : sign → ℘(path) ⟨every site SPELLING it · the site DEFINING it is ONE of them⟩
footprint : P → ℘(path) ⟨the paths landing t changed⟩
origin   : P ⇀ P ⟨the shard t was CUT OUT of · borne by no plan datum⟩
cross(S) ≜ |R ∩ ⋃ { sᵢ × sⱼ | sᵢ, sⱼ ∈ S ∧ i ≠ j }|
admissible(S) ⇔ ∀ s ∈ S : 3 ≤ |s| ≤ 1.5 · |P| / |S| ⟨a slice under 3 is a label ¬ a lane · a slice far above the mean cannot be fanned out against its siblings · both bounds are COMPUTED from |P| ∵ a fixed pair encodes |P| at the moment someone wrote it down⟩
swap(S,t,u) ≜ S with t and u exchanging slices
dir      : P → path
state   : P → States
truth   : P → States
R ⊆ P × P
slices  : P → ℘(℘(P))
mirror  : (state, R, content) → document
PLAN.md ≜ mirror(state, R, content)
depalimpsest(c) ≜ c ↾ live-strata
conform @ signify
Phase    ≜ { proposed, in-flight, landed, superseded, retired }
Plans    ≜ { P | P a plan on disk }
commit   ≜ a VCS commit
commits  : P → ℘(commit)
lands    : commit × P → 𝔹
landing  : P ⇀ commit
retires  : commit × P → 𝔹
retirement : P ⇀ commit
stored   : P → ℘(commit)
retired  : P → 𝔹
superseded : P → 𝔹
terminal : P → 𝔹
phase    : P → Phase

blocked(t)  ⇔ ∃ u : (t, u) ∈ R ∧ state(u) ≠ completed
ruling-owed(t) ⇔ a decision nobody has taken stands between t and its acceptance ⟨¬ a dep ∵ a dep is mechanical sequencing an executor can wait out⟩
live(s)     ⇔ registered(s) ∧ ¬ released(s) ∧ ¬ stale(s)
occupied(P) ⇔ owner(P) defined ∧ owner(P) ≠ self ∧ live(owner(P))
retires(c, P) ⇔ c deletes dir(P) ⟨the twin of lands · retirement is VCS-carried, ¬ residence-carried⟩
retired(P)  ⇔ retirement(P) defined
superseded(P) ⇔ .superseded-by @ dir(P)
frontier(P) ≜ { t | t ∈ P ∧ state(t) ∈ { ready, active } } ⟨where the plan IS · ¬ only what is dispatchable⟩
sharded(P)  ⇔ P ≠ ∅
promote(u)  ≜ { t | (t, u) ∈ R ∧ state(t) = pending ∧ ¬blocked(t) ∧ ¬ruling-owed(t) }
next        ≜ { pending ↦ ready, ready ↦ active, active ↦ completed, completed ↦ completed }
W(n)        ≜ ⋃ { wave(i) | i <= n }
wave(0)     ≜ { t | ∄ u : (t, u) ∈ R }
wave(n+1)   ≜ { t | t ∉ W(n) ∧ ∀ u : (t, u) ∈ R ⇒ u ∈ W(n) }
waves       ≜ (wave(0), wave(1), …)
dispatched(P) ⇔ ∃ t ∈ P : state(t) ∈ { active, completed }
done(P)       ⇔ ∀ t ∈ P : state(t) = completed
landed(P)     ⇔ landing(P) defined ∧ ¬ retired(P)
terminal(P)   ⇔ landed(P) ∨ superseded(P)
nextPhase     ≜ { proposed ↦ in-flight, in-flight ↦ landed, landed ↦ retired, superseded ↦ retired, retired ↦ retired }

∀ t ∈ P : t @ dir(P)/state(t)
owner(P) @ dir(P)/.owner
registered, released, stale @ memory-session-registry
∀ t : content(t) ⊨ spec(t)
∀ t : ∀ p ∈ static(t) : p exists at authoring
∀ t : ∀ p ∈ outputs(t) : p exists ∨ the directory holding p exists ⟨a shard MAY create a file ∴ a non-resolving output is ¬ automatically a typo · the PARENT discriminates a creation target from a misspelling⟩
∀ t : ∃ r : ¬accept(t)(r)
∀ t : ¬accept(t)(pre(t))
∀ t : accept(t)(pre(t)) ⇒ ¬(content(t) ⊨ spec(t))
∀ t : content(t) grounded-by census(intent(t))
∀ t : ¬(content(t) grounded-by census(intent(t))) ⇒ ¬(content(t) ⊨ spec(t))
∀ t : census(intent(t)) delegable-to agent
state(t) = ready ⇒ ¬ blocked(t) ∧ ¬ ruling-owed(t) ⟨ready PROMISES an executor can pick t up and FINISH · conflating a dep with a ruling stalls a fan-out with every agent blocked on the same unanswered question⟩
⋃ slices(P) = P
∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅
admissible(slices(P)) ∧ ∄ t, u ∈ P : admissible(swap(slices(P),t,u)) ∧ cross(swap(slices(P),t,u)) < cross(slices(P))
argmin over an UNNAMED admissible ⇒ unfalsifiable ∧ global argmin over every assignment ¬ decidable ∴ argmin ↾ LOCAL ⟨no admissible swap improves the cut · exhaustive ∧ deterministic⟩
waves = (wave(0), …, wave(m))
∀ n < m : |wave(n)| = 1 ⇒ slices mis-cut ⟨a singleton non-terminal wave is a chain, ¬ a cut⟩
∀ t, u ∈ wave(n) : t ≠ u ⇒ outputs(t) ∩ outputs(u) = ∅ ⟨the concurrency precondition⟩
∃ t, u ∈ wave(n) : t ≠ u ∧ outputs(t) ∩ outputs(u) ≠ ∅ ⇒ slices mis-cut
∀ t, u ∈ wave(n) : t ≠ u ⇒ outputs(t) ∩ refs(u) = ∅ ⟨disjoint outputs is NECESSARY ¬ sufficient : a deletion in t dangles a reference in u⟩
⊨ disjoint-outputs ⇒ dispatch(wave(n)) needs-no-isolation ⟨a correctly cut wave never contends⟩
∀ t : footprint(t) ⊆ outputs(t) ⟨outputs IS the contention set ∴ an under-declared array silently voids every disjointness proof above · a shorter array is still an array of resolving globs⟩
∀ t : ⋃ { occurs(s) | s ∈ rewrites(t) } ⊆ outputs(t) ⟨a shard's footprint is its REFERENCE set, ¬ its definition site · a rename touches every speller · giving a name its first home makes every existing spelling interpolate it · resolve occurs BEFORE declaring outputs⟩
⟨measured 6 under-declared arrays across one plan, ONE cause ⟨footprint read off where a sign is DEFINED while the work was bounded by where it is USED⟩ · declared 1 glob and wrote 15 paths · 1 and 12 · 8 and 20⟩
origin(t) defined ⇒ outputs(t) re-derived from rewrites(t) ⟨SPLITTING A SHARD DOES NOT SPLIT ITS BLAST RADIUS · the child's array is its own, ¬ the topical part of outputs(origin(t)) · so a split understates BY CONSTRUCTION, ¬ by oversight⟩
∄ origin borne by any plan datum ⇒ ¬ gateable ∴ this law rides the CELL ⟨the seam nearest the defect is the only one left when the datum a check would need was never captured⟩
(state, R, content) ≽ PLAN.md
mirror(state, R, content) emits R ∧ waves
depalimpsest(depalimpsest(c)) = depalimpsest(c)
retired(P)                               ⇒ phase(P) = retired
superseded(P) ∧ ¬ retired(P)             ⇒ phase(P) = superseded
landed(P) ∧ ¬ superseded(P)              ⇒ phase(P) = landed
dispatched(P) ∧ ¬ landed(P) ∧ ¬ superseded(P) ∧ ¬ retired(P) ⇒ phase(P) = in-flight
¬ dispatched(P) ∧ ¬ superseded(P) ∧ ¬ retired(P) ⇒ phase(P) = proposed
landing(P) = c ⇔ lands(c, P)
retirement(P) = c ⇔ retires(c, P)
∀ c, c' : lands(c, P) ∧ lands(c', P) ⇒ c = c'
∀ c, c' : retires(c, P) ∧ retires(c', P) ⇒ c = c'
retired(P) ⇒ P ∉ Plans ⟨retire removes the member · Plans is disk, ∴ phase reads the commit, ¬ a residence⟩
∀ P : stored(P) = ∅ ⟨landing ∧ retirement alike : recomputed from VCS every call, written nowhere⟩
list = Plans
yield(P)  ≜ what EXECUTING P established ∧ ¬ derivable from intent(P) @ ENGINE ⟨enters as Intent, ¬ as a Sign : execution establishes what needs naming, ¬ the name⟩
drained(y) ⇔ ∀ i ∈ y : i authored into its strongest seam ⟨gate ≻ cell ≻ governing-doc @ dream⟩ ∨ i filed as a canon-candidate ⟨¬ agent-private memory : a private home is where the NEXT agent re-derives it⟩
retire(P) defined ⇔ terminal(P) ∧ drained(yield(P))
supersede(P, Q) ⇒ superseded(P)
∀ t : conform(content(t))
⊨ conform(PLAN.md)
∀ t, r : ¬conform(r) ⇒ ¬accept(t)(r)

bound(P) @ dir(P)/.bound ⟨persistent · survives session-end · ¬ derived from shard-state⟩
∃ P ∈ Plans : ¬ terminal(P) ⇒ ∃! P : bound(P) ⟨always-bind ∧ WIP=1 · one law⟩
bound(P) ⇒ ¬ occupied(P)
bound(P) ∧ ¬ sharded(P) ⇒ start(P) ≺ dispatch(P) ⟨binding an unsharded plan obliges the cut⟩
bound(P) ∧ sharded(P) ∧ ¬ done(P) ⇒ frontier(P) ≠ ∅ ⟨the ¬ done antecedent is LOAD-BEARING · dropped, the law reds a plan for FINISHING ∧ the cheapest green is filing work nobody needs⟩
done(P) ⇒ frontier(P) = ∅ ⟨TAUTOLOGY ∵ frontier(P) ⊆ the open states · carries no content and is the first thing anyone writes here⟩
done(P) ⇒ ∀ t ∈ P : t @ dir(P)/completed ⟨done is witnessed by RESIDENCE · a task-file that VANISHED empties frontier(P) exactly as finishing does, ∧ only residence tells the two apart⟩
sharded(P) ∧ ¬ done(P) ∧ frontier(P) = ∅ ⇒ R ill-formed ⟨cycle ∨ unsatisfiable dep ∨ AN EDGELESS NODE⟩ · SURFACE
    ⟨read the third disjunct FIRST : \`file\` writes its stub with ¬ census ∧ ¬ re-slice ∴ the filed t has NO edge in R, ∴ ∄ u : t ∈ promote(u), ∴ t is unreachable BY CONSTRUCTION ∧ it still counts against done(P)⟩
    ⟨∴ any bound plan carrying a filed defect and no live shard reds this law, and the cause is the FILING, ¬ a cycle · only \`upsert\` gets it out · measured twice, in two plans, two weeks apart⟩
gates(P, Q) ⇔ ∃ t ∈ Q : landing(P) ∈ deps(t)
elect ≜ in-flight ≻ gating ≻ operator-intent ⟨lexicographic · finish before starting⟩
terminal(P) ⇒ retire(P) ⟨obligation ¬ permission · an unretired terminal plan is WIP that is not work⟩
yield(P) ≠ ∅ ∧ ¬ drained(yield(P)) ⇒ ¬ retire(P) ⟨ENGINE intake, realized HERE : deletion is where a law dies⟩
    ⟨measured : 16 retired plans, 25 laws, 0 in the canon ∴ every anchor re-derived privately, per agent, forever⟩
impedes(d, t) ⇔ d standing ⇒ ∄ r : accept(t)(r)
impedes(d, t) ⇒ fix(d) ∧ ¬ check-in-owed ⟨a regression in the path is repaired, ¬ surfaced⟩
¬ impedes(d, t) ⇒ file(owns(d), d) ∧ ¬ fix(d) ⟨a defect beside the path is filed, ¬ chased⟩
cost(file) < cost(fix) ⟨else the gradient points at chasing · the load-bearing law⟩
dispatch(P) ∧ ¬ serves(a, P) ⇒ a ∈ { file, triage } ⟨scope-bound⟩
advance ⊨ mirror ⟨state moves ∴ PLAN.md moves · drift is ¬ a later chore⟩

start     : intent ↦ (P, slices(P), waves)
upsert    : (P, intent) ↦ P' ≜ author census-grounded t(s) ∧ P' = P ∪ {t} ∧ re-slice ∧ re-mirror
list      : ↦ ℘(P)
elect     : ↦ P ≜ the ≻-greatest of electable ; pre electable ≠ ∅
bind      : P ↦ P ≜ write .bound @ dir(P) ; pre ∀ Q ≠ P : ¬ bound(Q) ; post ∃! bound
unbind    : P ↦ P ≜ remove .bound @ dir(P) ; pre done(P) ∨ terminal(P) ∨ operator-redirect
file      : (P, d) ↦ P' ≜ stub t @ dir(P)/pending : ⟨symptom(d), locus(d), provenance(d)⟩ ;
            ¬ census ∧ ¬ re-slice ∧ ¬ re-mirror ; post P' = P ∪ { t }
triage    : d ↦ impedes(d, t) ⇒ fix(d) ; ¬ impedes(d, t) ⇒ file(owns(d), d)
dispatch   ≜ ∀ t ∈ frontier(P) : state(t) = ready ⇒ concurrently ⟨ state(t) := active ∧ owner(P) := self ∧ executor(t) runs content(t) ⟩
dispatch(P) ⇒ ¬occupied(P) ∧ bound(P)
judge(t, r) ≜ accept(t)(r) ⇒ advance(t) ; ¬accept(t)(r) ⇒ r rejected back to executor(t), state(t) stays active
              ⟨r lands VERBATIM ≺ any verdict on it : the loss mode is read-reason-discard, and it takes everything exactly when a run dies mid-judgement⟩
              ⟨fan-in is as order-sensitive as fan-out : ∀ t dispatched in the wave, confirm executor(t) RETURNED ; outputs(t) exist ≠ executor(t) returned⟩
advance(t) ≜ state(t) := next(state(t)) ; state(t) = completed ⇒ ∀ d ∈ promote(t) : state(d) := ready ;
             PLAN.md := mirror(state, R, content)
update(t)  ≜ content(t) := depalimpsest(content(t)) ; PLAN.md := mirror(state, R, content)
merge     : { P₁, P₂, … } ↦ ⋃ Pᵢ
sync       ≜ ∀ t ∈ P : state(t) ≠ truth(t) ⇒ state(t) := truth(t) ;
             ∀ u ∈ P : ∀ d ∈ promote(u) : state(d) := ready ;
             PLAN.md ≠ mirror(state, R, content) ⇒ PLAN.md := mirror(state, R, content)
             post : state = truth ∧ PLAN.md = mirror(state, R, content)
supersede : (P, Q) ↦ P ≜ write .superseded-by @ dir(P) := Q ⟨staged⟩ ; pre Q ∈ Plans ∧ Q ≠ P ; post superseded(P)
retire    : P ↦ ⊥ ≜ delete dir(P) ; pre terminal(P) ∧ drained(yield(P)) ; post P ∉ Plans
landingOf : P ↦ landing(P)
retirementOf : P ↦ retirement(P)` as SkillExpression;

export const praxis: Skill = {
  name: 'praxis',
  description: `use this skill to create a plan decomposed into MECE execution shards, where each shard is a self-contained task execution specification with objective, inputs, constraints, dependencies, outputs, and completion criteria.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
};
