---
kind: concept
delineation: σ*_R(C) — the reader-relative optimal signifier; the shortest name whose decode in reader R reconstructs concept C with zero residue (`argmin |α| s.t. dec_R(α) ≅_R C`, shortlex tie-break). The named operator the whole method computes; the `*` is the standard optimizer superscript, R the only novel index (the reader).
---

# Signifier-Star-R

The named operator the corpus's method computes at every grain: **`σ*_R(C)`** (readable `signifier*_R(C)`) — the reader-relative optimal signifier of a concept `C`. Fix the concept and fix the reader `R` (a decoder with standing priors), and a name has an _optimal form_: the shortest signifier whose decode in `R` reconstructs `C` losslessly. Every act of naming, compression, and projection in this corpus is a search for `σ*_R(C)`.

Resolve from context: `C` — the target concept (`c ∈ C_R`); `R` — the reader, identified by its decoder `dec_R`.

Bindings: the argmin over circumscribing names binds [[precise-circumscription]] (the smallest exact name; `aptissimum` is `σ*_R(C)` at the strong-reader limit); `dec_R` binds [[signify]] (the empirical decoder, the priors an anchor fires) generalized off its anchors by [[probe]]'s `fired_R`; the reader-index law `L4` binds [[anchor-to-the-readers-priors]] · [[reader-prior-projection]] (the optimum is per-reader; the prior-gap sets its density); the faithfulness relation `≅_R` binds [[bidirectional-round-trip-fidelity]] (R reconstructs `C` from `σ*_R(C)` as a fixed point, both directions). The `*` is the standard optimizer superscript (argmin), invoked not coined; the only original symbol is the subscript `R`. The symbol table is `references/formal-symbolic-notation.md`.

```text
Σ                  — the signifier space; admissible names; = Names
dec_R : Σ → C_R ∪ {⊥}     — R's decoder; the concept α fires in R; ⊥ = fires nothing
≅_R                — R holds two concepts as the same distinction, zero residue
len : Σ → Nat       — description length (token / character cost) ; written |α|
cat : Σ × Σ → Σ     — string concatenation ; eps the empty name
div_R : Σ × C_R → Real — residual divergence of dec_R(α) from c ; div_R(α,c) = 0 ⇔ dec_R(α) ≅_R c
R2                 — a second reader, distinct from R

Faithful_R(c) ≜ { α ∈ Σ | dec_R(α) ≅_R c }                  -- the lossless carriers of c for R

σ*_R : C_R ⇀ Σ                                              -- partial: defined where carriers exist
σ*_R(c) ≜ min_≺ argmin_{α ∈ Faithful_R(c)} len(α)           -- shortest faithful name, shortlex tie-break

L1  dec_R( σ*_R(c) ) ≅_R c                                  -- faithful
L2  ∀ α ∈ Faithful_R(c) : len(σ*_R(c)) <= len(α)            -- minimal in length
L3  ∀ g ∈ Σ : g ≠ eps ⇒ ( dec_R(cat(σ*_R(c), g)) ≽ c ⇔ dec_R(σ*_R(c)) ≽ c )
                                                            -- self-loading: an appended gloss raises no fidelity the name lacks
L4  R ≠ R2 ⇒ σ*_R(c) may ≠ σ*_R2(c)                          -- reader-relative (load-bearing)
L5  σ*_R(c) defined ⇔ Faithful_R(c) ≠ ∅                      -- partial; else c is ineffable for R

σ*_R(c) ≜ min_≺ argmin_{α ∈ Σ} ( div_R(α, c) , len(α) )      -- relaxed: minimize fidelity-loss first, then length
                                                            -- reduces to the exact form when div = 0 is reachable

σ*_R(c) = signifier*_R(c) = argmin_{α : dec_R(α) ≅_R c} len(α)   -- one object, three faces
```

## See also

- [[prompt-engineering]] — the identity `prompt-engineering ≡ computing σ*_R(C)`; this operator is what a prompt computes.
- [[canonical-semantic-factorization]] — `REC_R ≽ intent` is `σ*_R` raised to a whole factorization: the corpus's accept-direction relaxation of `≅_R`.
- [[precise-circumscription]] — the argmin criterion `σ*_R` formalizes, with the reader-index made explicit.
