import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This skill used to declare `composition: () => [exemplify, conceptualize, materialize]` and import those
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

export const signify: Skill = {
  name: 'signify',
  description: `Give a concept its Cratylic name — the term whose meaning, read in the concept's domain, has the smallest symmetric difference from the concept, found among the names the model already gives it and confirmed by a fresh reading, never coined where an established term covers it; one term per concept in a context, its precising definition stated beside it. Reach for it when a concept needs a name, or when a name's reading lacks part of its concept or adds to it.`,
  formalBlock: `C           ≜ the concept lattice
D           ≜ the identity-criterion atoms a concept circumscribes
prim(c)     ≜ c has no factorization into other concepts
Names       ≜ the shared symbol space
<_lex       : total order on Names
concept-record ≜ ⟨meaning, term, factorization⟩
κ           : C → bounded-context ⟨the context c is read in · part of its term's address⟩
fired       : Names × bounded-context → ℘(D) ⟨fired(n, κ) : what n invokes read in κ⟩
dec         : Names × bounded-context ⇀ ℘(D)
circ(n,c)   ⇔ fired(n, κ(c)) = D(c)
|n|         ≜ LLM-native description-length
Δ(n,c)      ≜ fired(n, κ(c)) △ D(c) ⟨the symmetric difference of n from c @ cratylic context design · c named n · n read in κ(c)⟩
lacks(n,c)  ≜ D(c) \\ fired(n, κ(c)) ;  adds(n,c) ≜ fired(n, κ(c)) \\ D(c) ⟨Δ(n,c) = lacks(n,c) ∪ adds(n,c)⟩
covers(n,c) ⇔ n read in κ(c) addresses c ⟨Δ(n,c) closable by a precising definition : lacks(n,c) stated ∧ adds(n,c) narrowed, n's core meaning kept⟩
Est         : bounded-context → ℘(Names) ⟨Est(κ) : the terms established in κ's domain⟩
cratylic    : C → Names
cratylic(c) ≜ argmin_{n ∈ Est(κ(c)) : covers(n,c)} ⟨Δ(n,c), |n|, n⟩ ⟨the smallest symmetric difference from c in κ(c) among the established terms covering c · |n| then n break a tie⟩
mint        : C ⇀ Names
mint(c)     ≜ ∘ M : M ⊆ { n : fired(n, κ(c)) ≠ ∅ } ∧ covers(∘ M, c) ∧ ∘ M ∉ Est(κ(c))
Art         ≜ the text's own authored surfaces ⟨prose ≡ identifier ≡ path⟩
τ           : C ↣ Names ⟨the term assignment · injective within each κ, ¬ across · dom(τ) ≜ every concept the text carries, less those excluded below⟩
register(a) ≜ the register a's body is observably authored in ⟨cratylic ∨ human⟩
verbatim(a) ≜ a ships whole, byte-exact : its Cratylic names settled, never re-derived at projection

∀ c ∈ dom(τ) : τ(c) ≜ cratylic(c)
Terms ≜ { ⟨τ(c), κ(c)⟩ | c ∈ dom(τ) } ⟨the assigned-term set, each term with its context⟩
dom(dec) = { ⟨τ(p), κ(p)⟩ | prim(p) } ;  dec(τ(p), κ(p)) = fired(τ(p), κ(p))
{ n ∈ Est(κ(c)) : covers(n,c) } = ∅ ⇒ cratylic(c) = mint(c) ⟨coined only where no established term covers c⟩

name(k)  fills  term(k) ≜ τ(meaning(k)) ;  meaning(k) preserved ;  factorization(k) untouched

τ(cᵢ) = τ(cⱼ) ∧ κ(cᵢ) = κ(cⱼ) ⇒ D(cᵢ) = D(cⱼ)

coalesce(cᵢ, cⱼ)  ⇔  τ(cᵢ) = τ(cⱼ) ∧ κ(cᵢ) = κ(cⱼ) ∧ D(cᵢ) = D(cⱼ)
cᵢ <_N cⱼ  ⇔  τ(cᵢ) <_lex τ(cⱼ) ∨ (τ(cᵢ) = τ(cⱼ) ∧ κ(cᵢ) <_lex κ(cⱼ)) ⟨a tie on the term broken by context name⟩
≺ ≜ shortlex over (C, <_N)

c ∉ dom(τ) ⇒ ∄ n : ⟨n, κ(c)⟩ ∈ Terms assigned c :
    { n ∈ Est(κ(c)) : covers(n,c) } = ∅ ∧ ∄ mint(c) ⇒ exclude, logged
    ∃ cᵢ, cⱼ : τ(cᵢ) = τ(cⱼ) ∧ κ(cᵢ) = κ(cⱼ) ∧ D(cᵢ) ≠ D(cⱼ) ⇒ the partition was wrong ↦ conceptualize
        ⟨τ(cᵢ), τ(cⱼ) taken at DIFFERENT altitudes is still this collision⟩

∃ d : { n : ¬circ(n,c) } all fail on d ALONE ⇒ d ∉ D(c) ∧ ∃ cᵢ ≠ c : d ∈ D(cᵢ) ⟨the property hangs off the wrong noun⟩
    ↦ conceptualize ⟨re-partition, then cᵢ names EASILY ; a losing STREAK on one d proves misattribution, ¬ that cratylic(c) is scarce⟩

¬covers(n, cᵢ) ⇒ evidence about fired(n, κ(cᵢ)), ¬ about cᵢ ⟨fired reads n with κ's name and subject only : ∄ sibling · ∄ menu⟩
    ∴ a rejection BINDS n ⟨n freed from cᵢ is ¬ thereby fit for cⱼ ; covers(n, cⱼ) re-established independently ∨ n stays rejected⟩

precising-definition(c) ≜ the precising definition closing Δ(cratylic(c), c) @ cratylic context design ⟨what holds stated : lacks(cratylic(c), c) supplied · adds(cratylic(c), c) narrowed⟩
∀ a ∈ Art : ∀ c carried by a : c enters a's body as ⟨τ(c), precising-definition(c)⟩ ⟨d ∈ lacks(τ(c), c) supplied ; d ∈ adds(τ(c), c) narrowed⟩
precising-definition(c) = ∅ ⇒ c enters as τ(c) alone
minimal(a) ⇔ ∄ c carried by a : a re-states fired(τ(c), κ(c))

conform(a)  ⇔  register(a) = cratylic
verbatim(a) ⇒ register(a) = cratylic` as SkillExpression,
  composition: () => [],
  preamble: primePrinciple,
};
