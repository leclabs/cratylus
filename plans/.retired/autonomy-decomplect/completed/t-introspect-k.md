# T-introspect-K — add the `def-defect` member to introspect's cause set

## Objective

`introspect`'s cause set `K` is entirely **configurational** (harness-override · deploy-drift ·
profile-projection · transient-elevation · composer-dropped · env-conditioned · unobservable). It cannot
name the case that hid the pole inversion for a whole session: **the declared value is itself wrong** —
rt conformed to def, and the def was the defect. Run during that failure, introspect would have flagged
the _correct_ behavior as the divergence. Add a member so introspect can name a def-level defect.

## Static inputs

- `packages/canon/src/skills/introspect/skill.ts` — `K ≜ { … }` (declarations block) and
  `¬ edit(agent/<A>.md)` (the repair-forbidden law).
- The session record where introspect misreported Autonomy (`div` with `why = transient-elevation`,
  when the truth was `def is wrong`).

## Constraints

- Signify the new member against the oracle — do not coin. It names "the value loaded correctly, was
  legible, was not overridden, and is nonetheless the wrong address for the concept." Candidate to
  cold-verify (not to adopt on sight): `def-defect` / `ill-signified` / `mis-addressed`.
- `introspect` still may not edit the SOUL (`¬ edit(agent/<A>.md)` stays) — but on a `def-defect` finding
  it must **route** to the repair path (signify → create-agent/deploy), not silently classify it as a
  configurational cause. Encode that routing.
- Keep the block self-sufficient (no comments; the σ\* carries it) per the canon's formal-block law.

## Dependencies

None — a different cell from the autonomy dimension; rides any wave.

## Outputs

- `introspect/skill.ts` with the new `K` member + the routing law for a def-defect finding.
- The cold-decode transcript confirming the member's anchor.

## Acceptance

- A worked example: given a divergence where rt = def but def cold-decodes to the wrong concept,
  introspect classifies it under the new member and routes to signify, not to a configurational cause.
- **Falsifier:** the member's anchor is coined without cold verification; or a def-level defect still
  falls through to `transient-elevation`/`profile-projection`; or the block gains an explanatory comment.
