import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

import { design } from '../design/skill.js';
import { note } from '../note/skill.js';
import { plan } from '../plan/skill.js';

// WHERE THE TRUST DEFECT IS CLOSED. Acceptance keyed to a unit's own criteria is a
// closed loop: the author writes the unit, writes its criteria, and checks the return
// against them. Every term comes from one source, so an implementer satisfying the letter
// passes while the design goes unmet. Instructing the principal to "actually verify"
// cannot repair this — verification is a TWO-DESCRIPTION operation, and with one
// description there is no operation to perform, so it degenerates into re-reading the
// claim. The second description is the design, which is why this cell composes it.
//
// The split that matters: the IMPLEMENTER verifies ⟨did I build it per the spec⟩ and the
// PRINCIPAL validates ⟨is this what the design called for⟩, by judging the assay and never
// the artifact or the return. Both are legitimate and neither substitutes. Today only the
// first exists in most loops.
//
// The three validation questions are cheap BY CONSTRUCTION, and that is load-bearing
// rather than convenient: a check costing more than redoing the work is skipped, and
// no instruction survives that gradient. Naming discipline is what buys the cheapness —
// if the artifact spells its concept, two of the three are reading a name.
//
// WHERE THE READ GOES, AND WHY THE VERDICT DOES NOT FOLLOW IT. The artifact read is
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
// implementer holds the spec and not the design, the assayer holds the design and not the
// spec. The artifact read the law demands still happens; it happens at the one site in
// the loop where reading substrate is the work rather than a descent, and what reaches
// the principal is in the only vocabulary the principal can check without descending.

