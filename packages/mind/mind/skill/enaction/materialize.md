---
kind: skill
name: materialize
delineation: use this skill to realize a concept lattice as artifacts — select each concept's canonical factorization `F_R`, emit the bipartite normal form `CSF_R` (a primitive by value as ⟨anchor, gloss⟩, a composite by reference as ⟨anchor, factor-anchors⟩), then realize under an explicitly named strategy whose kind-consumption table ρ refuses loudly when unnamed; stage 3 of exemplify, independently invocable.
trigger: /materialize
---

# Materialize Skill

The chain's emit op: `CSF`. Select each concept's canonical factorization, emit the bipartite normal form `CSF_R`, and realize it as artifacts under a named strategy. This stage `realize`s the [[concept-contract]] record: it fills the `factorization` field, preserving the `gloss` and `anchor` — and an unnamed concept (`anchor = ⊥`) cannot be realized.

Resolve from context: the `name`d [[concept-contract]] records — each carrying its `gloss` and `anchor` field, drawn from the lattice `C_R` (with `prim_R`, `gloss`, `fac_R`, the order `≺`); `s` — the strategy, REQUIRED from the caller; `${OUTPUT_DIR}` — file strategy only.

Bindings: `dfp` binds [[densest-faithful-point]] (a primitive's stored gloss); `CSF_R` reads each unit's `anchor` from the [[concept-contract]] record (never recomputes it) and emits the composite by reference [[cite-dont-copy]] (cite factor-anchors, never restate); the refusal laws bind [[no-permissive-defaults]]; the stage fills the `factorization` field of [[concept-contract]] (`gloss`, `anchor` preserved; `¬named ⇒ realize = ⊥`). The symbol table is `references/formal-symbolic-notation.md`.

```text
K          — the closed kind set

F_R(m) ≜ min_≺ fac_R(m)
CSF_R(c) ≜ ( anchor(c) , dfp(gloss(c)) )            ,  prim_R(c)       -- anchor read from the record, not recomputed
CSF_R(c) ≜ ( anchor(c) , { anchor(p) | p ∈ F_R(c) } ) ,  ¬prim_R(c)
realize(k) fills factorization(k) ≜ CSF_R(k) ; gloss(k), anchor(k) preserved
anchor(k) = ⊥ ⇒ realize(k) = ⊥                    -- cannot realize an unnamed concept

prose(c) ≜ render(CSF_R(c), R)
prose(c) is a projection, never stored beside CSF_R(c)

kind : C_R → K
Φ ≜ { (anchor(c), kind(c), CSF_R(c)) | c ∈ C_R }

S ≜ { file, document, … }
σ : Φ × S → artifacts
ρ_s : K → form_s
σ requires ρ_s total over kinds(Φ)
s unnamed ∨ s ∉ S ⇒ ⊥
∃ k ∈ kinds(Φ) : k ∉ dom(ρ_s) ⇒ ⊥

σ(Φ, file) ≜ { ${OUTPUT_DIR}/anchor(c).md | (anchor(c), k, x) ∈ Φ }
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
