<!-- ^accept -->
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
<!-- ^anchor-routing -->
---
kind: process
delineation: Place each fragment at the anchor whose latent priors most precisely circumscribe it — best-fit, not nearest-bin; mint the anchor if none exists (the anchor-set is open); a genuine multi-match means the partition cut wrong, re-cut.
---

# Anchor Routing

Best-fit is [[precise-circumscription]]'s argmin over the exemplar the fragment projects from — **recognizing** that exemplar, not manufacturing a category by erasing detail ([[projection-is-not-the-source]]).

- **Mint when none fits.** [[minimalism]] forbids duplicates and speculation, not genuine new primitives.
- **Multi-match (one fragment, two unrelated anchors)** means [[semantic-partition]] cut too coarse — re-cut so each unit carries a single intelligible load.
- **Its dual — one best-fit anchor over two cells with no residual distinct load** — means the cut was too fine: **fuse them** ([[minimalism]]).

The **anchor-space varies by use** — exemplars for the corpus, orthogonal concerns for a plan ([[shard-by-orthogonal-concern]]), context-slots for a context window — but the operation is identical.

## See also

- [[semantic-partition]] — produces the fragments this places.
- [[exemplar-resolution]] — the corpus-intake composition that invokes this.
<!-- ^archetype-instantiation -->
---
kind: process
delineation: Stand up a project-scope agent species from a universal archetype + scope grants — project the archetype's composed graph at the density the deployment's reader needs, apply the grant stack, bind extrinsic facets per deployment, verify round-trip.
---

# Archetype Instantiation

The inverse of [[exemplar-resolution]] applied to an agent cell:

1. **Resolve the archetype.** Project the agent cell ([[agent-identity-facets]] facets + its composed `[[ ]]` graph) at the density the deployment's reader needs ([[reader-prior-projection]]).
2. **Apply the grant stack.** Layer the scope's grants ([[scope-grant]]) without mutating the kernel ([[substance-over-accident]]).
3. **Bind extrinsic facets.** Supply the deployment-issued facets the archetype leaves open ([[agent-identity-facets]]): keypair, tools, harness posture.
4. **Seed the self.** Create `{home}/{agent}/` and initialize its [[continuity-thread]] (`SELF.md`) for the [[memory]] wake protocol.
5. **Verify by round-trip** ([[self-application-is-mandatory]]): the instance reconstructs the archetype + named accidents equivalent-or-better; a step that can't is a finding.

The emitted artifact records its provenance ([[generated-artifact-provenance]]) for regeneration when the archetype moves, without clobbering local edits ([[regenerate-without-clobbering]]).

## See also

- [[exemplar-resolution]] — the forward method; instantiation is its inverse on an agent cell.
- [[agent-retirement]] — the lifecycle bookend: standup seeds the self, retirement archives it on exit.
- [[scope-grant]] · [[substance-over-accident]] — the accident layer and the rule it obeys.
- [[commons-distribution]] — where the archetype is sourced from across scopes.
- [[continuity-thread]] · [[memory]] — the self the standup seeds so the species persists.
<!-- ^dont-blind-wait -->
---
kind: process
delineation: Don't freeze on an event the harness can't notify you about — launch exactly one background poll (an until-loop that exits on the condition) so the harness re-invokes you when it fires; at most one watcher at a time.
---

# Don't Blind-Wait

The one-watcher constraint is a lifecycle: stop the old before arming a new, and retire it once the Operator is active.

## See also

- [[never-go-silent]] — the reachability principle this technique serves.
- [[permission-is-not-the-act]] — the same don't-block discipline applied to a _human approval_.
<!-- ^exemplar-resolution -->
---
kind: process
delineation: The method's core operation — resolving information to the exemplars it projects from; the CSF op-chain `produce → name → realize` (cut at meaning joints, anchor each to its σ*_R, emit the bipartite factorization), gated by round-trip accept; run forward as intake, inverse as reconstruction.
---

# Exemplar Resolution

The inverse of exemplar-projection. [[exemplify]] is its formal statement: the op-chain `realize ∘ name ∘ produce` over the [[concept-contract]] record — its `realize` step emitting the [[canonical-semantic-factorization]] normal form — gated by [[accept]].

```text
produce ≜ resolve · semanticPartition · depalimpsest · distill   — cut the mass at meaning joints, strip palimpsest, drive to the deepest-faithful unit
name    ≜ canonical_anchor · coalescence                         — each concept to its σ*_R; fuse those that resolve to one anchor
realize ≜ CSF                                                    — emit the canonical factorization in its normal form
Δ       ≜ the source's deltas beyond the corpus
```

