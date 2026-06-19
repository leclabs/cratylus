---
kind: skill
name: materialize
delineation: use this skill to realize a concept lattice as artifacts — select each concept's canonical factorization `F_R`, emit the bipartite normal form `CSF_R` (a primitive by value as ⟨anchor, gloss⟩, a composite by reference as ⟨anchor, factor-anchors⟩), then realize under an explicitly named strategy whose kind-consumption table ρ refuses loudly when unnamed; stage 3 of exemplify, independently invocable.
trigger: /materialize
---

# Materialize Skill

Resolve from context: `C_R` — the concept lattice from [[conceptualize]] (carrying `prim_R`, `gloss`, `fac_R`); `α`, `≺` — the anchor and order from [[signify]]; `s` — the strategy, REQUIRED from the caller; `${OUTPUT_DIR}` — file strategy only.

Bindings: `dfp` binds [[densest-faithful-point]] (a primitive's stored gloss); the by-reference composite emit binds [[cite-dont-copy]] (cite factor-anchors, never restate); the refusal laws bind [[no-permissive-defaults]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
K          — the closed kind set

F_R(m) ≜ min_≺ fac_R(m)
CSF_R(c) ≜ ( α(c) , dfp(gloss(c)) )               ,  prim_R(c)
CSF_R(c) ≜ ( α(c) , { α(p) | p ∈ F_R(c) } )        ,  ¬prim_R(c)

prose(c) ≜ render(CSF_R(c), R)
prose(c) is a projection, never stored beside CSF_R(c)

kind : C_R → K
Φ ≜ { (α(c), kind(c), CSF_R(c)) | c ∈ C_R }

S ≜ { file, document, … }
σ : Φ × S → artifacts
ρ_s : K → form_s
σ requires ρ_s total over kinds(Φ)
s unnamed ∨ s ∉ S ⇒ ⊥
∃ k ∈ kinds(Φ) : k ∉ dom(ρ_s) ⇒ ⊥

σ(Φ, file) ≜ { ${OUTPUT_DIR}/α(c).md | (α(c), k, x) ∈ Φ }
ρ_file(k) ≜ front-matter (kind: k, delineation) + body
∀ f ∈ σ(Φ, file) : ∃! (a, k, x) ∈ Φ : content(f) = x

σ(Φ, document) ≜ one recomposed document
ρ_document(k) ≜ rhetorical role:
    concept        ↦ definition
    process        ↦ ordered steps
    principle      ↦ constraint
    structure      ↦ table
    classification ↦ membership test
    utility        ↦ instrument
```
