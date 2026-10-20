import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This cell used to declare `composition: () => [exemplify, signify, materialize]` and import those
// modules to do it. The thunk's only consumer is the trailing `Composed from …`
// line of the projected SKILL.md (`forge/src/core/exemplify/skill-cell.ts`), so each
// import bought one sentence of provenance and cost a module-level cycle: the four
// signification cells each claimed to be composed from the other three, and no one of
// them could be read, taken or deployed alone.
//
// The relation those edges named is CITATION, not dependency: these cells RESTATE each
// other's terms in different registers (prose here, signature there). A citation
// belongs inside the block, at the term that borrows it (`@ <cell>`), where it needs
// no import and cannot cycle. Composition is the caller's: an agent pipes these cells
// in whatever order the work wants.

export const conceptualize: Skill = {
  name: 'conceptualize',
  description: `Find the concepts a source holds before any is named — which are primitive, what each means, and which concepts each of the others is built from, so each is distinct and together they cover the source. Reach for it when a design, a document or a domain has to be broken into concepts before each gets its Cratylic name; it decides no term and no form.`,
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
  composition: () => [],
};
