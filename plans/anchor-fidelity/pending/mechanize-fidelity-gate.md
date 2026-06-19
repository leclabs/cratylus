# mechanize-fidelity-gate

**State:** pending · **Owner:** Nico (spec) + Mav (build) · **Deps.** land-and-recut-anchor-cluster (phase 1)

**What (phase 3).** Mechanize the blind-decoder gate in `verify.py`. For each **primitive**: does its
anchor fire its gloss (`dec_R(α(p)) = gloss(p)`)? For each **composite**: does `REC(CSF) = intent`
(reconstruct from factor-names recovers the concept)? This automates the blind-reading test as a standing
acceptance gate — a false anchor FAILS mechanically instead of by Nico's assertion. `dec_R` is
instantiated by a reader-model decode (the blind read, mechanized at the deployed reader profile).

**Done-when.** `verify.py` runs the fidelity gate as part of the PASS gate; a planted false anchor (a
sentence-slug, a primitive whose name doesn't fire its gloss) is rejected; toolkit suite green.
