# Canonical Semantic Factorization

> **A proposal, kept as a record.** This is the seventh statement of the factorization, in its
> fullest notation: the reader R, its closure `cl_R`, its decoder `dec_R` and the round trip
> `REC_R`. No code reads this file. The working form lives in the skills: `signify` states the
> term `term` and the order `≺`, `materialize` states the factorization `F` and the normal form `CSF`,
> and `conceptualize` and `exemplify` state the concept record they fill. Where this text and a
> skill differ, the skill is what runs.

```text
R              — the reader; the priors that fix every meaning here
D_R            — the distinctions R draws; the identity-criterion atoms; finite
Names          — the shared symbol space; reader-independent; totally ordered by <_lex
cl_R           — R's entailment; closes a distinction-set under what R forces
term           — the term; the name R gives a concept
dec_R          — R's decoder; the distinctions a primitive's term fires in R; empirical (≠ term⁻¹)

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
meaning(c) ≜ intent(c)                                ,  prim_R(c)

term : C_R ↣ Names
dec_R : { term(p) : prim_R(p) } → ℘(D_R)
dec_R ≠ term⁻¹

c <_N c′ :⟺ term(c) <_lex term(c′)
≺ ≜ shortlex over ⟨C_R, <_N⟩ , on ℘_fin(C_R)
fac_R(m) ≜ { P ⊆ C_R \ {m} : ⊔P = intent(m) , P ⊆-minimal }
F_R(m) ≜ min_≺ fac_R(m)

CSF_R(c) ≜ ⟨ term(c) , meaning(c) ⟩                   ,  prim_R(c)
CSF_R(c) ≜ ⟨ term(c) , { term(p) : p ∈ F_R(c) } ⟩     ,  ¬prim_R(c)

REC_R⟨n, _⟩ ≜ dec_R(n)                                ,  prim_R(term⁻¹(n))
REC_R⟨n, N⟩ ≜ cl_R(⋃_{x ∈ N} REC_R(CSF_R(term⁻¹(x)))) ,  ¬prim_R(term⁻¹(n))
aptissimum-for-R :⟺ ∀ p : prim_R(p) ⟹ dec_R(term(p)) = meaning(p)

¬prim_R(m) ⟹ fac_R(m) ≠ ∅
¬prim_R(m) ⟹ ∀ p ∈ F_R(m) : intent(p) ⊊ intent(m)
fac_R(m) ≠ ∅ ⟹ ∃! F_R(m)
aptissimum-for-R ⟹ ∀ c ∈ C_R : REC_R(CSF_R(c)) = intent(c)
∃ m, R, R′ : CSF_R(m) ≠ CSF_{R′}(m)
```
