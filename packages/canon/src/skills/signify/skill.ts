import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This cell used to declare `composition: () => [exemplify, conceptualize, materialize]` and import those
// modules to do it. The thunk's only consumer is the trailing `Composed from …`
// line of the projected SKILL.md (`forge/src/core/exemplify/skill-cell.ts`), so each
// import bought one sentence of provenance and cost a module-level cycle: the four
// signification cells each claimed to be composed from the other three, and no one of
// them could be read, taken or deployed alone.
//
// The relation those edges named is CITATION, not dependency: these cells RESTATE each
// other's signs in different registers (prose here, signature there). A citation
// belongs inside the block, at the sign that borrows it (`@ <cell>`), where it needs
// no import and cannot cycle. Composition is the caller's: an agent pipes these cells
// in whatever order the work wants.

export const signify: Skill = {
  name: 'signify',
  description: `use this skill to name a concept — assign each its canonical anchor so one name ⇔ one concept within its bounded context, discovered by cold decode against the model's priors, never coined, for the corpus's core agent dimension names and values alone; stage 2 of exemplify, independently invocable.`,
  formalBlock: `C           ≜ the concept lattice
D           ≜ the identity-criterion atoms a concept circumscribes
prim(c)     ≜ c has no factorization into other concepts
Names       ≜ the shared symbol space
<_lex       : total order on Names
concept-record ≜ ⟨gloss, anchor, factorization⟩
κ           : C → bounded-context ⟨the context c is read in · part of its sign's address⟩
fired       : Names × bounded-context → ℘(D) ⟨fired(n, κ) : what n invokes read in κ⟩
dec         : Names × bounded-context ⇀ ℘(D)
circ(n,c)   ⇔ fired(n, κ(c)) = D(c)
|n|         ≜ LLM-native description-length
residue(n,c) ≜ residue @ workflow ⟨c named n · n read in κ(c)⟩
σ*          : C → Names
σ*(c)       ≜ argmin_{n} ⟨residue(n,c), |n|, n⟩ ⟨the smallest residue in κ(c) · |n| then n break a tie⟩
mint        : C ⇀ Names
mint(c)     ≜ ∘ M : M ⊆ { n : fired(n, κ(c)) ≠ ∅ } ∧ circ(∘ M, c)
Art         ≜ the corpus's own authored surfaces ⟨prose ≡ identifier ≡ path⟩
α           : C ↣ Names ⟨injective within each κ, ¬ across · dom(α) ≜ the concepts the corpus's core agent dimension names and values name · every other term is the industry's own, and no consumer surface is held to α⟩
register(a) ≜ the register a's body is observably authored in ⟨σ* ∨ human⟩
verbatim(a) ≜ a ships whole, byte-exact : settled σ*, never re-derived at projection

∀ c ∈ dom(α) : α(c) ≜ σ*(c)
Anchors ≜ { ⟨α(c), κ(c)⟩ | c ∈ dom(α) } ⟨the assigned-anchor set, each anchor with its context⟩
dom(dec) = { ⟨α(p), κ(p)⟩ | prim(p) } ;  dec(α(p), κ(p)) = fired(α(p), κ(p))
{ n : circ(n,c) } = ∅ ⇒ σ*(c) = mint(c)

name(k)  fills  anchor(k) ≜ α(gloss(k)) ;  gloss(k) preserved ;  factorization(k) untouched

α(cᵢ) = α(cⱼ) ∧ κ(cᵢ) = κ(cⱼ) ⇒ D(cᵢ) = D(cⱼ)

coalesce(cᵢ, cⱼ)  ⇔  α(cᵢ) = α(cⱼ) ∧ κ(cᵢ) = κ(cⱼ) ∧ D(cᵢ) = D(cⱼ)
cᵢ <_N cⱼ  ⇔  α(cᵢ) <_lex α(cⱼ) ∨ (α(cᵢ) = α(cⱼ) ∧ κ(cᵢ) <_lex κ(cⱼ)) ⟨a tie on the anchor broken by context name⟩
≺ ≜ shortlex over (C, <_N)

c ∉ dom(α) ⇒ ∄ n : ⟨n, κ(c)⟩ ∈ Anchors assigned c :
    c is no core agent dimension name or value ⇒ c is the industry's own term, used as the industry understands it ⇒ exclude, logged
    { n : circ(n,c) } = ∅ ∧ ∄ mint(c) ⇒ exclude, logged
    ∃ cᵢ, cⱼ : α(cᵢ) = α(cⱼ) ∧ κ(cᵢ) = κ(cⱼ) ∧ D(cᵢ) ≠ D(cⱼ) ⇒ the partition was wrong ↦ conceptualize
        ⟨α(cᵢ), α(cⱼ) taken at DIFFERENT altitudes is still this collision⟩

∃ d : { n : ¬circ(n,c) } all fail on d ALONE ⇒ d ∉ D(c) ∧ ∃ cᵢ ≠ c : d ∈ D(cᵢ) ⟨the property hangs off the wrong noun⟩
    ↦ conceptualize ⟨re-partition, then cᵢ names EASILY ; a losing STREAK on one d proves misattribution, ¬ that σ*(c) is scarce⟩

¬circ(n, cᵢ) ⇒ evidence about fired(n, κ(cᵢ)), ¬ about cᵢ ⟨fired reads n with κ's name and subject only : ∄ sibling · ∄ menu⟩
    ∴ a rejection BINDS n ⟨n freed from cᵢ is ¬ thereby fit for cⱼ ; circ(n, cⱼ) re-established independently ∨ n stays rejected⟩

residue(c) ≜ residue(α(c), c)
∀ a ∈ Art : ∀ c carried by a : c enters a's body as ⟨α(c), residue(c)⟩ ⟨d ∈ residue(c) ∩ D(c) stated ; d ∈ residue(c) ∧ d ∉ D(c) stated denied⟩
residue(c) = ∅ ⇒ c enters as α(c) alone
minimal(a) ⇔ ∄ c carried by a : a re-states fired(α(c), κ(c))

conform(a)  ⇔  register(a) = σ*
verbatim(a) ⇒ register(a) = σ*` as SkillExpression,
  composition: () => [],
  preamble: primePrinciple,
};
