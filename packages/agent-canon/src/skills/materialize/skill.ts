import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from '../conceptualize/skill.js';
import { exemplify } from '../exemplify/skill.js';
import { signify } from '../signify/skill.js';

export const materialize: Skill = {
  name: 'materialize',
  description: `use this skill to realize a concept lattice as artifacts — select each concept's canonical factorization \`F_R\`, emit the bipartite normal form \`CSF_R\` (a primitive by value as ⟨anchor, gloss⟩, a composite by reference as ⟨anchor, factor-anchors⟩), then realize under an explicitly named strategy whose kind-consumption table ρ refuses loudly when unnamed; stage 3 of exemplify, independently invocable.`,
  formalBlock: `C_R ≜ reader R's concept lattice
prim_R : C_R → 𝔹
fac_R : C_R → ℘(℘(C_R))
≺ ≜ shortlex order over factorizations
anchor : C_R → sign ∪ {⊥}
gloss : C_R → text
kind : C_R → K
K ≜ the closed kind set

concept-contract ≜ record(gloss, anchor, factorization)
dfp(g) ≜ densest-faithful-point(g)
cite-by-ref ≜ composite stores factor-anchors ∧ ¬restate factor-content
CSF ≜ bipartite-normal-form: primitive↦⟨anchor,gloss⟩ by value ; composite↦⟨anchor,factor-anchors⟩ by reference
realize ≜ dispatch artifact-form per kind through a named strategy s
loud-refusal ≜ s unnamed ∨ ρ_s not total over live kinds ⇒ ⊥

F_R(m) ≜ min_≺ fac_R(m)
CSF_R(c) ≜ ( anchor(c) , dfp(gloss(c)) )              ,  prim_R(c)
CSF_R(c) ≜ ( anchor(c) , { anchor(p) | p ∈ F_R(c) } ) ,  ¬prim_R(c)
realize(k) fills factorization(k) ≜ CSF_R(k) ; gloss(k), anchor(k) preserved
anchor(k) = ⊥ ⇒ realize(k) = ⊥

prose(c) ≜ render(CSF_R(c), R)
CSF_R(c) ≽ prose(c)

Φ ≜ { (anchor(c), kind(c), CSF_R(c)) | c ∈ C_R }
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
