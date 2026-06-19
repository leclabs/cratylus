---
kind: process
name: canonical-semantic-factorization
delineation: Factor a meaning into its bipartite normal form — primitives carry ground truth by value, composites carry only their factors' anchors by reference — by recomposing conceptualize → signify → materialize, accepted iff it reconstructs from its anchors alone.
---

# Canonical Semantic Factorization

`CSF ≜ [[conceptualize]] → [[signify]] → [[materialize]]` — dissolve the source to its [[mece]] primitives ([[conceptualize]], over the mass whose prior boundaries are dissolved per [[semantic-partition]]), anchor each ([[signify]]), emit by kind ([[materialize]]).

```text
emit(c) :
    prim(c) ⇒ η(c) + dfp(c)                       -- ground truth by value
    comp(c) ⇒ η(c) + { η(f) | f ∈ factors(c) }    -- by reference, never restated

accept(c) ⇔ reconstruct(c from η alone) ≽ meaning(c) ∧ minimal
```

`minimal` binds [[minimalism]] · [[precise-circumscription]]; the recite-defect ([[self-sufficient-formalism]]) fails it — here its tell is an un-factored composite or a wrong anchor.

## See also

- [[conceptualize]] · [[signify]] · [[materialize]] — the three stages this recomposes; each is one stage of this process.
- [[exemplify]] — CSF run over a context corpus to optimize it (the invocation, not a second definition).
- [[densest-faithful-point]] — a primitive's ground-truth grain; [[cite-dont-copy]] — a composite's by-reference grain.
- [[self-application-is-mandatory]] — the reconstruct round-trip is the accept gate.
