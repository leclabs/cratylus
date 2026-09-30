import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

import { design } from '../design/skill.js';
import { note } from '../note/skill.js';

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
// THE LIFECYCLE STATES LIVE HERE AND NOWHERE ELSE. They are meaning, so the corpus
// holds them; the `plan` capability receives them as the configuration this cell's
// runtime face carries, which deploy emits into the host runtime config, and acts on
// the roles it names (which plan state at most one plan holds, which is final, which
// unit state satisfies a dependency), never on a spelling of its own.
//
// The laws carried forward are the ones that were PAID FOR. The output-array law and
// its measurement survive verbatim because the defect it names — a footprint read off
// where a sign is DEFINED while the work is bounded by where it is USED — recurred six
// times in one plan and voids every disjointness proof above it when it recurs.

const LIFECYCLE = {
  plan: {
    states: ['proposed', 'bound', 'closed'],
    exclusive: 'bound',
    final: 'closed',
  },
  unit: { states: ['pending', 'active', 'completed'], satisfies: 'completed' },
} as const;
const { plan: PLAN, unit: UNIT } = LIFECYCLE;

const FORMAL_BLOCK =
  `s      ≜ a cut piece ⟨closed · handed down · ¬ redrawable here⟩ @ design
c      @ design
anchor @ design
closure @ design
withdrawn @ design
self   @ design
P      ≜ a plan : the units cutting s into work
unit   ≜ a unit of work ⟨unit ∈ P⟩
name(x) ≜ the label x is addressed by ⟨x a P ∨ a unit · revisable⟩
States(P) ≜ { ${PLAN.states.join(', ')} } ⟨in lifecycle order⟩
States(unit) ≜ { ${UNIT.states.join(', ')} } ⟨in lifecycle order⟩
state  : P → States(P) ∧ unit → States(unit)
bound(P) ⇔ state(P) = ${PLAN.exclusive}
closed(P) ⇔ state(P) = ${PLAN.final}
satisfied(unit) ⇔ state(unit) ≽ ${UNIT.satisfies} ⟨reached completion ∨ moved past it⟩
settled(x) ⇔ x has exactly one current version ⟨x a P ∨ a unit⟩
live(x) ⇔ settled(x) ∧ that version ¬ a retraction
diverged(x) ⇔ ¬settled(x) ⟨concurrent sessions wrote x differently ∧ merged · state, ¬ error⟩
incoherent(P) ⇔ a law below broken across plans ∨ units by a merge ∧ kept on each branch
R      ⊆ P × P ⟨dependency⟩
deps(unit) ≜ { u | (unit, u) ∈ R }
realizes : P → ℘(anchor) ∧ unit → anchor ⟨TOTAL⟩
pin    : unit → the version of denotes(realizes(unit)) the unit was authored against
drifted(unit) ⇔ pin(unit) ≠ the one current version of denotes(realizes(unit)) ⟨amended · withdrawn · split into competing versions⟩
suspect(unit) ⇔ ¬drifted(unit) ∧ ∃ c ∈ closure(denotes(realizes(unit))) : c has more than one current version ∨ withdrawn(c) ∨ c has a version newer than pin(unit)
static : P → ℘(path)
refs   : P → ℘(path) ⟨what unit's outputs compile against⟩
outputs : P → ℘(path)
footprint : P → ℘(path) ⟨what landing unit actually changed⟩
occurs : anchor → ℘(path) ⟨every site SPELLING it · the site DEFINING it is ONE⟩
accept : P → (return → 𝔹) ⟨MECHANICAL only · the semantic half is @ deliver⟩
pre    : P → return
spec(unit) ≜ ⟨ realizes(unit), intent(unit), static(unit), deps(unit), outputs(unit), accept(unit) ⟩
census : intent → ⟨scope, static, deps, occurs⟩ ⟨delegable-to agent⟩
capacity ≜ the effort one implementer finishes in one dispatch ⟨DECLARED by the implementer's harness · ¬ a constant here⟩
effort(unit) ≜ what building ∧ proving unit costs ⟨reading included⟩
slices : P → ℘(℘(P))
cross(S) ≜ |R ∩ ⋃ { sᵢ × sⱼ | sᵢ, sⱼ ∈ S ∧ i ≠ j }|
wave(0) ≜ { unit | ∄ u : (unit, u) ∈ R }
wave(n+1) ≜ { unit | unit ∉ W(n) ∧ ∀ u : (unit, u) ∈ R ⇒ u ∈ W(n) }
W(n)   ≜ ⋃ { wave(i) | i ≤ n }
owed   @ note
blocked(unit) ⇔ ∃ u ∈ deps(unit) : ¬satisfied(u)
ready(unit) ⇔ bound(P) ∧ ¬blocked(unit) ∧ ∄ owed note blocking unit ∨ P ⟨computed, never stored · ready
    PROMISES an implementer can FINISH · conflating a dep with a ruling stalls a fan-out⟩
frontier(P) ≜ { unit | ready(unit) ∧ state(unit) = ${UNIT.states[0]} } ∪ { unit | bound(P) ∧ ${UNIT.states[0]} ≺ state(unit) ≺ ${UNIT.satisfies} } ⟨where
    the plan IS · ¬ only what is dispatchable · ¬bound(P) ⇒ frontier(P) = ∅⟩
planner   ≜ the planner ⟨bounded to s⟩
conform @ signify
show(P) ≜ \`scripts/plan.mjs show [<plan>]\` ↦ the bound P in wave order ∨ any P named, whole
show(unit) ≜ \`scripts/plan.mjs show <unit> --plan <p>\` ↦ one unit in full
add(unit) ≜ \`scripts/plan.mjs add <unit> --plan <p> --realizes <concept> --intent <i> [--static <path>]… [--deps <unit>]… [--outputs <path>]… [--accept <criterion>]… [--plan-realizes <concept>]…\` ⟨pin(unit) taken · the first add naming an absent P proposes it, realizing each --plan-realizes⟩
advance(unit) ≜ \`scripts/plan.mjs advance <unit> --plan <p> --to <state>\`
retract(unit) ≜ \`scripts/plan.mjs retract <unit> --plan <p>\`
revise(unit) ≜ \`scripts/plan.mjs revise <unit> --plan <p> [--intent <i>] [--static <path>]… [--deps <unit>]… [--outputs <path>]… [--accept <criterion>]…\` ⟨spec(unit) · pin(unit) kept⟩
revise(P) ≜ \`scripts/plan.mjs revise <plan> [--name <n>] [--realizes <concept>]…\` ⟨name(P) ∨ realizes(P)⟩
bind(P) ≜ \`scripts/plan.mjs bind <plan>\` ⟨bound(P) ∧ the P bound before returns to ${PLAN.states[0]}⟩
close(P) ≜ \`scripts/plan.mjs close <plan>\` ⟨closed(P)⟩
reconcile(x) ≜ \`scripts/plan.mjs reconcile <unit> --plan <p> [--name <n>] [--realizes <concept>] [--intent <i>] [--static <path>]… [--deps <unit>]… [--outputs <path>]… [--accept <criterion>]… [--state <state>] [--repin]\` ∨ \`scripts/plan.mjs reconcile <plan> [--name <n>] [--realizes <concept>]… [--state <state>]\` ↦ one version superseding every current version of x ⟨each field the versions disagree on is given · a unit whose versions pin differently takes --repin⟩

∀ add ∨ advance ∨ retract ∨ revise ∨ bind ∨ close ∨ reconcile : \`--author <who> --reason <why> --cause <what caused it>\` ⟨a set-valued flag repeats, one member each⟩
∀ unit : realizes(unit) ∈ { anchor(c) | c ∈ s } ⟨TOTALITY is the gate · a unit citing no
    concept is work whose purpose cannot be stated ∴ REFUSED at authoring, ¬ warned⟩
∀ unit : closure(denotes(realizes(unit))) ⊆ s ⟨a unit reaching outside its piece is a
    BOUNDARY finding · SURFACE it ; the planner may ¬ redraw the cut⟩
∀ unit : realizes(unit) = the concept pin(unit) names ∧ realizes(unit) ∈ realizes(P) ⟨a merge
    breaking it is incoherent(P), reported like the others⟩
|{ P | bound(P) }| ≤ 1 ⟨held by bind(P), which returns the P bound before⟩
∀ n : |{ P | live(P) ∧ name(P) = n }| ≤ 1 ∧ ∀ P : |{ unit ∈ P | live(unit) ∧ name(unit) = n }| ≤ 1
closed(P) ⇒ name(P) kept ∧ ∄ write to P ∨ any unit ∈ P ⟨closed is final · readable forever⟩
¬closed(P) ⇒ revise(P) admitted ⟨its name ∧ its concepts, never its state⟩
state(P) moves by bind(P) ∨ close(P) alone
revise routes to revise(unit) ∨ revise(P) by the name it is given ⟨--plan puts a unit's P in view⟩
∃ u : live(u) ∧ unit ∈ deps(u) ⇒ ¬ retract(unit)
advance(unit) ⊨ bound(P) ∧ one step forward in States(unit) ⟨a skip ∨ a step back refuses · a unit of an unbound P is authored ∧ revised, ¬ worked⟩
∀ unit : R acyclic ∧ ∀ u ∈ deps(unit) : live(u) ∧ u ∈ P
an owed note blocking P ⇒ ¬ bind(P) ∧ ∀ unit ∈ P : ¬ready(unit)
add(unit) ⊨ ∀ c ∈ closure(denotes(realizes(unit))) : c has exactly one current version ∧ ¬withdrawn(c) ⟨a pin is taken on settled ground alone⟩
pin(unit) retaken ⇔ \`scripts/plan.mjs revise <unit> --plan <p> --repin --reason <why>\` ⟨the ONLY way · never a side effect of editing spec(unit)⟩
withdrawn(denotes(realizes(unit))) ⇒ drifted(unit) ∧ ¬ incoherent(P) ⟨a retraction in the design never breaks a plan law⟩
drifted(unit) ∨ suspect(unit) ⇒ SURFACE ⟨the design moved under the plan · drift, ¬ staleness⟩
drifted(unit) ⇒ response ↾ what moved ⟨nothing ⇒ repin · gloss ⇒ repin ∨ revise(unit) ∧ repin, by what the
    new gloss adds ∨ drops · anchor ∨ factors ⇒ revise(unit) ∧ repin · re-cut ⇔ s itself moved⟩
suspect(unit) ⇒ the same response ↾ what moved beneath ⟨the concept that moved is a factor, ¬ the one
    unit spells ∴ its anchor moving alone ⇒ repin · a factor dropped beneath shows as the concept
    above it amended in factors⟩
diverged(x) ⇒ reconcile(x) ⟨an ordinary write on x refuses⟩
incoherent(P) ⇒ repaired by ordinary writes, one at a time
reconcile ⊨ self ⟨reconciliation of plans ∧ units is the architect's alone⟩
slices(P) cut on s ⟨¬ file-adjacency · files are a LAGGING proxy for modularity ∴
    file-cut ⇒ ∀ unit ⊇ fragments of several c ⇒ implementer finishes ∧ system incoherent⟩
⋃ slices(P) = P ∧ ∀ s₁, s₂ ∈ slices(P) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅
∄ swap improving cross(slices(P)) ⟨argmin ↾ LOCAL · exhaustive ∧ deterministic ;
    a global argmin over every assignment is ¬ decidable⟩
∀ n < m : |wave(n)| = 1 ⇒ slices mis-cut ⟨a singleton non-terminal wave is a CHAIN⟩
∀ unit, u ∈ wave(n) : unit ≠ u ⇒ outputs(unit) ∩ outputs(u) = ∅ ⟨the concurrency precondition⟩
∀ unit, u ∈ wave(n) : unit ≠ u ⇒ outputs(unit) ∩ refs(u) = ∅ ⟨disjoint outputs is NECESSARY
    ¬ sufficient : a deletion in unit dangles a reference in u⟩
⊨ disjoint-outputs ⇒ dispatch(wave(n)) needs-no-isolation
∀ unit : effort(unit) ≤ capacity ⟨ready PROMISES an implementer can FINISH · a unit past capacity
    hands its successor a re-read, ¬ progress⟩
effort(unit) > capacity ⇒ split on factors(denotes(realizes(unit))) ⟨each part realizes a factor ·
    ¬ a file-cut⟩ ; factors = ∅ ⇒ SURFACE ⟨a primitive no implementer finishes is ¬ primitive @ design⟩
an implementer exhausted mid-unit ⇒ effort(unit) mis-estimated ⇒ split ∨ SURFACE ≺ redispatch
    ⟨¬ a chain of cold successors⟩
∀ unit : footprint(unit) ⊆ outputs(unit) ⟨outputs IS the contention set ∴ an under-declared
    array silently voids every disjointness proof above⟩
∀ unit : occurs(realizes(unit)) ⊆ outputs(unit) ⟨a unit's footprint is its REFERENCE set, ¬ its
    definition site · resolve occurs BEFORE declaring outputs⟩
    ⟨measured 6 under-declared arrays in one plan, ONE cause · declared 1 glob and
     wrote 15 paths · 1 and 12 · 8 and 20⟩
∀ unit : ∃ r : ¬accept(unit)(r) ∧ ¬accept(unit)(pre(unit)) ⟨criteria that cannot FAIL, ∧ that
    already pass before the work, test nothing⟩
census(P) ⊨ once ∧ pinned⟨commit⟩ ∧ cited by every unit ⟨¬ re-derived per implementer⟩
∀ unit : measurement ∈ spec(unit) ⇒ measurement = claim⟨commit⟩ ∴ cite ⇔ ∄ change to its paths since
    that commit ; else re-derive ≺ cite ⟨a count in a unit is CENSUS OUTPUT, ¬ a datum · the tree
    moves ∧ nothing reds · within P it moves only by landed outputs, each declared before dispatch⟩
∀ unit : reach-leg(unit) ⊨ print(denominator) ⟨∄ denominator ⇒ found-nothing ≡ could-not-look⟩
∀ unit : conform(spec(unit))
plan ≜ the planner's procedure ⟨ends at ratify⟩ : take(s) → census ⟨delegable⟩ → slice(s) → add(∀ unit) ⟨spec ∧ pin⟩ → ratify @ planner` as SkillExpression;

export const plan: Skill = {
  name: 'plan',
  description: `use this skill to decompose ONE cut piece of a design into MECE units of work — each citing the single concept it realizes, with its inputs, dependencies, declared outputs and mechanical acceptance criteria — sliced on the design's seams rather than on file adjacency, and ordered into waves whose outputs are disjoint so they dispatch concurrently without contending. Reach for it after a design exists and before any work is dispatched. A unit that cites no concept is refused; a piece that cannot be planned as handed down is surfaced, never silently redrawn. Its verbs show a plan or a unit, add, advance, retract and revise units, revise, bind and close a plan, and reconcile either.`,
  formalBlock: FORMAL_BLOCK,
  runtime: { capability: 'plan', configuration: LIFECYCLE },
  composition: () => [design, note],
  preamble: primePrinciple,
};
