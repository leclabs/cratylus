---
kind: concept
delineation: the first-class data type every CSF module programs to — a record `⟨ gloss , anchor? , factorization? ⟩` (the meaning by value, optionally its anchor, optionally its factorization); producers emit it, consumers take it, so modules bind the contract not each other — the narrow waist of the pipeline.
---

# Concept Contract

The single data type the CSF pipeline passes between its stages: a **concept** is a record carrying its meaning and, progressively, its name and its factorization. Each module is a function over this one type — `conceptualize` produces it with the meaning filled, `signify` fills the anchor, `materialize` fills the factorization — so no module names another; each binds only the contract. This is the **narrow waist**: the field-presence of `anchor?`/`factorization?` is itself the decoupling — a partly-filled record flows forward and gains fields, never a web of module-to-module calls.

A field is **optional** because it is filled at a stage. A freshly conceptualized concept has its `gloss` but no `anchor` yet; the absent field is `⊥` until the stage that owns it commits a value. A consumer reads the fields it needs and tolerates the absence of the rest — that tolerance is what lets a producer emit and a consumer take while agreeing on nothing but this record. The contract is the only shared name in the pipeline.

Resolve from context: `R` — the reader whose priors fix every meaning; the concept(s) under construction, drawn from the lattice `C_R`.

Bindings: the field `gloss` (the meaning by value) binds [[conceptualize]] (`gloss(c) ≜ intent(c)` over the distinction-lattice `C_R`, `D_R`, `cl_R`) · [[densest-faithful-point]] (a gloss is stored at its densest faithful point); the field `anchor` binds [[signify]] (the injective `α : C_R ↣ Names`, the densest circumscribing name) · [[signifier-star-r]] (the optimal anchor is `σ*_R(c)`, whose decode `dec_R` reconstructs `c` to reader-isomorphism `≅_R`); the field `factorization` binds [[materialize]] (the canonical `F_R`, the by-reference factor-anchors of the bipartite `CSF_R`); the produces-emits / consumer-takes decoupling binds [[cite-dont-copy]] (a consumer cites the contract, never restates the producer that filled it). The symbol table is `references/formal-symbolic-notation.md`.

```text
G          — the gloss space; a meaning by value (a primitive's stored content)
Names      — the shared anchor space; reader-independent
Fac        — the factorization space; a set of factor-anchors

T? ≜ T ∪ {⊥}                                   -- optional field: a value of T, or ⊥ (absent, not-yet-filled)

Concept ≜ G × Names? × Fac?                     -- the contract: meaning by value, anchor optional, factorization optional

gloss         : Concept → G                     -- total: every concept carries its meaning by value
anchor        : Concept → Names?                -- optional: ⊥ until signify commits it
factorization : Concept → Fac?                  -- optional: ⊥ until materialize commits it

named(k)    ⇔ anchor(k) ≠ ⊥
realized(k) ⇔ factorization(k) ≠ ⊥

-- the pipeline as functions over the one type: each fills a field, names no peer
produce : sources → ℘(Concept)                  -- fills gloss            ; anchor = ⊥ , factorization = ⊥
name    : Concept → Concept                      -- fills anchor           ; gloss preserved
realize : Concept → Concept                      -- fills factorization    ; gloss, anchor preserved

gloss(name(k)) = gloss(k)                        -- name preserves meaning
named(name(k))                                   -- name commits the anchor : anchor := σ*_R(gloss(k))
named(k) ⇒ ( gloss(realize(k)), anchor(realize(k)) ) = ( gloss(k), anchor(k) )   -- realize preserves both
realized(realize(k))                             -- realize commits the factorization : factorization := F_R(k)
¬named(k) ⇒ realize(k) = ⊥                        -- cannot realize an unnamed concept

-- narrow waist: a consumer binds the contract, never the producer that filled a field
∀ field f ∈ { gloss, anchor, factorization } : a consumer needing f refuses iff f = ⊥
the refusing consumer never names which module fills f                 -- the field, not the peer
```

## See also

- [[canonical-semantic-factorization]] — the acceptance model a fully-realized concept (all three fields filled) must satisfy: `valid` over the bipartite `CSF_R`.
- [[exemplify]] — the process that runs `produce → name → realize`, composing the three stages this contract passes between.
