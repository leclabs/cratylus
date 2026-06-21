---
kind: skill
name: conceptualize
delineation: use this skill to conceptualize a corpus — read a multi-modal source and resolve it to the reader's concept lattice (the closed distinction-sets `C_R`, which of them are primitive, each primitive's gloss, and each concept's candidate factorizations), deciding nothing about names or material form; stage 1 of exemplify, independently invocable.
trigger: /conceptualize
---

# conceptualize

Stage 1 of [[exemplify]] (independently invocable); the front of the CSF op-chain `resolve → partition → depalimpsest → distill`. Emits the concept lattice `C_R` with each concept's `gloss` filled, deciding nothing about names or material form: `produce`s the [[concept-contract]] record with `gloss` set and `anchor`, `factorization` left `⊥`. Hands off to [[signify]] (stage 2) → [[materialize]] (stage 3).

Resolve from context: `sources` — input material (multi-modal); `R` — the reader whose priors fix every meaning.

Bindings (cite-once): `partition` cuts the mass at meaning joints [[semantic-partition]] — boundaries are substrate not meaning [[semantic-whole-over-syntactic-substrate]]; `depalimpsest` strips superseded strata [[palimpsest]] to net-green [[clean-slate]]; `distill` drives each unit to `prim_R ∨` finest `fac_R`; the closure axioms + `C_R` bind [[mece]]; `gloss` binds [[densest-faithful-point]]; the record + `produce`-fills-`gloss` law bind [[concept-contract]]. Symbol table: `references/formal-symbolic-notation.md`.

```text
D_R        — the distinctions R draws over sources; identity-criterion atoms; finite

resolve(sources) ≜ ⋃ { content(s) | s ∈ sources }    -- the mass, prior boundaries dissolved
D_R ≜ { d | d a distinction R draws over resolve(sources) }
partition(D_R) ⊆ ℘(D_R)                              -- cut at meaning joints, not at substrate
boundaries(sources) ∉ D_R          ∵ files, front-matter, layout are substrate, not meaning
depalimpsest(d) drops superseded strata of d         -- only live current content survives into D_R

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
distill(c) ≜ prim_R(c) ∨ fac_R(c) ≠ ∅          -- each concept is primitive or has a deepest faithful factorization

produce(sources) ≜ { ( gloss(c), ⊥, ⊥ ) | c ∈ C_R }   -- the contract record: gloss filled, anchor & factorization ⊥
C_R = ∅ ⇒ ⊥
```
