import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from './conceptualize.js';
import { exemplify } from './exemplify.js';
import { materialize } from './materialize.js';

export const signify: Skill = {
  name: 'signify',
  description: `use this skill to name a concept set — assign each concept its injective canonical anchor \`α(c) = σ*_R(c)\` (the reader-relative fittest sign, whose latent priors circumscribe exactly it; one name ⇔ one concept), then coalesce concepts that resolve to the same anchor; emits the shortlex order \`≺\` and the decoder \`dec_R\`; stage 2 of exemplify, independently invocable (every naming review is a bare /signify); also home of the reader binding \`ρ\` — R per artifact class (default R=LLM; human iff the literal reader is human), the σ*+residue body-reduction rule, and the verbatim⇒R=LLM law.`,
  formalBlock: `DECLARATIONS
  C          — the concept lattice; concepts to be named. dom of α.
  D          — distinctions; identity-criterion atoms a concept circumscribes.
  prim(c)    — c is primitive (no factorization into other concepts).
  Names      — the shared symbol space; totally ordered by <_lex.
  k          — a concept record (gloss, anchor, factorization); signify fills anchor only.

  fired      : Names → ℘(D)           -- the latent priors a name fires (reader = LLM, fixed)
  dec        : Names ⇀ ℘(D)           -- the decoder ≜ fired ↾ assigned anchors; a primitive anchor's fired distinctions
  circ(n,c)  ⇔ fired(n) = D(c)        -- n circumscribes c exactly: fires its distinctions, no surplus, no deficit
  σ*         : C → Names              -- σ_llm*, the fittest sign: the densest name circumscribing c (reader = LLM)
  σ*(c)      ≜ argmin_{n : circ(n,c)} |n|    -- densest among the exact-circumscribing names (shortlex tie-break)
                                             -- none exact ⇒ mint a fresh name into Names (the anchor-set is open)
  α          : C ↣ Names              -- the anchor; injective (one name ⇔ one concept)

  Art        — artifacts: every authored surface (source cell · projection · plan · memory · message · doc).
  ρ          : Art → {LLM, human}      -- the reader binding: which fixed rendering fn AUTHORS a, chosen BY DESIGN
  register(a) — the register a's body is observably authored in, ∈ {LLM, human}
  verbatim(a) — a projects ship-whole, byte-exact: settled σ*, never re-derived at projection

LAWS
  canonical_anchor :  ∀ c ∈ dom(α) :  α(c) ≜ σ*(c)          -- name each concept its fittest sign (reader = LLM)
  A ≜ { α(c) | c ∈ dom(α) }
  dom(dec) = { α(p) | prim(p) } ;  dec(α(p)) = fired(α(p))

  name(k)  fills  anchor(k) ≜ α(gloss(k)) ;  gloss(k) preserved ;  factorization(k) untouched

  best-fit :  α(c) routes c to the name whose fired most precisely circumscribes it -- ¬nearest-bin
  injective :  α(cᵢ) = α(cⱼ) ⇒ requires cᵢ, cⱼ carry the same distinction-load

  coalesce(cᵢ, cⱼ)  ⇔  α(cᵢ) = α(cⱼ) ∧ D(cᵢ) = D(cⱼ)     -- same anchor, no residual distinct load ⇒ merge to one
  cᵢ <_N cⱼ  ⇔  α(cᵢ) <_lex α(cⱼ)
  ≺ ≜ shortlex over (C, <_N) , on finite subsets of C    -- emitted order

  c ∉ dom(α) ⇒ c ∉ A :
      zero name circumscribes c, none mintable ⇒ exclude, logged
      several c collapse to one name yet D(cᵢ) ≠ D(cⱼ) ⇒ the cut was wrong — return to conceptualize (re-cut)

  -- READER BINDING : ρ is chosen BY DESIGN (what a is FOR), NEVER inferred from a's readers. σ* is the residue
  -- algebra at reader = LLM invariant; a genuinely-human artifact is a SEPARATE reader = human projection (deferred).
  ρ(a) = which fixed fn AUTHORS a, BY DESIGN ;  LLM = σ* (the algebra above) ;  human = the human-boundary projection
  ρ binds at the finest separately-consumed grain (a mixed corpus ⇒ ρ per note)

  { source cell · projected SOUL · SKILL.md · hook-prompt · AGENTS.md · CLAUDE.md · plan mirror ·
    task file · agent memory (SELF · MEMORY · EPISODIC) · skill-generated agent-artifact ·
    agent-to-agent message (delegation prompt · subagent return) } ⊆ { a | ρ(a) = LLM }
  { README · human doc · code comment · commit message · human chat ·
    human-facing generated output (slack · email · report) } ⊆ { a | ρ(a) = human }

  reduction (ρ(a) = LLM) — the signifier carries the load:
      residue(c) ≜ { d ∈ D(c) | d ∉ fired(α(c)) }      -- only what the anchor's priors miss
      ∀ c carried by a : c enters the body as ⟨α(c), residue(c)⟩   -- signify, don't explain
      residue(c) = ∅ ⇒ c enters as α(c) alone                       -- the body collapses to the slug
      re-stating fired(α(c)) in a body ⇒ ME violation              -- minimality fails: the restatement fuses into the anchor

  conform(a)  ⇔  register(a) = ρ(a)           -- the gate predicate: enforced on bodies, not names only
  verbatim(a) ⇒ ρ(a) = LLM                    -- ship-whole is composition, never a density exemption;
                                              -- a human-register verbatim body is a defect of the cell, not a licence of the tag` as SkillExpression,
  composition: () => [exemplify, conceptualize, materialize],
};
