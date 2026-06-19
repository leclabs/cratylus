---
kind: skill
name: conceptualize
delineation: use this skill to conceptualize a corpus — read a multi-modal source and resolve it to the reader's concept lattice (the closed distinction-sets `C_R`, which of them are primitive, each primitive's gloss, and each concept's candidate factorizations), deciding nothing about names or material form; stage 1 of exemplify, independently invocable.
trigger: /conceptualize
---

# Conceptualize Skill

Resolve from context: `sources` — the input material (multi-modal); `R` — the reader whose priors fix every meaning.

Bindings: the closure axioms and `C_R` bind [[mece]] (independent atoms, exhaustive closure); `boundaries ∉ D_R` binds [[semantic-whole-over-syntactic-substrate]]; `gloss` binds [[densest-faithful-point]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
D_R        — the distinctions R draws over sources; identity-criterion atoms; finite

D_R ≜ { d | d a distinction R draws over ⋃ { content(s) | s ∈ sources } }
boundaries(sources) ∉ D_R          ∵ files, front-matter, layout are substrate, not meaning

cl_R : ℘(D_R) → ℘(D_R)
cl_R(X) ⊇ X
X ⊆ Y ⇒ cl_R(X) ⊆ cl_R(Y)
cl_R(cl_R(X)) = cl_R(X)
∀ d ∈ D_R : d ∉ cl_R(D_R \ {d})

C_R ≜ { X ⊆ D_R | cl_R(X) = X }
intent(c) ≜ c
⊔ P ≜ cl_R(⋃ { intent(c) | c ∈ P })          ,  P ⊆ C_R

prim_R(c) ⇔ ∄ P ⊆ C_R \ {c} : ⊔ P = intent(c)
gloss(c) ≜ intent(c)                          ,  prim_R(c)
fac_R(m) ≜ { P ⊆ C_R \ {m} | ⊔ P = intent(m) ∧ ∄ Q ⊊ P : ⊔ Q = intent(m) }

C_R = ∅ ⇒ ⊥
```
