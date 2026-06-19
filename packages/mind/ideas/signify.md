---
kind: skill
name: signify
delineation: use this skill to name a concept set — assign each concept its injective anchor `α` (the densest name whose latent priors circumscribe it; one name ⇔ one concept), the shortlex order `≺` over anchored concepts, and the reader's decoder `dec_R` (the distinctions an anchor fires); stage 2 of exemplify, independently invocable (every naming review is a bare /signify).
trigger: /signify
---

# Signify Skill

Resolve from context: `C_R` — the concept lattice from [[conceptualize]] (carrying `prim_R`, `D_R`), or any set under naming review.

Bindings: `α` binds [[precise-circumscription]] (the densest circumscribing name) · [[anchor-routing]] (injective; exclude or re-cut when no single name fits); `dec_R` binds [[anchor-to-the-readers-priors]] (the priors an anchor fires). The symbol table is `references/formal-symbolic-notation.md`.

```text
Names      — the shared symbol space; reader-independent; totally ordered by <_lex
α          — the anchor; the name R gives a concept
dec_R      — R's decoder; the distinctions a primitive's anchor fires in R; empirical, not α's formal inverse

α : C_R ↣ Names
A ≜ { α(c) | c ∈ dom(α) }
dec_R : { α(p) | prim_R(p) } → ℘(D_R)

cᵢ <_N cⱼ ⇔ α(cᵢ) <_lex α(cⱼ)
≺ ≜ shortlex over (C_R, <_N) , on finite subsets of C_R

c ∉ dom(α) ⇒ c ∉ A :
    zero nameable     ⇒ exclude, logged
    several, one name ⇒ re-cut — return to conceptualize
```
