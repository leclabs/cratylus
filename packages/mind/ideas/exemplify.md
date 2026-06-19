---
kind: skill
name: exemplify
delineation: use this skill to optimize context - strip rot, bloat, palimpsest; increase density, coherence; resolve ambiguity; discover exemplars, derive canonical anchors, materialize composable context modules under an explicitly named strategy (file | document).
trigger: /exemplify
---

# Exemplify Skill

[[canonical-semantic-factorization]] over a context corpus — composes [[conceptualize]] → [[signify]] → [[materialize]], gated by the round-trip.

Resolve from context: `D` — the input corpus (multi-modal); `s` — the strategy ∈ { file, document }.

Bindings: `reconstruct ≽` binds [[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]]; `minimal` binds [[minimalism]] · [[precise-circumscription]]; the `⊥` on an unnamed `s` binds [[materialize]]'s refusal law. The symbol table is `references/formal-symbolic-notation.md`.

```text
s = ∅ ⇒ ⊥

F ≜ σ( { (η(c), kind(c), dfp(c)) | c ∈ CA(⋃ content(D)) }, s )
D ──CA──→ C ──η──→ A ──Φ──→ σ(·, s) ──→ F
∀ idea ∈ meaning(D) : ∃! home(idea) ∈ F ∪ Δ
fuse(cᵢ, cⱼ) ⇔ ∃ a : a circumscribes cᵢ ∪ cⱼ with no residual distinct load
minimal(F)   ⇔ ¬∃ cᵢ, cⱼ ∈ F : cᵢ ≠ cⱼ ∧ fuse(cᵢ, cⱼ)
accept(F)    ⇔ reconstruct(F) ≽ D ∧ minimal(F)     -- recompose from the anchors of F ∪ Δ
¬accept(F)   ⇒ ⊥
```

On accept, emit the R3 routing manifest ([[self-application-is-mandatory]]) — `.manifests/<source>.json`, one entry per fragment `c ∈ C` keyed by `fragment_digest` (`toolkit/core/digest.fragment_digest`: NFC + whitespace-collapse + trim), each in `routes[]` (η `reuse` | `mint`) or `delta[]`, exactly one; an unrouted fragment is the dropped idea R3 catches:

```jsonc
{
  "source": "...", "exemplified_at": "...Z", "reader": "...",
  "routes": [ { "fragment_digest": "sha256:...", "idea_gloss": "...", "home_slug": "...", "disposition": "reuse", "rank": 0.0 } ],
  "delta":  [ { "fragment_digest": "sha256:...", "idea_gloss": "..." } ]
}
```
