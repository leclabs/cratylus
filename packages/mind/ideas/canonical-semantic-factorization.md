---
kind: concept
delineation: the model a valid context factorization must satisfy — the bipartite normal form (primitive by value, composite by reference) reconstructs from its anchors alone (`REC_R`), every anchor is the reader-relative fittest sign `σ*_R` (`canonical_anchor`), and no two concepts fuse (`minimal`); the acceptance criterion [[exemplify]] is gated by, reader-relative throughout.
---

# Canonical Semantic Factorization

The definition of a **valid** factorization — what [[exemplify]] composes `conceptualize → signify → materialize` toward, and is gated by. The bipartite normal form is emitted by [[materialize]]'s `CSF_R` (a primitive by value, a composite by reference); this cell defines when that emission is accepted. The reader `R` is named per use — the corpus factorizes for an LLM reader; the layman door factorizes for a human read through an LLM — so `canonical_anchor` is the fittest sign **for `R`** (`σ*_R`), never a reader-blind sign.

Resolve from context: the factorization under judgment — `C_R`, `prim_R`, `intent`, `cl_R` from [[conceptualize]] (with `gloss`); `α`, `dec_R` from [[signify]]; `F_R`, `fac_R`, `CSF_R` from [[materialize]].

Bindings: the round-trip `REC_R ≽` binds [[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]]; `canonical_anchor` — every anchor is the reader-relative fittest sign — binds [[signifier-star-r]] (`σ*_R`, the operator the corpus computes), the reader-blind degenerate cited as its strong-reader limit in [[precise-circumscription]]; `minimal`/`fuse` binds [[minimalism]]; the reader-relativity law binds [[reader-prior-projection]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
REC_R(c) ≜ dec_R(α(c))                           ,  prim_R(c)      -- from the by-value anchor
REC_R(c) ≜ cl_R(⋃ { REC_R(p) | p ∈ F_R(c) })      ,  ¬prim_R(c)     -- from the by-reference factors
canonical_anchor ⇔ ∀ c ∈ C_R : α(c) = σ*_R(c)   -- every anchor is the reader-relative fittest sign

¬prim_R(m) ⇒ fac_R(m) ≠ ∅
¬prim_R(m) ⇒ ∀ p ∈ F_R(m) : intent(p) ⊊ intent(m)
fac_R(m) ≠ ∅ ⇒ ∃! F_R(m)
canonical_anchor ⇒ ∀ c ∈ C_R : REC_R(c) = intent(c)   -- σ*_R faithful (L1) ⇒ exact reconstruction
∃ m, P, Q : CSF_P(m) ≠ CSF_Q(m)

fuse(cᵢ, cⱼ) ⇔ ∃ a : a circumscribes intent(cᵢ) ∪ intent(cⱼ) with no residual distinct load
minimal ⇔ ¬∃ cᵢ, cⱼ ∈ C_R : cᵢ ≠ cⱼ ∧ fuse(cᵢ, cⱼ)
valid ⇔ ( ∀ c ∈ C_R : REC_R(c) ≽ intent(c) ) ∧ minimal
```