const FORMAL_BLOCK = `C      @ design
c      @ design
anchor @ design
gloss  @ design
factors @ design
denotes @ design
amend  @ design
yield  ≜ what execution established ∧ ¬ derivable from C
P      @ plan
unit   @ plan
wave   @ plan
frontier @ plan
realizes @ plan
advance, bind, close, bound, ready, capacity @ plan
show ⟨C⟩ @ design
show ⟨P⟩ @ plan
accept @ plan ⟨the MECHANICAL half⟩
outputs @ plan
artifact : P → ℘(path) ⟨what landed · the EVIDENCE⟩
r      ≜ an implementer's return
conform @ signify
implementer : P ⇀ agent
self   @ design
capture @ note
spells : path × anchor → 𝔹 ⟨identifiers · path · public surface bear the sign⟩
covers : path × ℘(C) → 𝔹 ⟨observable behaviour ≅ the factorization · nothing missing
         ∧ nothing extra⟩
sole   : path × anchor → 𝔹 ⟨∄ other artifact realizing the same concept⟩
verify : P × return → 𝔹 ⟨the IMPLEMENTER's · built-it-right, against spec · ↾ accept(unit), ¬ gate⟩
gate   ≜ the project's whole check ⟨every suite · typecheck · build : what a green main demands⟩
integrate(unit) ≜ merge artifact(unit) into main ⟨pre gate green on the MERGED tree · a branch's
    green says nothing about main after other landings⟩
integrator : P ⇀ agent ⟨one per P · runs gate ∧ integrate ∧ carries the state moves self decided, ¬ decides them⟩
validate : P → 𝔹 ⟨the PRINCIPAL's · built-the-right-thing, against C⟩
assay  : artifact → ℘(C) ⟨which concepts the artifact ACTUALLY realizes · the REVERSE of plan⟩
assayer : unit ⇀ agent ⟨role = assayer · holds C ∧ ¬ holds spec(unit)⟩
achieved : unit → 𝔹 ⟨the three questions, answered against the assay⟩
unachieved : unit → ℘(⟨c, uncovered-factor, locus⟩) ⟨what crosses UPWARD⟩
defect ≜ ⟨symptom, locus, provenance⟩
impedes : defect × P → 𝔹
cost   : act → effort
file(d) ≜ capture(d) ⟨filed by the party that met d · its topic names the unit as \`u of plan p\` · beside the path ∴ it blocks nothing⟩
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
assayer ⊥ implementer ⟨TWO descriptions, two witnesses : implementer holds spec ∧ ¬ holds C ·
    assayer holds C ∧ ¬ holds spec⟩
validate(unit) ≜ unachieved(unit) = ∅ ⟨self JUDGES the assay ∧ reads neither the artifact nor r ·
    the READ is delegable · the VERDICT is ¬ delegable ∵ keyed to C, which self alone amends⟩
validate ⊨ assay ⟨NEVER r · a summary is a CLAIM ∧ the file is EVIDENCE, read by the assayer ·
    an acceptance that read only the return has accepted nothing⟩
validate ⊨ self ⟨¬ delegable · the implementer cannot judge its own conformance ∵ it
    holds the spec ∧ ¬ the design⟩
verify ⊥ validate ⟨two checks, two witnesses · neither substitutes ; an implementer's
    green suite proves the IMPLEMENTER's own assertion ∧ nothing about the design⟩
judge(unit) ≜ gate green ⟨the integrator's result⟩ ∧ validate(unit) ⇒ advance(unit) ⟨the acceptance ·
    self decides · the integrator records⟩ ; ¬ ⇒ r rejected back to implementer(unit) ∧ ¬advance(unit)
    ⟨r lands VERBATIM with the integrator ≺ any verdict on it · the loss mode is
     read-reason-discard, and it takes everything when a run dies mid-judgement⟩
    ⟨fan-in is as order-sensitive as fan-out : ∀ unit dispatched, the integrator confirms
     implementer(unit) RETURNED · outputs(unit) exist ≠ implementer(unit) returned⟩
¬validate(unit) ⇒ redispatch(implementer(unit), unachieved(unit)) ⟨the flaw handed down is
    CONCEPTUAL ∧ ¬ a review · implementer(unit) is the SAME agent that built it while it has
    capacity ; a cold successor re-reads what it built⟩
gate ⊨ integrate ∧ ¬ verify ⟨the whole check runs ONCE per landing, by the integrator · an
    implementer ∨ assayer re-running it proves nothing new on nearly the same tree⟩
integrate ⊥ judge ⟨a merge is DURABILITY ∧ ¬ acceptance · acceptance is advance(unit) after the
    assay⟩ ∴ integrate ≺ assay admitted ∧ the next ready unit dispatches while the assay runs
    ⟨ready waits on satisfied deps ∴ ¬ a dependent builds on an unaccepted unit · the assay reads
     artifact(unit) at its landing commit ∵ main moves under a pipelined assay⟩
integrator ⊨ ¬ validate ⟨it carries a verdict ∧ ¬ reaches one⟩
integrator ≠ self ⟨self decides the state moves ∧ dispatches · the integrator gates, merges,
    commits ∧ records them · self runs no check, makes no commit, reads no artifact nor r⟩
self reads ⟨show ⟨P⟩ · the assay · the integrator's gate result⟩ ⟨the plan VIEW : units by concept, frontier, drift, owed rulings · never a unit's spec, which the planner reads ∧ revises · plan state comes from show, never from a delegate's return⟩
cost(validate) < cost(rebuild) ⟨else the gradient points at skipping · the cheapness
    is BOUGHT by conform(anchor) ∴ naming discipline is the verification budget⟩
¬spells ⇒ REFUSE ≺ any behavioural read ⟨the traceability arrow breaks at the cheapest
    place it will ever be visible⟩
¬covers ∧ extra ⇒ a second concept smuggled in unnamed ⇒ amend(C) ∨ REFUSE
¬sole ⇒ duplication ⟨the observable signature of a vision that fragmented⟩
dispatch(P) ≜ ∀ unit ∈ frontier(P) ⟨ready(unit)⟩ concurrently ⟨self dispatches · the integrator
    records advance(unit) ∧ implementer(unit) runs spec(unit)⟩ ; pre bound(P) ∧ ⊨ disjoint-outputs
∀ c : ∄ unit ⟨realizes(unit) = anchor(c)⟩ ⇒ SURFACE ⟨a concept nothing builds is design agreed ∧
    unbuilt · the reverse orphan is plan's⟩
impedes(d, unit) ⇔ d standing ⇒ ∄ r : accept(unit)(r)
finding ∨ d ⊨ capture ⟨a note by the party that met it : implementer ∨ assayer ∨ integrator ∨ self · the operator's steer by self · it reaches self as a note, ¬ a return⟩ ; when a finding enters C @ design ⟨the law of yield ≠ ∅⟩
impedes(d, unit) ⇒ dispatch fix(d) to an implementer ⟨a regression in the path is repaired, ¬ surfaced · self makes no fix⟩
¬impedes(d, unit) ⇒ file(d) ∧ ¬fix(d) ⟨a defect BESIDE the path is filed, ¬ chased⟩
cost(file) < cost(fix) ⟨else the gradient points at chasing · the load-bearing law⟩
∃ P : ¬terminal(P) ⇒ ∃ P : bound(P) ⟨WIP = 1, held by bind : self decides it, the integrator
    records it, and it returns the plan bound before · finish before starting⟩
elect ≜ in-flight ≻ gating ≻ operator-intent ⟨lexicographic⟩
terminal(P) ⇒ close(P) ⟨obligation ¬ permission : self decides it, the integrator records it · an
    unclosed terminal plan is WIP that is not work · a closed plan stays readable⟩ ; C persists ⟨plans come ∧ go ABOVE the design⟩
deliver ≜ bind ⟨self decides · integrator records⟩ → dispatch(wave) ⟨self⟩ → verify ⟨implementer⟩ →
    integrate ⟨integrator, on gate⟩ → assay ⟨assayer, on artifact⟩ → validate ⟨self, on the assay⟩ →
    judge ⟨self, on gate ∧ validate⟩ → advance → close ⟨self decides · integrator records⟩` as SkillExpression;

export const deliver: Skill = {
  name: 'deliver',
  description: `use this skill to execute a plan and ACCEPT its results — dispatch a wave of units to implementers, have the integrator integrate each landing into main once the project's whole check is green, and validate each landed artifact against the design through the assay rather than against the implementer's report; a merge is durability and acceptance comes after the assay. Reach for it whenever delegated work comes back. Validation is three cheap questions — does the artifact spell its concept's name, does its behaviour cover that concept's factorization exactly, and does anything else already realize it — answered by the assayer off the files themselves, never off a summary. It also carries the conduct of the work: one plan bound at a time, finish before starting, have what blocks the path repaired by an implementer and merely file what sits beside it, send a gap back to the agent that built it, and let what execution or the operator teaches about the design reach the architect as a note, entering the design when the design skill's law says.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [design, plan, note],
  preamble: primePrinciple,
};
