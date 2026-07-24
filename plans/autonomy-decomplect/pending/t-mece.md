# T-mece — decomplect the three autonomy axes into their correct homes

## Objective

`autonomy` is one SET dimension holding three orthogonal axes (decision-authority · loop-position ·
escalation) as members typed identically. Separate them so each axis is addressable on its own, without
re-asserting what the pole already entails. The *how* — three distinct dimensions vs self-identifying
members within `autonomy` — is decided here against the oracle and the MODEL, not pre-chosen.

## Static inputs

- `packages/agent-canon/src/dimensions/autonomy/*.ts` — all five members.
- `packages/agent-forge/src/anatomy/index.ts` — the `Autonomy` Fragment type + `arity: 'set'`; the
  `DimensionName` registry (whether a new dimension is a MODEL change).
- `MODEL.md`, `ENGINE.md` — a dimension split touches the catalog structure; confirm consistency with
  the apex triad (a MODEL revision is allowed; a VISION conflict is surfaced, never unilaterally edited).
- T-persist output (loop-position's settled nature: phase-state), T-escalation output
  (mission-command's settled home), T-vector output (the net standing pole).

## Constraints

- **The pole is not re-asserted.** The cold-decode showed decision-authority = principal already carries
  "operator owns goals, I own means, irreversible confirmed." A separated loop-position/escalation axis
  states only what the pole leaves open, never a restatement.
- Loop-position, being phase-state (T-persist), is not a static value co-equal with the others — its
  representation must reflect that (initial value + transition), wherever it lands.
- MECE: after the split, no two axes overlap and their union covers the autonomy concept
  (`⋃ = autonomy ∧ pairwise-disjoint`).
- If the split is a MODEL-level change (new dimension names), it is a signification act on the catalog —
  cold-verify each new dimension name, and update the `MODEL`/anatomy consistently (both the byte-lock
  and the registry paths, per `first-instance-of-a-Kind`).

## Dependencies

`T-persist`, `T-escalation`, `T-vector`.

## Outputs

- The decomplected structure: either N new dimension cells or N self-identifying members, with each
  axis's value cold-verified.
- Updated nico/mav vectors selecting from the new structure.
- `MODEL`/anatomy updated if the split is model-level.

## Acceptance

- Each of the three axes is independently addressable; a cold reader of the resulting SOUL section
  attributes each line to exactly one axis (who-decides / where-human-sits / when-escalate) with no
  overlap and no re-assertion of the pole.
- **Falsifier:** two members cold-decode to overlapping concepts; or any member restates what the pole
  already entails; or loop-position is re-encoded as a static co-equal value; or the split leaves a
  dangling reference (caught by T-sweep, but a structural miss here fails the shard).
