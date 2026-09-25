import type { Skill, SkillExpression } from '../../manifest.js';

import { design } from '../design/skill.js';
import { plan } from '../plan/skill.js';

// WHERE THE TRUST DEFECT IS CLOSED. Acceptance keyed to a unit's own criteria is a
// closed loop: the author writes the unit, writes its criteria, and checks the return
// against them. Every term comes from one source, so an executor satisfying the letter
// passes while the design goes unmet. Instructing the principal to "actually verify"
// cannot repair this — verification is a TWO-DESCRIPTION operation, and with one
// description there is no operation to perform, so it degenerates into re-reading the
// claim. The second description is the design, which is why this cell composes it.
//
// The split that matters: the EXECUTOR verifies ⟨did I build it per the spec⟩ and the
// PRINCIPAL validates ⟨is this what the design called for⟩. Both are legitimate and
// neither substitutes. Today only the first exists in most loops.
//
// The three validation questions are cheap BY CONSTRUCTION, and that is load-bearing
// rather than convenient: a check costing more than redoing the work is skipped, and
// no instruction survives that gradient. Naming discipline is what buys the cheapness —
// if the artifact spells its concept, two of the three are reading a name.
//
// WHERE THE READ GOES, AND WHY THE VERDICT DOES NOT FOLLOW IT. `validate ⊨ artifact` is
// right and it has a cost: reading artifacts is reading files — paths, identifiers, call
// sites — which is exactly the mechanical work the architect's contract calls a descent.
// Left there, the skill obliges the design-holder to descend on every wave, and by the
// third wave the design-holder is a code reviewer holding a lattice it can no longer
// carry. So `validate` is two operations under one name and they separate cleanly: the
// ASSAY (read the landed artifact, re-derive which concepts it realizes) is mechanical,
// substrate-bound and DELEGABLE; the JUDGMENT (what an unachieved concept means —
// rejection, an `amend(C)` because execution established a yield, or a design that was
// wrong) is keyed to C and is NOT.
//
// A THIRD PARTY DOES NOT REOPEN THE DEFECT THIS CELL CLOSES. The law forbids accepting
// on a claim from the party that BUILT the thing: one description, a closed loop. There
// are still two descriptions here and they are still held by different parties — the
// executor holds the spec and not the design, the assayer holds the design and not the
// spec. The artifact read the law demands still happens; it happens at the one site in
// the loop where reading substrate is the work rather than a descent, and what reaches
// the principal is in the only vocabulary the principal can check without descending.

