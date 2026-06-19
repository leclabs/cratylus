---
kind: skill
name: exemplify
delineation: use this skill to optimize context - strip rot, bloat, palimpsest; increase density, coherence; resolve ambiguity; discover exemplars, derive canonical anchors, materialize composable context modules under an explicitly named strategy (file | document).
trigger: /exemplify
---

# Exemplify Skill

[[canonical-semantic-factorization]] run over a context corpus. exemplify **invokes** CSF — it does not re-derive it: CSF owns the factorization (conceptualize → signify → materialize) and the per-cell accept. This skill owns only what the corpus grain adds — the strategy gate, cross-`F` minimality, and the routing manifest.

Bindings: the factorization is [[canonical-semantic-factorization]]; the strategy gate binds [[materialize]]'s refusal law; `reconstruct ≽` binds [[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]]; `minimal` / `fuse` — corpus-grain, no fusible pair across `F` — bind [[minimalism]] · [[precise-circumscription]]. The symbol table is `references/formal-symbolic-notation.md`.

1. Resolve `D` from context — the input corpus (multi-modal). Require the strategy `s` up front; an unnamed strategy refuses loudly per [[materialize]]'s refusal law.

2. `F ← ` apply [[canonical-semantic-factorization]] to `D` under `s` — CSF does factor → anchor → emit and its own per-cell accept.

3. Accept at the corpus grain — bound to this run's whole input `D`, with no fusible pair across `F` — else refuse:

```text
F ≜ CSF(D, s)                                  -- the factorization is canonical-semantic-factorization's
accept(F) ⇔ reconstruct(F) ≽ D ∧ minimal(F)    -- corpus-grain: recompose ≽ the whole input D
fuse(cᵢ, cⱼ) ⇔ ∃ a : a circumscribes cᵢ ∪ cⱼ with no residual distinct load
minimal(F) ⇔ ¬∃ cᵢ, cⱼ ∈ F : cᵢ ≠ cⱼ ∧ fuse(cᵢ, cⱼ)
```

4. On accept, **emit the routing manifest** so the oracle's R3 (reconstruction-completeness, **self-application-is-mandatory**) gates mechanically. Write `.manifests/<source>.json`: one entry per source fragment (CSF's conceptualization `C`), keyed by `fragment_digest` (`toolkit/core/digest.fragment_digest`, NFC + whitespace-collapse + trim). A fragment homed in `F` (η resolved an existing anchor → `reuse`, or minted a new one → `mint`) goes in `routes[]`; one homed in Δ goes in `delta[]`. Every fragment lands in exactly one — an unrouted fragment is the dropped idea R3 catches.

```jsonc
{
  "source": "...", "exemplified_at": "...Z", "reader": "...",
  "routes": [ { "fragment_digest": "sha256:...", "idea_gloss": "...", "home_slug": "...", "disposition": "reuse", "rank": 0.0 } ],
  "delta":  [ { "fragment_digest": "sha256:...", "idea_gloss": "..." } ]
}
```
