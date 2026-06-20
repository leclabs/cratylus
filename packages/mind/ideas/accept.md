---
kind: process
delineation: the pipeline's acceptance gate — run the corpus's own acceptance test on a fully-realized factorization and commit the accept/reject verdict, refusing loudly when it fails; accept iff `valid` (the bipartite normal form reconstructs equivalent-or-better from its anchors and is minimal), so a factorization that loses meaning or carries a redundant concept never passes.
---

# Accept

The gate the CSF pipeline is judged by: take a fully-realized concept — all three contract fields filled — and commit the verdict that it is or is not a canonical factorization. Acceptance is the corpus's own test ([[self-application-is-mandatory]]): round-trip equivalent-or-better is the criterion, no anchor grandfathered. The gate commits a verdict and emits no new content — it is the only stage that may refuse the work outright.

Resolve from context: the realized concept(s) under judgment, drawn from the lattice `C_R`, each carrying its filled `factorization` and `anchor`; `R` — the reader whose priors fix every meaning.

Bindings: `accept` runs the predicate `valid` of [[canonical-semantic-factorization]] — the round-trip reconstruction `REC_R ≽` ([[round-trip-fidelity]]) conjoined with `minimal` ([[minimalism]]); the loud refusal on failure binds [[no-permissive-defaults]] (a gate that cannot pass must refuse, never wave through). It is invoked on the [[concept-contract]] record after [[materialize]] fills the `factorization` field — a `factorization = ⊥` is unrealized and cannot be judged. The symbol table is `references/formal-symbolic-notation.md`.

```text
realized(k) ⇔ factorization(k) ≠ ⊥

accept : ℘(Concept) → ℘(Concept)
∃ k ∈ K : ¬realized(k) ⇒ ⊥                       -- cannot judge an unrealized concept
accept(K) ≜ K                  ,  valid(K)        -- pass: the verdict carries the work forward unchanged
accept(K) ≜ ⊥                  ,  ¬valid(K)       -- refuse: loud, never a silent drop
```
