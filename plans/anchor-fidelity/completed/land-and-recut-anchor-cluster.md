# land-and-recut-anchor-cluster

**State:** completed · **Owner:** Nico · **Deps.** csf-formalism, csf-pilot-validation (both done)

**What (phase 1).** Land the model into the pipeline and prove it on the hardest cluster — the one that
started this — before touching the rest of the corpus.

1. **Land the formal block.** Fold CSF into `ideas/signify.md` (the operation: compute `CSF_R` —
   factor a concept into its canonical minimal constituents) and `ideas/exemplify.md` (the acceptance
   law: the round-trip `aptissimum ⟹ REC(CSF)=intent` joins / supersedes the CE∧ME-only `accept`).
2. **Re-cut the `anchor` cluster** per the pilot: **extract the argmin primitive** (the
   minimize-symmetric-difference criterion; signify the anchor — lean: keep `precise-circumscription` as
   the grain-neutral primitive, since its delineation already states the general criterion; grain-neutral
   rename is the alternative to weigh); **re-express `densest-faithful-point`** as that primitive +
   expression-grain differentia (cite, don't restate); **fuse `anchoring-is-self-similar`** into the
   primitive's scale-invariance; **keep `anchor`** as the name-object.

**Done-when.** `signify`/`exemplify` carry the CSF acceptance law; the `anchor` cluster is re-individuated
(no unextracted shared primitive); `verify.py` PASS; a blind-`@nico` read confirms the re-cut cluster
round-trips and reads cleaner than before.


## Done (worktree branch `worktree-anchor-fidelity`)

- Cluster re-cut (`7b54265`): precise-circumscription = grain-neutral argmin primitive; densest-faithful-point = its expression-grain instance; anchoring-is-self-similar fused + deleted (6 referrers + README re-pointed). verify.py PASS (150 exemplars).
- Acceptance law landed (`643066e`): exemplify's `reconstruct` now recomposes from the **anchors** of F (each name fired by reader priors alone) — the anchor-fidelity gate. verify.py PASS; toolkit 14/14.
- Blind-@nico confirmed: cluster reads as clean genus/instance; acceptance law understood from the page ("reconstructing from anchors forces every name to earn its extension"). One note for phase 2: confirm `latent-priors` owns the shared prior-region primitive both criteria stand on.
