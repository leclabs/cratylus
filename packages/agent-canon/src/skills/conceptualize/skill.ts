import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { exemplify } from '../exemplify/skill.js';
import { materialize } from '../materialize/skill.js';
import { signify } from '../signify/skill.js';

export const conceptualize: Skill = {
  name: 'conceptualize',
  description: `use this skill to extract the concepts latent in a source — which are primitive, what each means, how each factors — deciding nothing about names or form; stage 1 of exemplify.`,
  formalBlock: `R                   ≜ reader ⟨priors fix every meaning⟩
sources             ≜ input material ⟨multi-modal · bears substrate-boundaries⟩
TRIPLE              ≜ ⟨ gloss , anchor? , factorization? ⟩
resolve(sources)    ≜ ⋃ { content(s) | s ∈ sources }
D_R                 ≜ { d | d a distinction R draws over resolve(sources) } ⟨finite⟩
depalimpsest(d)     ≜ d ↾ live-strata
partition(D_R)      ⊆ ℘(D_R)
cl_R                : ℘(D_R) → ℘(D_R)
C_R                 ≜ { X ⊆ D_R | cl_R(X) = X }
intent(c)           ≜ c
⊔ P                 ≜ cl_R(⋃ { intent(c) | c ∈ P })   ,  P ⊆ C_R
prim_R(c)           ⇔ ∄ P ⊆ C_R \\ {c} : ⊔ P = intent(c)
gloss(c)            ≜ densest-faithful-point(intent(c))   ,  prim_R(c)
fac_R(m)            ≜ { P ⊆ C_R \\ {m} | ⊔ P = intent(m) ∧ ∄ Q ⊊ P : ⊔ Q = intent(m) }
distill(c)          ≜ prim_R(c) ∨ fac_R(c) ≠ ∅
produce(sources)    ≜ { ( gloss(c), ⊥, ⊥ ) | c ∈ C_R }

boundaries(sources) ∉ D_R
cl_R(X)             ⊇ X
X ⊆ Y               ⇒ cl_R(X) ⊆ cl_R(Y)
cl_R(cl_R(X))       = cl_R(X)
∀ d ∈ D_R           : d ∉ cl_R(D_R \\ {d})
MECE(C_R)           ⇔ ( ∀ c≠c' ∈ C_R : intent(c) ≠ intent(c') ) ∧ ( cl_R(D_R) = ⊔ C_R )
⊨ MECE(C_R)
C_R = ∅             ⇒ ⊥` as SkillExpression,
  composition: () => [exemplify, signify, materialize],
};
