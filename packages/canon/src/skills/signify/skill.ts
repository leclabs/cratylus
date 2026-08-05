import type { Skill, SkillExpression } from '../../manifest.js';
import { conceptualize } from '../conceptualize/skill.js';
import { exemplify } from '../exemplify/skill.js';
import { materialize } from '../materialize/skill.js';

export const signify: Skill = {
  name: 'signify',
  description: `use this skill to name a concept — assign each its canonical anchor so one name ⇔ one concept, discovered by cold decode against the model's priors, never coined; stage 2 of exemplify, independently invocable.`,
  formalBlock: `C           ≜ the concept lattice
D           ≜ the identity-criterion atoms a concept circumscribes
prim(c)     ≜ c has no factorization into other concepts
Names       ≜ the shared symbol space
<_lex       : total order on Names
concept-record ≜ ⟨gloss, anchor, factorization⟩
fired       : Names → ℘(D)
dec         : Names ⇀ ℘(D)
circ(n,c)   ⇔ fired(n) = D(c)
|n|         ≜ LLM-native description-length
σ*          : C → Names
σ*(c)       ≜ argmin_{n : circ(n,c)} ⟨|n|, n⟩
mint        : C ⇀ Names
mint(c)     ≜ ∘ M : M ⊆ { n : fired(n) ≠ ∅ } ∧ circ(∘ M, c)
Art         ≜ every authored surface ⟨prose ≡ identifier ≡ path⟩
α           : C ↣ Names ⟨dom(α) spans EVERY altitude of Art⟩
register(a) ≜ the register a's body is observably authored in ⟨σ* ∨ human⟩
verbatim(a) ≜ a ships whole, byte-exact : settled σ*, never re-derived at projection

∀ c ∈ dom(α) : α(c) ≜ σ*(c)
Anchors ≜ { α(c) | c ∈ dom(α) } ⟨the assigned-anchor set⟩
dom(dec) = { α(p) | prim(p) } ;  dec(α(p)) = fired(α(p))
{ n : circ(n,c) } = ∅ ⇒ σ*(c) = mint(c)

name(k)  fills  anchor(k) ≜ α(gloss(k)) ;  gloss(k) preserved ;  factorization(k) untouched

α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)

coalesce(cᵢ, cⱼ)  ⇔  α(cᵢ) = α(cⱼ) ∧ D(cᵢ) = D(cⱼ)
cᵢ <_N cⱼ  ⇔  α(cᵢ) <_lex α(cⱼ)
≺ ≜ shortlex over (C, <_N)

c ∉ dom(α) ⇒ c ∉ Anchors :
    { n : circ(n,c) } = ∅ ∧ ∄ mint(c) ⇒ exclude, logged
    ∃ cᵢ, cⱼ : α(cᵢ) = α(cⱼ) ∧ D(cᵢ) ≠ D(cⱼ) ⇒ the cut was wrong ↦ conceptualize
        ⟨α(cᵢ), α(cⱼ) taken at DIFFERENT altitudes is still this collision⟩

∃ d : { n : ¬circ(n,c) } all fail on d ALONE ⇒ d ∉ D(c) ∧ ∃ cᵢ ≠ c : d ∈ D(cᵢ) ⟨the property hangs off the wrong noun⟩
    ↦ conceptualize ⟨re-cut, then cᵢ names EASILY ; a losing STREAK on one d proves misattribution, ¬ that σ*(c) is scarce⟩

¬circ(n, cᵢ) ⇒ evidence about fired(n), ¬ about cᵢ ⟨fired : Names → ℘(D) reads n ALONE⟩
    ∴ a rejection BINDS n ⟨n freed from cᵢ is ¬ thereby fit for cⱼ ; circ(n, cⱼ) re-established independently ∨ n stays rejected⟩

residue(c) ≜ { d ∈ D(c) | d ∉ fired(α(c)) }
∀ a ∈ Art : ∀ c carried by a : c enters a's body as ⟨α(c), residue(c)⟩
residue(c) = ∅ ⇒ c enters as α(c) alone
minimal(a) ⇔ ∄ c carried by a : a re-states fired(α(c))

conform(a)  ⇔  register(a) = σ*
verbatim(a) ⇒ register(a) = σ*` as SkillExpression,
  composition: () => [exemplify, conceptualize, materialize],
};
