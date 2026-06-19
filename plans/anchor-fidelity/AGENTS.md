# anchor-fidelity

**Goal.** Make "true anchor" a **falsifiable, gated** property of the corpus, then re-individuate the
corpus under that gate. The `[[exemplify]]` pipeline gated _completeness_ (`reconstruct ≽ D`) and
_minimality_ (no fusible pair) but never **anchor-fidelity** — that each name actually IS the signum
that fires its concept in the reader's priors. This plan closes that gap and applies the closure.

**The model (converged — CSF v7).** Reader-relative FCA + composition. Concepts = closed
distinction-sets. **Bipartite corpus:** PRIMITIVES carry `⟨anchor, gloss⟩` — ground truth by value, the
irreducible self-definition; COMPOSITES carry `⟨anchor, {factor-names}⟩` — by reference (cite, don't
restate; agents/skills are composites that reduce to primitives). Acceptance = the **round-trip theorem**
`aptissimum ⟹ REC(CSF) = intent`, where `aptissimum-for-R ⟺ ∀ primitive p : dec_R(α(p)) = gloss(p)` —
the gate **reduces to checking each primitive's anchor fires its gloss** in the reader. `dec_R` is the
empirical reader, **instantiated by the blind-reading test**. Terminal artifact:
`packages/mind/canonical-semantic-factorization.v7.proposal.md`.

**Relation to `corpus-hardening/fresh-optimization-pass`.** That task's prose-trim was a _subset_; the
REAL deliverable — corpus-as-one-source re-individuation with every anchor _proven_, not asserted — is
**phase 4 here**, now tool-driven.

**Lead.** Nico (corpus + signify semantics). Mav for the `verify.py` machinery (phase 3).

**Done-when (plan).** Every `ideas/` cell is either a **primitive** (`anchor + gloss`) or a **composite**
(`anchor + factor-refs`); the fidelity gate is enforced in `verify.py`; the corpus round-trips under it;
no unextracted shared primitive, no sentence-slug, no false anchor survives.
