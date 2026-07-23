import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from '../conceptualize/skill.js';
import { exemplify } from '../exemplify/skill.js';
import { materialize } from '../materialize/skill.js';

export const signify: Skill = {
  name: 'signify',
  description: `use this skill to name a concept — assign each its canonical anchor so one name ⇔ one concept; also the home of the reader-binding ρ (which reader an artifact is authored for); stage 2 of exemplify, independently invocable.`,
  formalBlock: `C           ≜ the concept lattice
D           ≜ the identity-criterion atoms a concept circumscribes
prim(c)     ≜ c has no factorization into other concepts
Names       ≜ the shared symbol space
<_lex       : total order on Names
k           ≜ ⟨gloss, anchor, factorization⟩
fired       : Names → ℘(D)
dec         : Names ⇀ ℘(D)
circ(n,c)   ⇔ fired(n) = D(c)
|n|         ≜ reader-native description-length at R = LLM
σ*          : C → Names
σ*(c)       ≜ argmin_{n : circ(n,c)} ⟨|n|, n⟩
mint        : C ⇀ Names
mint(c)     ≜ ∘ M : M ⊆ { n : fired(n) ≠ ∅ } ∧ circ(∘ M, c)
α           : C ↣ Names
Art         ≜ every authored surface
readers(a)  ≜ who consumes a
ρ           : Art → {LLM, human}
register(a) ≜ the register a's body is observably authored in
verbatim(a) ≜ a ships whole, byte-exact : settled σ*, never re-derived at projection

∀ c ∈ dom(α) : α(c) ≜ σ*(c)
A ≜ { α(c) | c ∈ dom(α) }
dom(dec) = { α(p) | prim(p) } ;  dec(α(p)) = fired(α(p))
{ n : circ(n,c) } = ∅ ⇒ σ*(c) = mint(c)

name(k)  fills  anchor(k) ≜ α(gloss(k)) ;  gloss(k) preserved ;  factorization(k) untouched

α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)

coalesce(cᵢ, cⱼ)  ⇔  α(cᵢ) = α(cⱼ) ∧ D(cᵢ) = D(cⱼ)
cᵢ <_N cⱼ  ⇔  α(cᵢ) <_lex α(cⱼ)
≺ ≜ shortlex over (C, <_N)

c ∉ dom(α) ⇒ c ∉ A :
    { n : circ(n,c) } = ∅ ∧ ∄ mint(c) ⇒ exclude, logged
    ∃ cᵢ, cⱼ : α(cᵢ) = α(cⱼ) ∧ D(cᵢ) ≠ D(cⱼ) ⇒ the cut was wrong ↦ conceptualize

ρ(a) = which fixed fn AUTHORS a, BY DESIGN ⟨what a is FOR⟩, ¬ inferred-from readers(a) ;  LLM = σ* (the algebra above) ;  human = the human-boundary projection
ρ binds at the finest separately-consumed grain (a mixed corpus ⇒ ρ per note)

{ source cell · projected SOUL · SKILL.md · hook-prompt · AGENTS.md · CLAUDE.md · plan mirror ·
  task file · agent memory (SELF · MEMORY · EPISODIC) · skill-generated agent-artifact ·
  agent-to-agent message (delegation prompt · subagent return) } ⊆ { a | ρ(a) = LLM }
{ README · human doc · code comment · commit message · human chat ·
  human-facing generated output (slack · email · report) } ⊆ { a | ρ(a) = human }

ρ(a) = LLM ⇒
    residue(c) ≜ { d ∈ D(c) | d ∉ fired(α(c)) }
    ∀ c carried by a : c enters the body as ⟨α(c), residue(c)⟩
    residue(c) = ∅ ⇒ c enters as α(c) alone
    a re-states fired(α(c)) ⇒ ¬ minimal(a)

conform(a)  ⇔  register(a) = ρ(a)
verbatim(a) ⇒ ρ(a) = LLM` as SkillExpression,
  composition: () => [exemplify, conceptualize, materialize],
};
