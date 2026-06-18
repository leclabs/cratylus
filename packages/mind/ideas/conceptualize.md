---
kind: skill
name: conceptualize
delineation: use this skill to conceptualize a corpus — read a multi-modal source and resolve it to its concept set (the MECE semantic primitives it projects from), deciding nothing about names or material form; stage 1 of exemplify, independently invocable.
trigger: /conceptualize
---

# Conceptualize Skill

Resolve from context: `sources` — the input material (multi-modal).

Bindings: the conceptualization `CA` resolves a source's meaning to a [[mece]] concept set; reading meaning past file/front-matter/layout substrate binds [[semantic-whole-over-syntactic-substrate]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
D ≜ ⋃ { content(s) | s ∈ sources }

boundaries(sources) ∉ inputs(CA)    ∵ files, front-matter, layout are substrate, not meaning

CA ≜ Conceptualization

meaning(D₁) = meaning(D₂) ⇒ CA(D₁) = CA(D₂)

C₀ ≜ CA(D)

∀ x, y ⊆ D : idea(x) = idea(y) ⇒ ∃! c ∈ C₀ : x ↦ c ∧ y ↦ c

∀ cᵢ, cⱼ ∈ C₀ : cᵢ ≠ cⱼ ⇒ cᵢ ∩ cⱼ = ∅

⋃ C₀ ⊇ meaning(D)

dp ≜ de-palimpsest

C ≜ { dp(c) | c ∈ C₀, dp(c) ≠ ∅ }

exclusions are logged, never silent

C = ∅ ⇒ ⊥

D ──CA──→ C
```

Output: C — dp-clean concepts, unnamed and unmaterialized. Chain to [[signify]].
