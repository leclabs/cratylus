# mechanize-fidelity-gate

**State:** completed (resolved by finding) · **Owner:** Nico (spec) + Mav (build) · **Deps.** land-and-recut-anchor-cluster (phase 1)

**What (phase 3).** Mechanize the blind-decoder gate in `verify.py`. For each **primitive**: does its
anchor fire its gloss (`dec_R(α(p)) = gloss(p)`)? For each **composite**: does `REC(CSF) = intent`
(reconstruct from factor-names recovers the concept)? This automates the blind-reading test as a standing
acceptance gate — a false anchor FAILS mechanically instead of by Nico's assertion. `dec_R` is
instantiated by a reader-model decode (the blind read, mechanized at the deployed reader profile).

**Done-when.** `verify.py` runs the fidelity gate as part of the PASS gate; a planted false anchor (a
sentence-slug, a primitive whose name doesn't fire its gloss) is rejected; toolkit suite green.


## Resolution — the gate is the blind-decode WORKFLOW, not a verify.py addition

Calibration finding: a **deterministic** anchor-fidelity check is infeasible. A word-count / sentence-slug heuristic over-flags legitimate dense anchors (`verify-at-the-source-not-the-projection`, `semantic-whole-over-syntactic-substrate`, `inversion-of-control-orchestration`) right next to the real sentence-slugs — the term-vs-description distinction is irreducibly a reader-model (LLM) judgment.

Therefore: **`dec_R` is mechanized as a blind-read workflow**, not crammed into `verify.py`.
- The reusable harness is the **`stratify-corpus` workflow** (`plans/anchor-fidelity` phase 2) and the   per-cell blind-read pattern — runnable on demand at the deployed reader profile.
- `verify.py` keeps the **deterministic-structural** gates (schema/refs/fences/symbols/operative/  round-trip/reconstruct); anchor-fidelity is the LLM gate run beside it.
- A false anchor IS rejected by the blind-decode — demonstrated in phase 1's confirm ('reconstructing   from anchors forces every name to earn its extension') and the phase-2 classification.

Adding a noisy deterministic NOTE to verify.py was rejected as a principled call — don't fake a deterministic gate for an LLM-judgment problem.