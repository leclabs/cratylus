---
kind: skill
name: exemplify
delineation: use this skill to optimize context - strip rot, bloat, palimpsest; increase density, coherence; resolve ambiguity; discover exemplars, derive canonical anchors, materialize composable context modules under an explicitly named strategy (file | document).
trigger: /exemplify
---

# Exemplify Skill

Optimize a context corpus into a canonical semantic factorization: the pipeline runs conceptualize → signify → materialize, then accepts iff the result is `valid`.

Resolve from context: `D` — the input corpus (multi-modal); `R` — the reader; `s` — the strategy ∈ { file, document }. The stage definienda (`C_R`, `α`, `≺`, `dec_R`, `Φ`, `σ`) flow in through the composition.

Bindings: `F` composes the pipeline [[conceptualize]] · [[signify]] · [[materialize]]; `valid` is the accept predicate of [[canonical-semantic-factorization]] (the factorization round-trips from its anchors and is minimal); the `⊥` on an unnamed `s` binds [[no-permissive-defaults]]; the R3 manifest binds [[self-application-is-mandatory]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
s = ∅ ⇒ ⊥
D ──conceptualize──→ C_R ──signify──→ (α, ≺, dec_R) ──materialize──→ F
F ≜ σ(Φ, s)
¬valid ⇒ ⊥
```

On accept, emit the R3 routing manifest — `.manifests/<source>.json`, one entry per concept `c ∈ C_R` keyed by `fragment_digest` (`toolkit/core/digest.fragment_digest`: NFC + whitespace-collapse + trim), each in `routes[]` (`α` `reuse` | `mint`) or `delta[]`, exactly one; an unrouted concept is the dropped idea R3 catches:

```jsonc
{
  "source": "...", "exemplified_at": "...Z", "reader": "...",
  "routes": [ { "fragment_digest": "sha256:...", "idea_gloss": "...", "home_slug": "...", "disposition": "reuse", "rank": 0.0 } ],
  "delta":  [ { "fragment_digest": "sha256:...", "idea_gloss": "..." } ]
}
```
