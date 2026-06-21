---
kind: skill
name: signify
delineation: use this skill to name a concept set — assign each concept its injective canonical anchor `α(c) = σ*_R(c)` (the reader-relative fittest sign, whose latent priors circumscribe exactly it; one name ⇔ one concept), then coalesce concepts that resolve to the same anchor; emits the shortlex order `≺` and the decoder `dec_R`; stage 2 of exemplify, independently invocable (every naming review is a bare /signify).
trigger: /signify
---

# signify

Stage 2 of [[exemplify]] (independently invocable — every naming review is a bare /signify); the naming ops `canonical_anchor → coalescence`. `name`s the [[concept-contract]] record: fills `anchor`, preserves `gloss`, commits no `factorization`. Hands [[conceptualize]] (stage 1) → [[materialize]] (stage 3).

Resolve from context: the `produce`d [[concept-contract]] records — each carrying its `gloss`, drawn from `C_R` (with `prim_R`, `D_R`) — or any set under naming review.

Bindings (cite-once): `canonical_anchor` makes `α` the reader-relative fittest sign [[signifier-star-r]] (`α(c) = σ*_R(c)`), the densest circumscribing name [[precise-circumscription]], injective and minted-when-none-fits [[anchor-routing]]; `coalesce` is `anchor-routing`'s fuse dual — two concepts under one anchor with no residual distinct load merge [[minimalism]]; `dec_R` binds [[anchor-to-the-readers-priors]] (the priors an anchor fires). Symbol table: `references/formal-symbolic-notation.md`.

```text
Names      — the shared symbol space; reader-independent; totally ordered by <_lex
α          — the anchor; the name R gives a concept
dec_R      — R's decoder; the distinctions a primitive's anchor fires in R; empirical, not α's formal inverse

α : C_R ↣ Names
α(c) ≜ σ*_R(c)                          -- canonical_anchor: the reader-relative fittest sign
A ≜ { α(c) | c ∈ dom(α) }
dec_R : { α(p) | prim_R(p) } → ℘(D_R)

cᵢ <_N cⱼ ⇔ α(cᵢ) <_lex α(cⱼ)
≺ ≜ shortlex over (C_R, <_N) , on finite subsets of C_R

coalesce(cᵢ, cⱼ) ⇔ α(cᵢ) = α(cⱼ)        -- same anchor, no residual distinct load ⇒ merge to one concept
name(k) fills anchor(k) ≜ α(gloss(k)) ; gloss(k) preserved

c ∉ dom(α) ⇒ c ∉ A :
    zero nameable     ⇒ exclude, logged
    several, one name ⇒ re-cut — return to conceptualize
```
