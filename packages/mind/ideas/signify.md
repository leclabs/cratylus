---
kind: skill
name: signify
delineation: use this skill to name a concept set — assign each concept its semantic anchor (the densest name whose latent priors circumscribe it; injective, one name ⇔ one concept) and map each concept's dependencies into corpus ∪ delta; stage 2 of exemplify, independently invocable (every naming review is a bare /signify).
trigger: /signify
---

# Signify Skill

signify ≜ binds [[precise-circumscription]] · [[anchor-routing]]

Resolve from context: `C` — the concept set from [[conceptualize]], or any set under naming review.

η binds [[anchor-routing]]: mint when no anchor fits — never force an ill fit.

```text
N ≜ Name Space

η : C ⇀ N

η ≜ signum aptissimum

A ≜ { η(c) │ c ∈ dom(η) }

∀ cᵢ, cⱼ ∈ dom(η) :
    η(cᵢ) = η(cⱼ) ⇔ cᵢ = cⱼ

c ∉ dom(η) ⇒ c ∉ A :
    zero nameable ideas ⇒ exclude, logged
    several fused       ⇒ re-cut — return to conceptualize

C ──η──→ A

Δ ≜ Delta Set

R ⊆ C × (C ∪ Δ)

dependencies(c) ≜ { x │ (c, x) ∈ R }

∀ c ∈ C : dependencies(c) ⊆ C ∪ Δ
```

Output: A with R. Chain to [[materialize]].
