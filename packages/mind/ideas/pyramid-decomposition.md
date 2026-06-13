---
kind: process
delineation: Decompose a source top-down — find its one governing thesis (answer-first), branch the support into MECE groups, recurse until leaves are atomic, and admit each category only if its identity and rigidity criteria hold; the top-down analytic twin of semantic-partition's bottom-up cut.
---

# Pyramid Decomposition

**Engineer a source into a governing-thesis pyramid.** Where [[semantic-partition]] reads bottom-up — cutting a flat body into fragments by the light of priors — pyramid-decomposition works **top-down**. Resolve from context: answer-first is [[pyramid-principle]]; the no-thesis exit is [[abstain-on-non-convergence]]; the group criterion is [[mece]]; admission tests are [[identity-criteria-before-taxonomy]] · [[ontoclean-meta-properties]]:

```text
PD : S → pyramid(t)

t ≜ governing-thesis(S)               — answer-first (pyramid-principle); ∄ t ⇒ abstain-on-non-convergence

∀ node : children(node) ≜ mece groups of its support; a leak ∨ a gap ⇒ re-cut

admit(g) ⇔ identity(g) ∧ rigidity(g)  — identity-criteria-before-taxonomy · ontoclean-meta-properties

recurse until leaves are atomic; order each group logically (deductive ∨ inductive by time / structure / degree)

verify ≜ (leaves → t) ∧ (t → leaves)  — roll-up and distribution agree; a failing branch is a finding to file
```

## See also

- [[exemplar-resolution]] — the dual core operation: recovers a flat exemplar graph by prior-fit; this engineers a hierarchical pyramid by analytic test.
- [[semantic-partition]] — the bottom-up MECE cut; pyramid-decomposition is its top-down twin and shares the [[mece]] criterion.
