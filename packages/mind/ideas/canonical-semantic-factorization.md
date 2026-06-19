---
kind: concept
delineation: the model a valid context factorization must satisfy — the bipartite normal form (primitive by value, composite by reference) reconstructs from its anchors alone (`REC_R`), the anchors fire their glosses (`aptissimum`), and no two concepts fuse (`minimal`); the acceptance criterion [[exemplify]] is gated by, reader-relative throughout.
---

# Canonical Semantic Factorization

The definition of a **valid** factorization — what [[exemplify]] composes `conceptualize → signify → materialize` toward, and is gated by. The bipartite normal form is emitted by [[materialize]]'s `CSF_R` (a primitive by value, a composite by reference); this cell defines when that emission is accepted.

Resolve from context: the factorization under judgment — `C_R`, `prim_R`, `intent`, `cl_R` from [[conceptualize]] (with `gloss`); `α`, `dec_R` from [[signify]]; `F_R`, `fac_R`, `CSF_R` from [[materialize]].

Bindings: the round-trip `REC_R ≽` binds [[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]]; `aptissimum` binds [[precise-circumscription]]; `minimal`/`fuse` binds [[minimalism]]; the reader-relativity law binds [[reader-prior-projection]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
REC_R(c) ≜ dec_R(α(c))                           ,  prim_R(c)      -- from the by-value anchor
REC_R(c) ≜ cl_R(⋃ { REC_R(p) | p ∈ F_R(c) })      ,  ¬prim_R(c)     -- from the by-reference factors
aptissimum ⇔ ∀ p : prim_R(p) ⇒ dec_R(α(p)) = gloss(p)

¬prim_R(m) ⇒ fac_R(m) ≠ ∅
¬prim_R(m) ⇒ ∀ p ∈ F_R(m) : intent(p) ⊊ intent(m)
fac_R(m) ≠ ∅ ⇒ ∃! F_R(m)
aptissimum ⇒ ∀ c ∈ C_R : REC_R(c) = intent(c)
∃ m, P, Q : CSF_P(m) ≠ CSF_Q(m)

fuse(cᵢ, cⱼ) ⇔ ∃ a : a circumscribes intent(cᵢ) ∪ intent(cⱼ) with no residual distinct load
minimal ⇔ ¬∃ cᵢ, cⱼ ∈ C_R : cᵢ ≠ cⱼ ∧ fuse(cᵢ, cⱼ)
valid ⇔ ( ∀ c ∈ C_R : REC_R(c) ≽ intent(c) ) ∧ minimal
```