Compression to the [[densest-faithful-point]] runs at every grain ([[precise-circumscription]]). Verify by round-trip ([[self-application-is-mandatory]]); a step that can't is a finding to file.

`semanticPartition` + `canonical_anchor` ([[semantic-partition]] + [[anchor-routing]]) are the shared core: plan sharding and context-window optimization run the same cut-and-route over a different anchor-space.

## See also

- [[exemplify]] — the formal statement; the invocable skill.
- [[principal-agency]] — the disposition to run this unprompted.
<!-- ^pyramid-decomposition -->
---
kind: process
delineation: Decompose a source top-down — find its one governing thesis (answer-first), branch the support into MECE groups, recurse until leaves are atomic, and admit each category only if its identity and rigidity criteria hold; the top-down analytic twin of semantic-partition's bottom-up cut.
---

# Pyramid Decomposition

Answer-first is [[pyramid-principle]]; the no-thesis exit is [[abstain-on-non-convergence]]; the group criterion is [[mece]]; admission tests are [[identity-criteria-before-taxonomy]] · [[ontoclean-meta-properties]]:

```text
PD : S → pyramid(t)

t ≜ governing-thesis(S)               — answer-first (pyramid-principle); ∄ t ⇒ abstain-on-non-convergence

∀ node : children(node) ≜ mece groups of its support; a leak ∨ a gap ⇒ re-cut

admit(g) ⇔ identity(g) ∧ rigidity(g)  — identity-criteria-before-taxonomy · ontoclean-meta-properties

recurse until leaves are atomic; order each group logically (pyramid-principle)

verify ≜ (leaves → t) ∧ (t → leaves)  — roll-up and distribution agree; a failing branch is a finding to file
```

## See also

- [[exemplar-resolution]] — the dual core operation: recovers a flat exemplar graph by prior-fit; this engineers a hierarchical pyramid by analytic test.
- [[semantic-partition]] — the bottom-up MECE cut; pyramid-decomposition is its top-down twin and shares the [[mece]] criterion.
<!-- ^re-anchoring-protocol -->
---
kind: process
delineation: Counter context-drift by re-installing durable anchors mid-session — surface the agent's believed context (a cognizant dump), diff against canon, re-point each divergence to its canonical home, persist out-of-band; re-anchor, don't re-load.
---

# Re-Anchoring Protocol

**Context-drift**: [[context-pathologies]] (Attention Dilution + Corrective Spiral) observed over time.

1. **Surface.** Trigger a [[cognizant]] dump; drift shows as omissions, mutations, or invented constraints.
2. **Diff against canon.** Compare to the load-bearing sources (CLAUDE.md, the plan, the task spec); each divergence is a drift point.
3. **Re-install anchors.** Restate each canonical anchor as a short, high-salience pointer ([[cite-dont-copy]]).
4. **Persist out-of-band** so a compaction or fresh session re-hydrates from canon, not the drifted set.

## See also

- [[cognizant]] — produces the diagnostic dump that seeds step 1.
- [[context-pathologies]] — drift is Attention Dilution + Corrective Spiral over time.
- [[context-not-prose]] — an anchor points; it never restates.
<!-- ^semantic-partition -->
---
kind: process
delineation: Bring the whole body of content to distinction — read the entire union of inputs and the existing corpus as one undifferentiated mass, prior file/cell boundaries dissolved as mere projections, and cut it into non-overlapping, collectively-exhaustive segments each projecting from exactly one exemplar; a fragment that fits two unrelated anchors means the cut was wrong, re-cut.
---

# Semantic Partition

The opening move of [[exemplar-resolution]]: cut the mass into [[mece]] units, reading past surface noise by [[read-by-priors-not-surface]].

Prior cell and file boundaries are projections of an earlier cut ([[projection-is-not-the-source]]) — dissolve them, and grandfather no existing anchor ([[self-application-is-mandatory]]).

The one-exemplar test is downstream: a fragment that fits two _unrelated_ anchors under [[anchor-routing]] was cut wrong — re-cut.

Recognize joints already in the material; never impose a convenient grid on it.

## See also

- [[anchor-routing]] — places each fragment this produces.
- [[exemplar-resolution]] — the composition this opens.
- [[abstain-on-non-convergence]] — when the traces yield no clean joints, say so rather than force a cut.
