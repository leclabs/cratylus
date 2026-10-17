import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This cell used to declare `composition: () => [signify, elicit, conceptualize]` and import those
// modules to do it. The thunk's only consumer is the trailing `Composed from …`
// line of the projected SKILL.md (`forge/src/core/exemplify/skill-cell.ts`), so each
// import bought one sentence of provenance and cost a module-level cycle: the four
// signification cells each claimed to be composed from the other three, and no one of
// them could be read, taken or deployed alone.
//
// The relation those edges named is CITATION, not dependency: `symbol-altitude`'s
// LEDGER records these cells RESTATING each other's signs in different registers
// (prose here, signature there), which is what a REFERENCE row means. A citation
// belongs inside the block, at the sign that borrows it (`@ <cell>`), where it needs
// no import and cannot cycle. Composition is the caller's: an agent pipes these cells
// in whatever order the work wants.

const FORMAL_BLOCK = `D    ≜ distinction space ⟨structured knowledge to draw on⟩
cl   ≜ closure ⟨smallest concept containing a set of priors⟩
C    ≜ concept lattice ⟨the cl-closed subsets of D⟩
priors(w,κ) ≜ understanding w carries before any definition, read in κ ⟨associations · connotations · structured-knowledge unpacked from w with κ's name and subject, not its surface wording⟩
Names  ≜ the readable signifiers
dec  : Names ⇀ ℘(D) @ signify
σ*     @ signify
κ, fired @ signify ⟨w is read in κ, the bounded context under probe⟩
w      ≜ a signifier under probe ⟨w ∈ Names⟩
c      ≜ a target concept ⟨c ∈ C⟩
W(c)   ≜ experiment's finite candidate set for target c ⟨W(c) ⊆ Names⟩
probe : Names × bounded-context → ℘(D) × C
K @ cold-decode-oracle
frame  ≜ the elicitation's obligation-shape ⟨produce-a-candidate ∨ licenced-to-refuse⟩
parts(w) ≜ constituents(w) ∪ { w } ∪ permutations(w) ⟨word-order variants of a compound⟩
Idiom  ⊆ Names ⟨an established reading that PREEMPTS the compositional one⟩
head(w) · mod(w) ≜ w's head ∧ its modifier ⟨compound w⟩
free(h)  ⇔ h alone is unbound in the corpus
fired(w,κ) ≜ priors(w,κ)
fired(a, κ) = dec(a) , a ∈ dom(dec)
concept(w,κ) ≜ cl(fired(w,κ))
probe(w,κ) ≜ ⟨ fired(w,κ) · concept(w,κ) ⟩ ⟨w with κ's name and subject only : ∄ sibling · ∄ menu · open question⟩
probe(w,κ) ↾ W ≜ w read in κ amid W ⟨the distractors' priors leak into the read ⇒ CONTRAST, ¬ priors(w,κ)⟩
experiment(c) ≜ { w ∈ W(c) | concept(w, κ(c)) ↾ W(c) = c } ⊨ DIAGNOSTIC ⟨narrows W(c) ; ¬ decides σ*⟩
coverage : { w ∈ Names | fired(w, κ(c)) ≠ ∅ ∧ concept(w, κ(c)) = c } ⊆ W(c)
crystallize : σ*(c) = w ⇔ w ∈ experiment(c) ∧ concept(w, κ(c)) = c
              ⟨∈ experiment NECESSARY ¬ SUFFICIENT ; llm-native ¬leading-candidate-set binds the decision to probe(w, κ(c))⟩

probe(w,κ | K) ≜ probe(w,κ) taken at K ⟨probe is MEASURED, ¬ read-off : a FAMILY over K, ¬ one value⟩
probe(w,κ | ∅) ⊨ self-sufficiency ⟨cold : does w, given κ's name and subject, circumscribe carrying ZERO corpus?⟩
probe(w,κ | K_reader) ⊨ what w fires IN SITU ⟨the reading that binds at use⟩
{ d ∈ fired(w,κ) ↾ K_reader | d ∉ fired(w,κ) ↾ ∅ } ⊨ THE measurement
    ⟨both poles REQUIRED ; a cold read is a CONTROL, never a substitute for the in-situ one⟩
K(spawned-subagent) ⊇ deployed-corpus ∴ ¬cold ⟨it holds project memory · commit subjects · skill bodies⟩
    ∴ agreement( probe(w | K ⊇ corpus) , the corpus ) ⊨ ∅ ⟨it READ the answer⟩
cold ⇔ process-isolation ⟨¬ a fresh subagent ; ¬ a stripped prompt⟩

frame = produce-a-candidate ⇒ ∄ observable ∅ ⟨an obliged producer ALWAYS emits⟩
    ∴ licence-the-negative : vary the FRAME across runs, ¬ the prompt ⟨fired(w,κ) = ∅ ∧ ∄ σ*(c) are RESULTS⟩
¬controlled(probe) ⇒ over-detection INVISIBLE ⟨a spurious constraint reads as caution⟩
    ∀ k imposed by a failing read : a passing read under a varied frame RETRACTS k

fired(w,κ) ⊨ sweep(parts(w)) vs Idiom ⟨the WINNER swept, ¬ only the rejects⟩
free(head(w)) ⇒ fired(w,κ) ⊇ fired(mod(w),κ) ⟨an unbound head takes the modifier's priors through it⟩

∀ w ∈ W(c) : probe(w, κ(c)) ↦ evidence about c ⟨harvest-the-rejects : concept(w, κ(c)) of a REJECTED w constrains D(c)⟩
W(c) seeded from the ARTIFACT ⟨invoked verb · declared inverse · deferred-to cell⟩ ≺ minted candidates
    ⟨a real concept's sign is FOUND ; mint is the LAST resort, ¬ the first⟩` as SkillExpression;

export const probe: Skill = {
  name: 'probe',
  description: `use this skill to probe a signifier — read out the priors a word, phrase, or candidate name fires in the reader, read in its bounded context (\`fired\`, signify's decoder \`dec\` generalized off its assigned anchors) and the concept they circumscribe; the forward, no-commit inverse of signify, for discovering the concept latent in a name or experimenting with candidate anchors before committing — a keeper crystallizes through signify.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
  preamble: primePrinciple,
};
