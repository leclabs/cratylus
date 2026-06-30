# Canonical Semantic Factorization

```text
R              — the reader; the priors that fix every meaning here
D_R            — the distinctions R draws; the identity-criterion atoms; finite
Names          — the shared symbol space; reader-independent; totally ordered by <_lex
cl_R           — R's entailment; closes a distinction-set under what R forces
α              — the anchor; the name R gives a concept
dec_R          — R's decoder; the distinctions a primitive's anchor fires in R; empirical (≠ α⁻¹)

cl_R : ℘(D_R) → ℘(D_R)
cl_R(X) ⊇ X
X ⊆ Y ⟹ cl_R(X) ⊆ cl_R(Y)
cl_R(cl_R(X)) = cl_R(X)
∀ d ∈ D_R : d ∉ cl_R(D_R \ {d})

C_R ≜ { X ⊆ D_R : cl_R(X) = X }
intent(c) ≜ c
a ⊑_R b :⟺ intent(b) ⊆ intent(a)
d ⇒_R e :⟺ e ∈ cl_R({d})
⊔P ≜ cl_R(⋃_{c ∈ P} intent(c))                       ,  P ⊆ C_R

prim_R(c) :⟺ ∄ P ⊆ C_R \ {c} : ⊔P = intent(c)
gloss(c) ≜ intent(c)                                  ,  prim_R(c)

α : C_R ↣ Names
dec_R : { α(p) : prim_R(p) } → ℘(D_R)
dec_R ≠ α⁻¹

c <_N c′ :⟺ α(c) <_lex α(c′)
≺ ≜ shortlex over ⟨C_R, <_N⟩ , on ℘_fin(C_R)
fac_R(m) ≜ { P ⊆ C_R \ {m} : ⊔P = intent(m) , P ⊆-minimal }
F_R(m) ≜ min_≺ fac_R(m)

CSF_R(c) ≜ ⟨ α(c) , gloss(c) ⟩                        ,  prim_R(c)
CSF_R(c) ≜ ⟨ α(c) , { α(p) : p ∈ F_R(c) } ⟩           ,  ¬prim_R(c)

REC_R⟨n, _⟩ ≜ dec_R(n)                                ,  prim_R(α⁻¹(n))
REC_R⟨n, N⟩ ≜ cl_R(⋃_{x ∈ N} REC_R(CSF_R(α⁻¹(x))))    ,  ¬prim_R(α⁻¹(n))
aptissimum-for-R :⟺ ∀ p : prim_R(p) ⟹ dec_R(α(p)) = gloss(p)

¬prim_R(m) ⟹ fac_R(m) ≠ ∅
¬prim_R(m) ⟹ ∀ p ∈ F_R(m) : intent(p) ⊊ intent(m)
fac_R(m) ≠ ∅ ⟹ ∃! F_R(m)
aptissimum-for-R ⟹ ∀ c ∈ C_R : REC_R(CSF_R(c)) = intent(c)
∃ m, R, R′ : CSF_R(m) ≠ CSF_{R′}(m)
```
