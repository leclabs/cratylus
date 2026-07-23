import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { exemplify } from '../exemplify/skill.js';
import { materialize } from '../materialize/skill.js';
import { signify } from '../signify/skill.js';

export const conceptualize: Skill = {
  name: 'conceptualize',
  description: `use this skill to extract the concepts latent in a source — which are primitive, what each means, how each factors — deciding nothing about names or form; stage 1 of exemplify.`,
  formalBlock:
    `-- ENTITIES ---------------------------------------------------------------
R                 — the reader; priors fix every meaning
sources           — input material, multi-modal; carries substrate boundaries
D_R               — the distinctions R draws over sources; identity-criterion atoms; finite
cl_R              — R's closure operator on ℘(D_R); fixed points are the concepts
C_R               — the concept lattice; the closed distinction-sets
G                 — gloss space; a meaning stored by value
TRIPLE            — contract record ⟨ gloss , anchor , factorization ⟩ ; the pipeline's narrow waist,
                    fields filled by stage: conceptualize→gloss, signify→anchor, materialize→factorization;
                    an unfilled field is ⊥ and a consumer tolerates its absence

-- OPERATIONS --------------------------------------------------------------
resolve(sources)  ≜ ⋃ { content(s) | s ∈ sources }
D_R               ≜ { d | d a distinction R draws over resolve(sources) }
boundaries(sources) ∉ D_R
depalimpsest(d)   ≜ d ↾ live-strata
partition(D_R)    ⊆ ℘(D_R)

cl_R : ℘(D_R) → ℘(D_R)
cl_R(X)           ⊇ X
X ⊆ Y             ⇒ cl_R(X) ⊆ cl_R(Y)
cl_R(cl_R(X))     = cl_R(X)
∀ d ∈ D_R         : d ∉ cl_R(D_R \\ {d})

C_R               ≜ { X ⊆ D_R | cl_R(X) = X }
intent(c)         ≜ c
⊔ P               ≜ cl_R(⋃ { intent(c) | c ∈ P })   ,  P ⊆ C_R

prim_R(c)         ⇔ ∄ P ⊆ C_R \\ {c} : ⊔ P = intent(c)
gloss(c)          ≜ intent(c)                        ,  prim_R(c)
fac_R(m)          ≜ { P ⊆ C_R \\ {m} | ⊔ P = intent(m) ∧ ∄ Q ⊊ P : ⊔ Q = intent(m) }
distill(c)        ≜ prim_R(c) ∨ fac_R(c) ≠ ∅

produce(sources)  ≜ { ( gloss(c), ⊥, ⊥ ) | c ∈ C_R }

-- LAWS -------------------------------------------------------------------
MECE(C_R)         ⇔ ( ∀ c≠c' ∈ C_R : intent(c) ≠ intent(c') )
                    ∧ ( cl_R(D_R) = ⊔ C_R )
C_R = ∅           ⇒ ⊥` as SkillExpression,
  composition: () => [exemplify, signify, materialize],
};
