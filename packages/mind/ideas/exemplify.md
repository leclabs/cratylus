---
kind: skill
name: exemplify
delineation: use this skill to optimize context - strip rot, bloat, palimpsest; increase density, coherence; resolve ambiguity; discover exemplars, derive canonical anchors, materialize composable context modules under an explicitly named strategy (file | document).
trigger: /exemplify
---

# Exemplify Skill

The [[canonical-semantic-factorization]] process realized over a context corpus — factor → anchor → emit, accepted by the round-trip. Each stage is independently invocable and owns its own operators and failure laws; this skill composes the three and owns the strategy gate, the acceptance law, and the routing manifest.

Bindings: the chain invokes [[conceptualize]] → [[signify]] → [[materialize]]; `reconstruct ≽` binds [[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]] — recomposed from the **anchors**, so a name that does not fire its idea fails ([[precise-circumscription]]); `minimal` binds [[minimalism]] · [[precise-circumscription]]; the strategy gate binds [[materialize]]'s refusal law. The symbol table is `references/formal-symbolic-notation.md`.

1. Resolve `D` from context — the input corpus (multi-modal). Require the strategy `s` up front; an unnamed strategy refuses loudly per [[materialize]]'s refusal law.
2. Invoke **conceptualize** on `D` → `C`.
3. Invoke **signify** on `C` → `A` with `R`.
4. Invoke **materialize** on `(A, s)` → `F`.
5. Accept or refuse — recompose `D`'s meaning from the **anchors** of `F ∪ Δ`, equivalent-or-better, with no fusible pair across `F`:

```text
F ≜ σ( { (η(c), kind(c), dfp(c)) | c ∈ CA(⋃ content(sources)) }, s )

D ──CA──→ C ──η──→ A ──Φ──→ σ(·, s) ──→ F

∀ idea ∈ meaning(D) : ∃! home(idea) ∈ F ∪ Δ

reconstruct(F) ≜ recomposition of D's meaning from the anchors of F ∪ Δ

fuse(cᵢ, cⱼ) ⇔ ∃ a : a circumscribes cᵢ ∪ cⱼ with no residual distinct load

minimal(F) ⇔ ¬∃ cᵢ, cⱼ ∈ F : cᵢ ≠ cⱼ ∧ fuse(cᵢ, cⱼ)

accept(F) ⇔ reconstruct(F) ≽ D ∧ minimal(F)
```

6. On accept, **emit the routing manifest** so the oracle's R3 (reconstruction-completeness, **self-application-is-mandatory**) gates mechanically. Write `.manifests/<source>.json`: one entry per fragment `c ∈ C`, keyed by `fragment_digest` (`toolkit/core/digest.fragment_digest`, NFC + whitespace-collapse + trim). A fragment homed in `F` (η resolved an existing anchor → `reuse`, or minted a new one → `mint`) goes in `routes[]`; one homed in Δ goes in `delta[]`. Every fragment lands in exactly one — an unrouted fragment is the dropped idea R3 catches.

```jsonc
{
  "source": "...", "exemplified_at": "...Z", "reader": "...",
  "routes": [ { "fragment_digest": "sha256:...", "idea_gloss": "...", "home_slug": "...", "disposition": "reuse", "rank": 0.0 } ],
  "delta":  [ { "fragment_digest": "sha256:...", "idea_gloss": "..." } ]
}
```
