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
