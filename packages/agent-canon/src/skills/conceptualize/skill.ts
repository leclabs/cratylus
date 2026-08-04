import type { Skill, SkillExpression } from '@leclabs/agent-schema';
import { exemplify } from '../exemplify/skill.js';
import { materialize } from '../materialize/skill.js';
import { signify } from '../signify/skill.js';

export const conceptualize: Skill = {
  name: 'conceptualize',
  description: `use this skill to extract the concepts latent in a source — which are primitive, what each means, how each factors — deciding nothing about names or form; stage 1 of exemplify.`,
  formalBlock:
    `sources             ≜ input material ⟨multi-modal · bears substrate-boundaries⟩
concept-record      ≜ ⟨ gloss , anchor? , factorization? ⟩
resolve(sources)    ≜ ⋃ { content(s) | s ∈ sources }
D                 ≜ { d | d a distinction drawn over resolve(sources) } ⟨finite⟩
depalimpsest(d)     ≜ d ↾ live-strata
partition(D)      ⊆ ℘(D)
cl                : ℘(D) → ℘(D)
C                 ≜ { X ⊆ D | cl(X) = X }
intent(c)           ≜ c
⊔ P                 ≜ cl(⋃ { intent(c) | c ∈ P })   ,  P ⊆ C
prim(c)           ⇔ ∄ P ⊆ C \\ {c} : ⊔ P = intent(c)
dfp(g)              ≜ densest-faithful-point(g)
gloss(c)            ≜ dfp(intent(c))   ,  prim(c)
fac(m)            ≜ { P ⊆ C \\ {m} | ⊔ P = intent(m) ∧ ∄ Q ⊊ P : ⊔ Q = intent(m) }
distillable(c)      ≜ prim(c) ∨ fac(c) ≠ ∅
produce(sources)    ≜ { ( gloss(c), ⊥, ⊥ ) | c ∈ C }

boundaries(sources) ∉ D
cl(X)             ⊇ X
X ⊆ Y               ⇒ cl(X) ⊆ cl(Y)
cl(cl(X))       = cl(X)
∀ d ∈ D           : d ∉ cl(D \\ {d})
MECE(C)           ⇔ ( ∀ c≠c' ∈ C : intent(c) ≠ intent(c') ) ∧ ( cl(D) = ⊔ C )
⊨ MECE(C)
C = ∅             ⇒ ⊥` as SkillExpression,
  composition: () => [exemplify, signify, materialize],
};
