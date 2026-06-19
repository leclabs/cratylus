# stratify-corpus

**State:** completed · **Owner:** Nico · **Deps.** land-and-recut-anchor-cluster (phase 1)

**What (phase 2).** Classify all 151 `ideas/` cells as **primitive** (join-irreducible — must carry a
`gloss`, its ground truth) or **composite** (factors into other concepts — carries only `[[ref]]`s to its
canonical factors). Produce the stratification: per cell, its class and either its gloss (primitive) or
its factorization `F_R` (composite). Flag the cells that need work: primitives missing a gloss, composites
restating instead of citing, sentence-slugs (descriptive names hiding composites).

**Done-when.** Every cell is labeled primitive/composite with its gloss or factorization; the worklist of
non-conforming cells is enumerated for phase 4.


## Done

Full-coverage classification workflow (150/150 cells): **120 primitive, 30 composite**, **2 non-conforming** (`hoare-elegance-no-permissive-defaults`, `subsidiarity-net-zero-corrections` — both sentence-slugs). Zero composites restate (all cite-don't-copy); zero unextracted shared primitives; `latent-priors` confirmed owns the prior-region. The corpus was already clean apart from the worklist.
