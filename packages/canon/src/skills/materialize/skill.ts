import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

// Composes nothing. Each skill this one relates to is cited inside its block, at the
// term that borrows it (`@ <skill>`); composition is the caller's: an agent pipes these
// skills in whatever order the work wants.

export const materialize: Skill = {
  name: 'materialize',
  description: `Write a set of named concepts out as the text a model reads — each primitive concept once, by its term with its precising definition, and each other concept by the terms of the concepts it is built from, in a form chosen before writing, separate files or one document. Reach for it once concepts have their Cratylic names and must become context.`,
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
cite-by-ref ≜ composite stores factor-terms
CSF ≜ bipartite-normal-form: primitive↦⟨term,precising-definition⟩ by value ; composite↦⟨term,factor-terms⟩ by reference
realize ≜ dispatch artifact-form per kind through a named strategy s
loud-refusal ≜ s unnamed ∨ ρ_s not total over live kinds ⇒ ⊥

F(m) ≜ min_≺ fac(m)
CSF(c) ≜ ( term(c) , precising-definition(c) ) ,  prim(c) ∧ precising-definition(c) ≠ ∅
CSF(c) ≜ term(c)                                ,  prim(c) ∧ precising-definition(c) = ∅
CSF(c) ≜ ( term(c) , { term(p) | p ∈ F(c) } ) ,  ¬prim(c)
realize(k) fills factorization(k) ≜ CSF(k) ; meaning(k), term(k) preserved
term(k) = ⊥ ⇒ realize(k) = ⊥

CSF(c) minimal @ signify
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
