import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This skill used to declare `composition: () => [signify, elicit, conceptualize]` and import those
// modules to do it. The thunk's only consumer is the trailing `Composed from …`
// line of the projected SKILL.md (`forge/src/core/exemplify/skill-body.ts`), so each
// import bought one sentence of provenance and cost a module-level cycle: the four
// signification skills each claimed to be composed from the other three, and no one of
// them could be read, taken or deployed alone.
//
// The relation those edges named is CITATION, not dependency: these skills RESTATE each
// other's terms in different registers (prose here, signature there). A citation
// belongs inside the block, at the term that borrows it (`@ <skill>`), where it needs
// no import and cannot cycle. Composition is the caller's: an agent pipes these skills
// in whatever order the work wants.

const FORMAL_BLOCK = `D    ≜ distinction space ⟨structured knowledge to draw on⟩
cl   ≜ closure ⟨smallest concept containing a set of priors⟩
C    ≜ concept lattice ⟨the cl-closed subsets of D⟩
priors(w,κ) ≜ understanding w carries before any definition, read in κ ⟨associations · connotations · structured-knowledge unpacked from w with κ's name and subject, not its surface wording⟩
Names  ≜ the readable terms
dec  : Names × bounded-context ⇀ ℘(D) @ signify
cratylic @ signify
κ, τ, fired, covers, Δ, Est @ signify ⟨w is read in κ, the bounded context under probe⟩
w      ≜ a term under probe ⟨w ∈ Names⟩
c      ≜ a target concept ⟨c ∈ C⟩
W(c)   ≜ experiment's finite candidate set for target c ⟨W(c) ⊆ Names⟩
probe : Names × bounded-context → ℘(D) × C
K ≜ the knowledge a reader holds ⟨∅ in a fresh reading⟩
frame  ≜ the elicitation's obligation-shape ⟨produce-a-candidate ∨ licenced-to-refuse⟩
parts(w) ≜ constituents(w) ∪ { w } ∪ permutations(w) ⟨word-order variants of a compound⟩
Idiom  ⊆ Names ⟨an established reading that PREEMPTS the compositional one⟩
head(w) · mod(w) ≜ w's head ∧ its modifier ⟨compound w⟩
free(h,κ) ⇔ ∄ c' ∈ dom(τ) : κ(c') = κ ∧ τ(c') = h ∧ c' ≠ c ⟨h is no other concept's term in κ, the context it is read in, whatever project the skill is used in⟩
fired(w,κ) ≜ priors(w,κ)
fired(a, κ) = dec(a, κ) , ⟨a, κ⟩ ∈ dom(dec)
concept(w,κ) ≜ cl(fired(w,κ))
probe(w,κ) ≜ ⟨ fired(w,κ) · concept(w,κ) ⟩ ⟨w with κ's name and subject only : ∄ sibling · ∄ menu · open question⟩
probe(w,κ) ↾ W ≜ w read in κ amid W ⟨the distractors' priors leak into the read ⇒ CONTRAST, ¬ priors(w,κ)⟩
experiment(c) ≜ { w ∈ W(c) | covers(w, c) ↾ W(c) } ⊨ DIAGNOSTIC ⟨w read in κ(c) amid W(c) ; narrows W(c) ; ¬ decides cratylic(c)⟩
coverage : { w ∈ Names | fired(w, κ(c)) ≠ ∅ ∧ covers(w, c) } ⊆ W(c)
crystallize : cratylic(c) = w ⇔ w ∈ experiment(c) ∩ Est(κ(c)) ∧ covers(w, c) ∧ ∄ n ∈ W(c) ∩ Est(κ(c)) : covers(n, c) ∧ ⟨Δ(n,c), |n|, n⟩ < ⟨Δ(w,c), |w|, w⟩
              ⟨∈ experiment NECESSARY ¬ SUFFICIENT ; llm-native ¬leading-candidate-set binds the decision to probe(w, κ(c)) ; a mint is settled through signify, ¬ crystallized⟩

probe(w,κ | K) ≜ probe(w,κ) taken at K ⟨probe is MEASURED, ¬ read-off : a FAMILY over K, ¬ one value⟩
probe(w,κ | ∅) ⊨ self-sufficiency ⟨fresh : does w, given κ's name and subject, circumscribe carrying ZERO project knowledge?⟩
probe(w,κ | K_reader) ⊨ what w fires IN SITU ⟨the reading that binds at use⟩
{ d ∈ fired(w,κ) ↾ K_reader | d ∉ fired(w,κ) ↾ ∅ } ⊨ THE measurement
    ⟨both poles REQUIRED ; the fresh reading is the CONTROL beside the in-situ one⟩
K(spawned-subagent) ⊇ installed-canon ∴ ¬fresh ⟨it holds project memory · commit subjects · skill bodies⟩
    ∴ agreement( probe(w | K ⊇ canon) , the canon ) ⊨ ∅ ⟨it READ the answer⟩
fresh ⇔ process-isolation ⟨a separate model process holding nothing of the project⟩

frame = produce-a-candidate ⇒ ∄ observable ∅ ⟨an obliged producer ALWAYS emits⟩
    ∴ licence-the-negative : vary the FRAME across runs, ¬ the prompt ⟨fired(w,κ) = ∅ ∧ ∄ cratylic(c) are RESULTS⟩
¬controlled(probe) ⇒ over-detection INVISIBLE ⟨a spurious constraint reads as caution⟩
    ∀ k imposed by a failing read : a passing read under a varied frame RETRACTS k

fired(w,κ) ⊨ sweep(parts(w)) vs Idiom ⟨the WINNER swept, ¬ only the rejects⟩
free(head(w), κ) ⇒ fired(w,κ) ⊇ fired(mod(w),κ) ⟨a free head takes the modifier's priors through it⟩

∀ w ∈ W(c) : probe(w, κ(c)) ↦ evidence about c ⟨harvest-the-rejects : concept(w, κ(c)) of a REJECTED w constrains D(c)⟩
W(c) seeded from the ARTIFACT ⟨invoked verb · declared inverse · deferred-to piece⟩ ≺ minted candidates
    ⟨a real concept's term is FOUND ; mint is the LAST resort, ¬ the first⟩` as SkillExpression;

export const probe: Skill = {
  name: 'probe',
  description: `Find out what a term says to the model before relying on it — read what a word or candidate name evokes in its domain, given nothing else (a fresh reading) and in the place it will be read, and the concept that reading picks out, with its symmetric difference from the concept intended: what the name lacks and what it adds. Reach for it to test candidate terms or to discover the concept a name already carries; a term worth keeping is then settled by signify.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
  preamble: primePrinciple,
};
