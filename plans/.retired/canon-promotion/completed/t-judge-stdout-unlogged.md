# t — the judge's EVIDENCE line is discarded unrecorded

**symptom** — `stance-guardrail` computes exactly one mechanically-checkable artifact per block
(the judge's `EVIDENCE:` span, the only thing that survives a grep against the turn) and then
throws it away. Only the derived `feedback` string reaches the transcript. So a block cannot be
audited after the fact: reconstructing why it fired requires re-running the judge, which is
non-deterministic (measured 3/5 on the same payload).

**locus** — `packages/agent-canon/src/hooks/stance-guardrail.ts`, the `$evidence` extraction and
the `jq -cn` block emission. The value exists, is checked, and is never persisted.

**provenance** — independent audit of this hook's three live blocks, 2026-07-27. The auditor
flagged it explicitly as the one thing it COULD NOT VERIFY: "the judge's live EVIDENCE lines for
the three blocks (only the derived feedback reaches the transcript; the judge's stdout is never
logged — itself a gap, since the one mechanically-checked artifact is discarded unrecorded)."

Not chased when found: it did not impede the position fix in `543fff0`, so per
`¬ impedes(d, t) ⇒ file(owns(d), d) ∧ ¬ fix(d)` it is recorded rather than pursued.

---

**DISCHARGED** — the hook now appends `⟨decision · evidence · reason⟩` to
`$TMPDIR/stance-guardrail/$session.verdicts` at the point the evidence survives its mechanical
check. `$evidence` is the only part of a block that is verified; `$reason` is unverified model
prose. Both were discarded, so the record of WHY a turn was blocked was reconstructible only by
re-running a judge measured at 3/5 on identical payloads — a non-deterministic audit trail, which
is no audit trail. Retirement was blocked by the retirement-integrity gate until this was closed,
which is the gate working: the plan could not retire while carrying an unfinished shard.
