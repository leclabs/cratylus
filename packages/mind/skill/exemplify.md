---
kind: skill
anchor: exemplify
delineation: optimize a context corpus into a canonical semantic factorization — compose produce → name → realize over the one concept-contract record, then gate on accept; emits the R3 routing manifest that catches the dropped idea.
trigger: /exemplify
---

# Exemplify

The CSF pipeline as one composition over the [[concept-contract]] record: each stage fills one field, then the gate reads the realized record and refuses unless `valid`.

Resolve from context: `D` — the input corpus (multi-modal); `R` — the reader whose priors fix every meaning; `s` — the strategy ∈ { file, document }.

Bindings: the pipeline composes [[conceptualize]] (`produce` — fills `gloss`) · [[signify]] (`name` — fills `anchor`) · [[materialize]] (`realize` — fills `factorization`), each a function over the [[concept-contract]] record naming no peer; [[accept]] gates on `valid` of [[canonical-semantic-factorization]] (the factorization round-trips from its anchors and is minimal), refusing loudly otherwise; the `⊥` on an unnamed `s` binds [[no-permissive-defaults]] (`ρ_s` total over the kinds in scope else `⊥`); the R3 manifest binds [[self-application-is-mandatory]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
s = ∅ ⇒ ⊥
F(D)        ≜ realize( name( produce(D) ) )      -- each stage fills one field of the Concept record
exemplify(D) ≜ accept( F(D) )                    -- accept refuses unless valid
```

On accept, emit the **R3 routing manifest** — `.manifests/<source>.json`, one entry per concept `c ∈ C_R` keyed by `fragment_digest` (`toolkit/core/digest.fragment_digest`: NFC + whitespace-collapse + trim), each in `routes[]` (`α` · `reuse` | `mint`) or `delta[]`, exactly one. An unrouted concept is the dropped idea R3 catches.

```jsonc
{
  "source": "...", "exemplified_at": "...Z", "reader": "...",
  "routes": [ { "fragment_digest": "sha256:...", "idea_gloss": "...", "home_slug": "...", "disposition": "reuse", "rank": 0.0 } ],
  "delta":  [ { "fragment_digest": "sha256:...", "idea_gloss": "..." } ]
}
```
