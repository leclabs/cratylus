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

---

## Decision (executed) — self-identifying members, NOT new dimensions

**How settled:** grounded in MODEL + the oracle, not preference. MODEL's PARTITIONED
(`|home(c)|=1 ∧ disjoint(homes)`) requires each axis-concept one signified home — it
does NOT force three Dimensions; three self-identifying members satisfy it. With
`parsimony` (nico's objective), the corpus precedent (`π_decision-authority(self) =
principal` already self-identifies), and autonomy-as-composed-standing (D5), the
resolution is members-within-`autonomy`, not a catalog explosion (22→24). Type
separation would not have prevented the pole inversion (a mis-signified scalar
dimension fails identically); the actual guard is introspect's `misnomer` axis
(T-introspect-K), so the structural minimalism loses no defect coverage.

**The MECE structure (cold-verified):**
```
π_decision-authority(self) = principal              — who-decides
human-on-the-loop ⟨resting · phase-state⟩           — where-the-human-sits
mission-command ⟨escalate ⇔ fork(irreversible · value · competence)⟩ — when-escalate
```
Cold read (isolated, tools denied) attributes each line to exactly one aspect (who
decides / how the human watches / when to escalate), reads line 2 as changeable (the
`⟨resting · phase-state⟩` residue is the tell — defeats the static-co-equal
falsifier), finds no overlap, and confirms no line re-asserts the pole (lines 2–3
presuppose it, never restate).

**Only value change:** `human-on-the-loop` → `human-on-the-loop ⟨resting · phase-state⟩`.
The π-prefix form was rejected as over-applying decision-authority's
`pole-value ≠ counterpart-role` disambiguation where it isn't needed (bare
`human-on-the-loop` does not invert at R=self). Anchor preserved ⇒ `.startsWith`
catalog tests hold; residue-suffix matches the corpus pattern
(`human-out-of-the-loop ⟨intent-before · audit-after⟩`). decision-authority +
mission-command unchanged (T-vector / T-escalation). No MODEL/anatomy change.
Reference reconciliation → T-sweep.
