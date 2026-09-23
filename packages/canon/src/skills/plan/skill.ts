import type { Skill, SkillExpression } from '../../manifest.js';

import { PLAN_STATES } from '../../plan-states.js';
import { design } from '../design/skill.js';

// SUPERSEDES `praxis`, which carried three activities with three different ends —
// capturing understanding, specifying work, and governing execution — and no seam
// between them. An agent asked to switch telos three times with nothing marking the
// switch settles into whichever posture its last tool call left it in, which in a
// tool-driven session is always the making. That is the drift, and it is structural
// rather than a lapse of attention.
//
// What remains here is the middle term only: decomposition, dependency, waves, and
// the plan's own lifecycle. Understanding moved to `design`; dispatch, judgement and
// triage moved to `deliver`.
//
// The laws carried forward are the ones that were PAID FOR. The output-array law and
// its measurement survive verbatim because the defect it names — a footprint read off
// where a sign is DEFINED while the work is bounded by where it is USED — recurred six
// times in one plan and voids every disjointness proof above it when it recurs.

const FORMAL_BLOCK =
  `s      ≜ a cut piece ⟨closed · handed down · ¬ redrawable here⟩ @ design
anchor @ design
closure @ design
pin    @ design
digest @ design
P      ≜ a plan : the units cutting s into work
unit      ≜ a unit of work ⟨unit ∈ P⟩
States ≜ { ${PLAN_STATES.join(', ')} }
state  : P → States
R      ⊆ P × P ⟨dependency⟩
deps(unit) ≜ { u | (unit, u) ∈ R }
realizes : P → anchor ⟨TOTAL⟩
static : P → ℘(path)
refs   : P → ℘(path) ⟨what unit's outputs compile against⟩
outputs : P → ℘(path)
footprint : P → ℘(path) ⟨what landing unit actually changed⟩
occurs : anchor → ℘(path) ⟨every site SPELLING it · the site DEFINING it is ONE⟩
accept : P → (return → 𝔹) ⟨MECHANICAL only · the semantic half is @ deliver⟩
pre    : P → return
spec(unit) ≜ ⟨ realizes(unit), intent(unit), static(unit), deps(unit), outputs(unit), accept(unit) ⟩
census : intent → ⟨scope, static, deps, occurs⟩ ⟨delegable-to agent⟩
slices : P → ℘(℘(P))
cross(S) ≜ |R ∩ ⋃ { sᵢ × sⱼ | sᵢ, sⱼ ∈ S ∧ i ≠ j }|
wave(0) ≜ { unit | ∄ u : (unit, u) ∈ R }
wave(n+1) ≜ { unit | unit ∉ W(n) ∧ ∀ u : (unit, u) ∈ R ⇒ u ∈ W(n) }
W(n)   ≜ ⋃ { wave(i) | i ≤ n }
frontier(P) ≜ { unit | state(unit) ∈ { ready, active } } ⟨where the plan IS · ¬ only
    what is dispatchable⟩
blocked(unit) ⇔ ∃ u : (unit, u) ∈ R ∧ state(u) ≠ completed
ruling-owed(unit) ⇔ a decision nobody has taken stands between unit and acceptance
mirror : (state, R, spec) → document
planner   ≜ the planner ⟨bounded to s⟩
conform @ signify

∀ unit : realizes(unit) ∈ { anchor(c) | c ∈ s } ⟨TOTALITY is the gate · a unit citing no
    concept is work whose purpose cannot be stated ∴ REFUSED at authoring, ¬ warned⟩
∀ unit : closure(denotes(realizes(unit))) ⊆ s ⟨a unit reaching outside its piece is a
    BOUNDARY finding · SURFACE it ; the planner may ¬ redraw the cut⟩
pin(s) ≠ digest(s) ⇒ REFUSE ⟨the design moved under the plan · drift, ¬ staleness⟩
slices(P) cut on s ⟨¬ file-adjacency · files are a LAGGING proxy for modularity ∴
    file-cut ⇒ ∀ unit ⊇ fragments of several c ⇒ executor finishes ∧ system incoherent⟩
⋃ slices(P) = P ∧ ∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅
∄ swap improving cross(slices(P)) ⟨argmin ↾ LOCAL · exhaustive ∧ deterministic ;
    a global argmin over every assignment is ¬ decidable⟩
∀ n < m : |wave(n)| = 1 ⇒ slices mis-cut ⟨a singleton non-terminal wave is a CHAIN⟩
∀ unit, u ∈ wave(n) : unit ≠ u ⇒ outputs(unit) ∩ outputs(u) = ∅ ⟨the concurrency precondition⟩
∀ unit, u ∈ wave(n) : unit ≠ u ⇒ outputs(unit) ∩ refs(u) = ∅ ⟨disjoint outputs is NECESSARY
    ¬ sufficient : a deletion in unit dangles a reference in u⟩
⊨ disjoint-outputs ⇒ dispatch(wave(n)) needs-no-isolation
∀ unit : footprint(unit) ⊆ outputs(unit) ⟨outputs IS the contention set ∴ an under-declared
    array silently voids every disjointness proof above⟩
∀ unit : occurs(realizes(unit)) ⊆ outputs(unit) ⟨a unit's footprint is its REFERENCE set, ¬ its
    definition site · resolve occurs BEFORE declaring outputs⟩
    ⟨measured 6 under-declared arrays in one plan, ONE cause · declared 1 glob and
     wrote 15 paths · 1 and 12 · 8 and 20⟩
∀ unit : ∃ r : ¬accept(unit)(r) ∧ ¬accept(unit)(pre(unit)) ⟨criteria that cannot FAIL, ∧ that
    already pass before the work, test nothing⟩
∀ unit : measurement ∈ spec(unit) ⇒ measurement = claim⟨timestamp⟩ ∴ re-derive ≺ cite
    ⟨a count in a unit is CENSUS OUTPUT, ¬ a datum · the tree moves ∧ nothing reds⟩
∀ unit : reach-leg(unit) ⊨ print(denominator) ⟨∄ denominator ⇒ found-nothing ≡ could-not-look⟩
state(unit) = ready ⇒ ¬blocked(unit) ∧ ¬ruling-owed(unit) ⟨ready PROMISES an executor can
    FINISH · conflating a dep with a ruling stalls a fan-out on one unanswered question⟩
∀ unit : conform(spec(unit))
advance ⊨ mirror ⟨state moves ∴ the document moves · drift is ¬ a later chore⟩
plan ≜ take(s) → census ⟨delegable⟩ → slice(s) → author spec(∀ unit) → mirror → ratify @ planner` as SkillExpression;

export const plan: Skill = {
  name: 'plan',
  description: `use this skill to decompose ONE cut piece of a design into MECE units of work — each citing the single concept it realizes, with its inputs, dependencies, declared outputs and mechanical acceptance criteria — sliced on the design's seams rather than on file adjacency, and ordered into waves whose outputs are disjoint so they dispatch concurrently without contending. Reach for it after a design exists and before any work is dispatched. A unit that cites no concept is refused; a piece that cannot be planned as handed down is surfaced, never silently redrawn.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [design],
};
