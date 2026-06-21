# reconstruction-gate

**Objective.** Prove the σ\*\_R pass lost no meaning and reduced prose: full reconstruction +
byte-identity gates, with the deliberate anchor/prose deltas enumerated.

**Preconditions.** `signify/signify-star-r-pass` complete.

**Operations.** Run `verify.py` (schema + references + CE ∧ ME + R1/R2/R3 reconstruction); diff the
rendered fleet vs a pre-pass baseline and **enumerate every delta** as intended (anchor renames,
prose minimization); confirm total corpus prose dropped (harvest re-run shows lower prose_ratio).

**Artifacts.** `plans/corpus-signify-pass/research/post-pass-diff.md`.

**Acceptance (blind test).** `verify.py` PASS; every rendered-fleet delta is listed + justified;
re-harvest shows measurably less prose and fewer duplicate clusters than the pre-pass baseline.
