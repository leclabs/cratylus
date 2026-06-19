# memory-tool-bundling — charter

**Goal.** Make a skill's runtime arm travel with the skill. Concretely: relocate the
`episodic` runtime from the standalone `@leclabs/koine-episodic` package into a bundled
companion asset of the `memory` organ, deployed to every fleet host, so the memory rituals
have their tool wherever they run — with zero repo dependency on the host.

**Why.** A package stays in the repo; a skill deploys to every host as culture. Putting the
runtime arm in a package meant it never reached the hosts that need it (the cross-device
trigger gap the Operator hit on 2026-06-19). The fix is co-location: the deployed artifact
sits next to the skill and ships with it.

**Founder split.**
- **Mav (substrate / machinery).** The companion-asset deploy capability (cell reader +
  placers), the `episodic` build/bundle, package retirement, the dual-deploy machinery, the
  fleet cutover.
- **Nico (constitution / culture).** The cell-structure ruling (dir-form), the `memory.md`
  Protocol edit naming the affordance, the `wake.md` migrate-trigger edit, signify/anchors.

**Acceptance discipline.**
- **Golden master.** The 11 existing skills and every agent SOUL deploy byte-identical
  except the deliberately-scoped Protocol change — enumerate any hash delta.
- **CE ∧ ME** on any cell edit (Nico's gate): reconstructs AND nothing redundant.
- **Correctness preserved.** `episodic`'s atomic `compact` (never-truncate-in-place) and the
  two-leg `assertNoLoss` keep their test suite green through the move.
- **`verify.py` PASS** after any corpus change; the verbatim-organ regression (agents ×
  readers byte-diff) stays clean.

**Base.** Branched off `origin/main` (corpus-hardening is actively advancing — re-sync before
each execution phase).
