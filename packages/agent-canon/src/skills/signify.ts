import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from './conceptualize.js';
import { exemplify } from './exemplify.js';
import { materialize } from './materialize.js';

export const signify: Skill = {
  name: 'signify',
  description: `use this skill to name a concept — assign each its canonical anchor so one name ⇔ one concept; also the home of the reader-binding ρ (which reader an artifact is authored for); stage 2 of exemplify, independently invocable.`,
  formalBlock: `DECLARATIONS
  C          — the concept lattice; concepts to be named. dom of α.
  D          — distinctions; identity-criterion atoms a concept circumscribes.
  prim(c)    — c is primitive (no factorization into other concepts).
  Names      — the shared symbol space; totally ordered by <_lex.
  k          — a concept record (gloss, anchor, factorization); signify fills anchor only.

  fired      : Names → ℘(D)           -- the latent priors a name fires (reader = LLM, fixed)
  dec        : Names ⇀ ℘(D)
  circ(n,c)  ⇔ fired(n) = D(c)
  |n|        ≜ reader-native description-length at R = LLM
  σ*         : C → Names
  σ*(c)      ≜ argmin_{n : circ(n,c)} |n|
  mint       : C ⇀ Names
  mint(c)    ≜ ∘ M : M ⊆ {n : fired(n) ≠ ∅} ∧ circ(∘ M, c)
  α          : C ↣ Names              -- the anchor

  Art        — artifacts: every authored surface (source cell · projection · plan · memory · message · doc).
  ρ          : Art → {LLM, human}      -- the reader binding: which fixed rendering fn AUTHORS a, chosen BY DESIGN, never inferred from a's readers
  register(a) — the register a's body is observably authored in, ∈ {LLM, human}
  verbatim(a) — a projects ship-whole, byte-exact: settled σ*, never re-derived at projection

LAWS
  canonical_anchor :  ∀ c ∈ dom(α) :  α(c) ≜ σ*(c)
  A ≜ { α(c) | c ∈ dom(α) }
  dom(dec) = { α(p) | prim(p) } ;  dec(α(p)) = fired(α(p))

  name(k)  fills  anchor(k) ≜ α(gloss(k)) ;  gloss(k) preserved ;  factorization(k) untouched

  injective :  α(cᵢ) = α(cⱼ) ⇒ requires cᵢ, cⱼ carry the same distinction-load

  coalesce(cᵢ, cⱼ)  ⇔  α(cᵢ) = α(cⱼ) ∧ D(cᵢ) = D(cⱼ)
  cᵢ <_N cⱼ  ⇔  α(cᵢ) <_lex α(cⱼ)
  ≺ ≜ shortlex over (C, <_N) , on finite subsets of C

  c ∉ dom(α) ⇒ c ∉ A :
      zero name circumscribes c, none mintable ⇒ exclude, logged
      several c collapse to one name yet D(cᵢ) ≠ D(cⱼ) ⇒ the cut was wrong ↦ conceptualize

  -- READER BINDING --
  ρ(a) = which fixed fn AUTHORS a, BY DESIGN ;  LLM = σ* (the algebra above) ;  human = the human-boundary projection
  ρ binds at the finest separately-consumed grain (a mixed corpus ⇒ ρ per note)

  { source cell · projected SOUL · SKILL.md · hook-prompt · AGENTS.md · CLAUDE.md · plan mirror ·
    task file · agent memory (SELF · MEMORY · EPISODIC) · skill-generated agent-artifact ·
    agent-to-agent message (delegation prompt · subagent return) } ⊆ { a | ρ(a) = LLM }
  { README · human doc · code comment · commit message · human chat ·
    human-facing generated output (slack · email · report) } ⊆ { a | ρ(a) = human }

  reduction (ρ(a) = LLM):
      residue(c) ≜ { d ∈ D(c) | d ∉ fired(α(c)) }
      ∀ c carried by a : c enters the body as ⟨α(c), residue(c)⟩
      residue(c) = ∅ ⇒ c enters as α(c) alone
      re-stating fired(α(c)) in a body ⇒ ME violation

  conform(a)  ⇔  register(a) = ρ(a)
  verbatim(a) ⇒ ρ(a) = LLM` as SkillExpression,
  composition: () => [exemplify, conceptualize, materialize],
};
