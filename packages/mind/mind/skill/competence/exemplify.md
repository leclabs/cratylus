---
kind: skill
name: exemplify
delineation: use this skill to optimize context - strip rot, bloat, palimpsest; increase density, coherence; resolve ambiguity; discover exemplars, derive canonical anchors, materialize composable context modules under an explicitly named strategy (file | document).
trigger: /exemplify
---

# Exemplify Skill

Optimize a context corpus into a canonical semantic factorization: the pipeline composes `produce → name → realize` over the one [[concept-contract]] record, then the gate accepts iff the result is `valid`.

Resolve from context: `D` — the input corpus (multi-modal); `R` — the reader; `s` — the strategy ∈ { file, document }. The stages flow the [[concept-contract]] record forward, each filling its field; the gate reads the realized record.

Bindings: the pipeline composes [[conceptualize]] (`produce` — fills `gloss`) · [[signify]] (`name` — fills `anchor`) · [[materialize]] (`realize` — fills `factorization`), each a function over the [[concept-contract]] record naming no peer; [[accept]] gates the result on `valid` of [[canonical-semantic-factorization]] (the factorization round-trips from its anchors and is minimal), refusing loudly otherwise; the `⊥` on an unnamed `s` binds [[no-permissive-defaults]]; the R3 manifest binds [[self-application-is-mandatory]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
s = ∅ ⇒ ⊥
F(D) ≜ realize( name( produce(D) ) )             -- each stage fills one field of the Concept record
exemplify(D) ≜ accept( F(D) )                    -- accept refuses unless valid
```

On accept, emit the R3 routing manifest — `.manifests/<source>.json`, one entry per concept `c ∈ C_R` keyed by `fragment_digest` (`toolkit/core/digest.fragment_digest`: NFC + whitespace-collapse + trim), each in `routes[]` (`α` `reuse` | `mint`) or `delta[]`, exactly one; an unrouted concept is the dropped idea R3 catches:

```jsonc
{
  "source": "...", "exemplified_at": "...Z", "reader": "...",
  "routes": [ { "fragment_digest": "sha256:...", "idea_gloss": "...", "home_slug": "...", "disposition": "reuse", "rank": 0.0 } ],
  "delta":  [ { "fragment_digest": "sha256:...", "idea_gloss": "..." } ]
}
```
