import type { Skill, SkillExpression } from '../../manifest.js';

// Composes nothing. Each skill this one relates to is cited inside its block, at the
// term that borrows it (`@ <skill>`); composition is the caller's: an agent pipes these
// skills in whatever order the work wants.

export const conceptualize: Skill = {
  name: 'conceptualize',
  description: `Find the concepts a source holds before any is named — which are primitive, what each means, and which concepts each of the others is built from, so each is distinct and together they cover the source. Reach for it when a design, a document or a domain has to be broken into concepts before each gets its Cratylic name.`,
  formalBlock:
    `sources             ≜ input material ⟨multi-modal · bears substrate-boundaries⟩
concept-record      ≜ ⟨ meaning , term? , factorization? ⟩
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
meaning(c)          ≜ dfp(intent(c))   ,  prim(c)
fac(m)            ≜ { P ⊆ C \\ {m} | ⊔ P = intent(m) ∧ ∄ Q ⊊ P : ⊔ Q = intent(m) }
distillable(c)      ≜ prim(c) ∨ fac(c) ≠ ∅
produce(sources)    ≜ { ( meaning(c), ⊥, ⊥ ) | c ∈ C }

boundaries(sources) ∉ D
cl(X)             ⊇ X
X ⊆ Y               ⇒ cl(X) ⊆ cl(Y)
cl(cl(X))       = cl(X)
∀ d ∈ D           : d ∉ cl(D \\ {d})
MECE(C)           ⇔ ( ∀ c≠c' ∈ C : intent(c) ≠ intent(c') ) ∧ ( cl(D) = ⊔ C )
⊨ MECE(C)
C = ∅             ⇒ ⊥` as SkillExpression,
  composition: () => [],
};