const FORMAL_BLOCK = `C      @ design
c      ≜ a concept ⟨c ∈ C⟩
anchor @ design
gloss  @ design
factors @ design
denotes @ design
amend  @ design
yield  ≜ what execution established ∧ ¬ derivable from C
P      @ plan
unit      ≜ a unit of work
wave   @ plan
frontier @ plan
realizes @ plan
accept @ plan ⟨the MECHANICAL half⟩
outputs @ plan
artifact : P → ℘(path) ⟨what landed · the EVIDENCE⟩
r      ≜ an executor's return
conform @ signify
executor : P ⇀ agent
self   ≜ the principal ⟨the design-holder⟩
spells : path × anchor → 𝔹 ⟨identifiers · path · public surface bear the sign⟩
covers : path × ℘(C) → 𝔹 ⟨observable behaviour ≅ the factorization · nothing missing
         ∧ nothing extra⟩
sole   : path × anchor → 𝔹 ⟨∄ other artifact realizing the same concept⟩
verify : P × return → 𝔹 ⟨the EXECUTOR's · built-it-right, against spec⟩
validate : P → 𝔹 ⟨the PRINCIPAL's · built-the-right-thing, against C⟩
assay  : artifact → ℘(C) ⟨which concepts the artifact ACTUALLY realizes · the REVERSE of plan⟩
assayer : unit ⇀ agent ⟨role = assayer · holds C ∧ ¬ holds spec(unit)⟩
achieved : unit → 𝔹 ⟨the three questions, answered against the assay⟩
unachieved : unit → ℘(⟨c, uncovered-factor, locus⟩) ⟨what crosses UPWARD⟩
defect ≜ ⟨symptom, locus, provenance⟩
impedes : defect × P → 𝔹
cost   : act → effort
bound  : P → 𝔹 ⟨plan-level commitment · persists across sessions⟩
electable ≜ { P | ¬terminal(P) ∧ ¬occupied(P) }
terminal : P → 𝔹

∀ unit, r : ¬conform(r) ⇒ ¬accept(unit)(r)
achieved(unit) ⇔ realizes(unit) ∈ assay(artifact(unit))
    ∧ spells(artifact(unit), realizes(unit))
    ∧ covers(artifact(unit), factors(denotes(realizes(unit))))
    ∧ sole(artifact(unit), realizes(unit))
unachieved(unit) = ∅ ⇔ achieved(unit)
unachieved ⊨ C-typed ⟨it crosses in C's OWN vocabulary · mechanism-prose ⟨naming · structure ·
    test-quality⟩ ⇒ REFUSE ∵ it descends the principal it was dispatched to spare⟩
locus ⊨ ROUTED ∧ ¬ read ⟨an ADDRESS so the redispatch has one · a citation is substrate, and
    handing the principal substrate is the same defect in smaller pieces⟩
assay ⊨ artifact ⟨the ASSAYER reads the files · the ONE site in the loop where
    substrate-reading is ¬ a descent⟩
assayer ⊥ executor ⟨TWO descriptions, two witnesses : executor holds spec ∧ ¬ holds C ·
    assayer holds C ∧ ¬ holds spec⟩
validate(unit) ≜ unachieved(unit) = ∅ ⟨the principal JUDGES the assay ∧ ¬ re-reads the
    artifact · the READ is delegable · the VERDICT is ¬ delegable ∵ keyed to C, which the
    principal alone amends⟩
validate ⊨ artifact ⟨NEVER r · a summary is a CLAIM ∧ the file is EVIDENCE ·
    an acceptance that read only the return has accepted nothing⟩
validate ⊨ self ⟨¬ delegable · the executor cannot judge its own conformance ∵ it
    holds the spec ∧ ¬ the design⟩
verify ⊥ validate ⟨two checks, two witnesses · neither substitutes ; an executor's
    green suite proves the EXECUTOR's own assertion ∧ nothing about the design⟩
judge(unit) ≜ verify(unit, r) ∧ validate(unit) ⇒ advance(unit) ; ¬ ⇒ r rejected back to
    executor(unit) ∧ state(unit) stays active
    ⟨r lands VERBATIM ≺ any verdict on it · the loss mode is read-reason-discard,
     and it takes everything when a run dies mid-judgement⟩
    ⟨fan-in is as order-sensitive as fan-out : ∀ unit dispatched, confirm executor(unit)
     RETURNED · outputs(unit) exist ≠ executor(unit) returned⟩
¬validate(unit) ⇒ redispatch(executor(unit), unachieved(unit)) ⟨the flaw handed down is
    CONCEPTUAL ∧ ¬ a review⟩
cost(validate) < cost(rebuild) ⟨else the gradient points at skipping · the cheapness
    is BOUGHT by conform(anchor) ∴ naming discipline is the verification budget⟩
¬spells ⇒ REFUSE ≺ any behavioural read ⟨the traceability arrow breaks at the cheapest
    place it will ever be visible⟩
¬covers ∧ extra ⇒ a second concept smuggled in unnamed ⇒ amend(C) ∨ REFUSE
¬sole ⇒ duplication ⟨the observable signature of a vision that fragmented⟩
dispatch(P) ≜ ∀ unit ∈ frontier(P) ⟨state(unit) = ready⟩ concurrently ⟨state(unit) := active ∧
    executor(unit) runs spec(unit)⟩ ; pre bound(P) ∧ ⊨ disjoint-outputs
yield ≠ ∅ ⇒ amend(C) @ design ⟨LIVE, ¬ at retirement⟩
impedes(d, unit) ⇔ d standing ⇒ ∄ r : accept(unit)(r)
impedes(d, unit) ⇒ fix(d) ⟨a regression in the path is repaired, ¬ surfaced⟩
¬impedes(d, unit) ⇒ file(d) ∧ ¬fix(d) ⟨a defect BESIDE the path is filed, ¬ chased⟩
cost(file) < cost(fix) ⟨else the gradient points at chasing · the load-bearing law⟩
∃ P : ¬terminal(P) ⇒ ∃! P : bound(P) ⟨WIP = 1 · finish before starting⟩
elect ≜ in-flight ≻ gating ≻ operator-intent ⟨lexicographic⟩
terminal(P) ⇒ retire(P) ⟨obligation ¬ permission · an unretired terminal plan is WIP
    that is not work⟩ ; C persists ⟨plans come ∧ go ABOVE the design⟩
deliver ≜ bind → dispatch(wave) → verify ⟨executor⟩ → assay ⟨assayer, on artifact⟩ →
    validate ⟨self, on the assay⟩ → judge → amend(C) ⇔ yield → advance → retire` as SkillExpression;

export const deliver: Skill = {
  name: 'deliver',
  description: `use this skill to execute a plan and ACCEPT its results — dispatch a wave of units to executors, then validate each landed artifact against the design rather than against the executor's report, and integrate. Reach for it whenever delegated work comes back. Validation is three cheap questions — does the artifact spell its concept's name, does its behaviour cover that concept's factorization exactly, and does anything else already realize it — read off the files themselves, never off a summary. It also carries the conduct of the work: one plan bound at a time, finish before starting, repair what blocks the path and merely file what sits beside it.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [design, plan],
};
