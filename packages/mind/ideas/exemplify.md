---
kind: skill
name: exemplify
delineation: use this skill to optimize context - strip rot, bloat, palimpsest; increase density, coherence; resolve ambiguity; discover exemplars, derive canonical anchors, materialize composable context modules under an explicitly named strategy (file | document).
trigger: /exemplify
---

# Exemplify Skill

Chains [[conceptualize]] → [[signify]] → [[materialize]] end-to-end. Each stage is independently invocable and owns its operators and failure laws; this skill owns only the chain, the strategy gate, and the acceptance law — which binds [[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]].

1. Resolve `D` from context — the input corpus (multi-modal). Require the strategy `s` up front:

```text
s unnamed ⇒ ⊥
```

2. Invoke [[conceptualize]] on D → C.
3. Invoke [[signify]] on C → A with R.
4. Invoke [[materialize]] on (A, s) → F.
5. Accept or refuse:

```text
F ≜ σ( { (η(c), kind(c), dfp(c)) │ c ∈ CA(⋃ content(sources)) }, s )

D ──CA──→ C ──η──→ A ──Φ──→ σ(·, s) ──→ F

∀ idea ∈ meaning(D) : ∃! home(idea) ∈ F ∪ Δ

reconstruct(F) ≜ recomposition of D's meaning from F ∪ Δ

accept(F) ⇔ reconstruct(F) ≽ D

¬accept(F) ⇒ ⊥
```
