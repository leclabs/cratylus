---
kind: skill
name: materialize
delineation: use this skill to realize a fragment set as artifacts under an explicitly named strategy — fragments carry (anchor, kind, content); each strategy declares its kind-consumption table ρ; an unnamed strategy or a missing ρ row refuses loudly, never defaults; stage 3 of exemplify, independently invocable.
trigger: /materialize
---

# Materialize Skill

Resolve from context: `A` + contents — the anchored fragments from [[signify]], or supplied directly; `s` — the strategy, REQUIRED from the caller; `${OUTPUT_DIR}` — file strategy only.

Bindings: `dfp` binds [[densest-faithful-point]]; the refusal laws bind [[hoare-elegance-no-permissive-defaults]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
K ≜ the closed kind set

kind : A → K

Φ ≜ { (a, kind(a), content(a)) | a ∈ A }

∀ (a, k, c) ∈ Φ : c = dfp(c)

prose(c) ≜ render(dfp(c), reader)

prose(c) is a projection, never stored beside c

S ≜ { file, document, … }

σ : Φ × S → artifacts

ρ_s : K → form_s

σ requires ρ_s total over kinds(Φ)

s unnamed ∨ s ∉ S ⇒ ⊥

∃ k ∈ kinds(Φ) : k ∉ dom(ρ_s) ⇒ ⊥

σ(Φ, file) ≜ { ${OUTPUT_DIR}/a.md | (a, k, c) ∈ Φ }

ρ_file(k) ≜ front-matter (kind: k, delineation) + body

∀ f ∈ σ(Φ, file) : ∃! (a, k, c) ∈ Φ : content(f) = c

σ(Φ, document) ≜ one recomposed document

ρ_document(k) ≜ rhetorical role:
    concept        ↦ definition
    process        ↦ ordered steps
    principle      ↦ constraint
    structure      ↦ table
    classification ↦ membership test
    utility        ↦ instrument
```
