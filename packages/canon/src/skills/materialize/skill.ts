import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This skill used to declare `composition: () => [exemplify, signify, conceptualize]` and import those
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

export const materialize: Skill = {
  name: 'materialize',
  description: `Write a set of named concepts out as the text a model reads — each primitive concept once, by its term with its precising definition, and each other concept by the terms of the concepts it is built from, never restating them, in a form chosen before writing, separate files or one document. Reach for it once concepts have their Cratylic names and must become context.`,
  formalBlock: `C ≜ concept lattice
prim : C → 𝔹
fac : C → ℘(℘(C))
≺ ≜ shortlex order over factorizations
term : C → Names ∪ {⊥}
meaning : C → text
kind : C → Kinds
Kinds ≜ the closed kind set

concept-record   ≜ ⟨meaning, term, factorization⟩
precising-definition @ signify
cite-by-ref ≜ composite stores factor-terms ∧ ¬restate factor-content
CSF ≜ bipartite-normal-form: primitive↦⟨term,precising-definition⟩ by value ; composite↦⟨term,factor-terms⟩ by reference
realize ≜ dispatch artifact-form per kind through a named strategy s
loud-refusal ≜ s unnamed ∨ ρ_s not total over live kinds ⇒ ⊥

F(m) ≜ min_≺ fac(m)
CSF(c) ≜ ( term(c) , precising-definition(c) ) ,  prim(c) ∧ precising-definition(c) ≠ ∅
CSF(c) ≜ term(c)                                ,  prim(c) ∧ precising-definition(c) = ∅
CSF(c) ≜ ( term(c) , { term(p) | p ∈ F(c) } ) ,  ¬prim(c)
realize(k) fills factorization(k) ≜ CSF(k) ; meaning(k), term(k) preserved
term(k) = ⊥ ⇒ realize(k) = ⊥

CSF(c) never restates what term(c) carries ⟨minimal @ signify⟩
prose(c) ≜ render(CSF(c))
CSF(c) ≽ prose(c)

Φ ≜ { (term(c), kind(c), CSF(c)) | c ∈ C }
S ≜ { file, document, … }
σ : Φ × S → artifacts
ρ_s : Kinds → form_s
σ well-defined ⇔ ρ_s total over kinds(Φ)
s unnamed ∨ s ∉ S ⇒ ⊥
∃ k ∈ kinds(Φ) : k ∉ dom(ρ_s) ⇒ ⊥

σ(Φ, file) ≜ { \${OUTPUT_DIR}/term(c).md | (term(c), k, x) ∈ Φ }
ρ_file(k) ≜ front-matter (kind: k, description) + body
∀ f ∈ σ(Φ, file) : ∃! (term(c), k, x) ∈ Φ : content(f) = x

σ(Φ, document) ≜ one recomposed document
ρ_document(k) ≜ rhetorical role:
    concept        ↦ definition
    process        ↦ ordered steps
    principle      ↦ constraint
    structure      ↦ table
    classification ↦ membership test
    utility        ↦ instrument` as SkillExpression,
  composition: () => [],
  preamble: primePrinciple,
};
