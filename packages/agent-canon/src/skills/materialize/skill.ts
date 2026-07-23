import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from '../conceptualize/skill.js';
import { exemplify } from '../exemplify/skill.js';
import { signify } from '../signify/skill.js';

export const materialize: Skill = {
  name: 'materialize',
  description: `use this skill to realize a concept lattice as artifacts — select each concept's canonical factorization \`F\`, emit the bipartite normal form \`CSF\` (a primitive by value as ⟨anchor, gloss⟩, a composite by reference as ⟨anchor, factor-anchors⟩), then realize under an explicitly named strategy whose kind-consumption table ρ refuses loudly when unnamed; stage 3 of exemplify, independently invocable.`,
  formalBlock: `C ≜ concept lattice
prim : C → 𝔹
fac : C → ℘(℘(C))
≺ ≜ shortlex order over factorizations
anchor : C → sign ∪ {⊥}
gloss : C → text
kind : C → K
K ≜ the closed kind set

concept-record   ≜ record(gloss, anchor, factorization)
dfp(g) ≜ densest-faithful-point(g)
cite-by-ref ≜ composite stores factor-anchors ∧ ¬restate factor-content
CSF ≜ bipartite-normal-form: primitive↦⟨anchor,gloss⟩ by value ; composite↦⟨anchor,factor-anchors⟩ by reference
realize ≜ dispatch artifact-form per kind through a named strategy s
loud-refusal ≜ s unnamed ∨ ρ_s not total over live kinds ⇒ ⊥

F(m) ≜ min_≺ fac(m)
CSF(c) ≜ ( anchor(c) , dfp(gloss(c)) )              ,  prim(c)
CSF(c) ≜ ( anchor(c) , { anchor(p) | p ∈ F(c) } ) ,  ¬prim(c)
realize(k) fills factorization(k) ≜ CSF(k) ; gloss(k), anchor(k) preserved
anchor(k) = ⊥ ⇒ realize(k) = ⊥

prose(c) ≜ render(CSF(c))
CSF(c) ≽ prose(c)

Φ ≜ { (anchor(c), kind(c), CSF(c)) | c ∈ C }
S ≜ { file, document, … }
σ : Φ × S → artifacts
ρ_s : K → form_s
σ well-defined ⇔ ρ_s total over kinds(Φ)
s unnamed ∨ s ∉ S ⇒ ⊥
∃ k ∈ kinds(Φ) : k ∉ dom(ρ_s) ⇒ ⊥

σ(Φ, file) ≜ { \${OUTPUT_DIR}/anchor(c).md | (anchor(c), k, x) ∈ Φ }
ρ_file(k) ≜ front-matter (kind: k, description) + body
∀ f ∈ σ(Φ, file) : ∃! (a, k, x) ∈ Φ : content(f) = x

σ(Φ, document) ≜ one recomposed document
ρ_document(k) ≜ rhetorical role:
    concept        ↦ definition
    process        ↦ ordered steps
    principle      ↦ constraint
    structure      ↦ table
    classification ↦ membership test
    utility        ↦ instrument` as SkillExpression,
  composition: () => [exemplify, signify, conceptualize],
};
