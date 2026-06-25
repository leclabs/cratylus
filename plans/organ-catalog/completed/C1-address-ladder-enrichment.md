# C1 — Address organ: autonomy-ladder enrichment

**Lane** Nico · **Depends on** none (cleanest after C3 de-drifts the builder) · **Part of** organ-catalog.

## Scope

The `address` organ (autonomy vs the human) currently carries three values — an **oversight-intensity
ladder**: `human-in-the-loop` (asks first) · `human-on-the-loop` (acts, you can intervene) ·
`human-out-of-the-loop` (autonomous). Add two industry-standard variants the Operator surfaced:

- **`human-beside-the-loop`** (HBTL) — parallel/cobot stance: human and agent work side-by-side on
  independent-but-related parts, sharing context; neither approves or monitors the other's step-loop.
- **`human-above-the-loop`** (HATL) — meta-governance stance: the human sets policy / rules-of-engagement
  for many autonomous systems and supervises the architecture, not any individual action.

## Discipline (do NOT paste the prose)

- Each `definiens` is **R=LLM-dense** — one firing clause, not the human explanatory paragraph. (The source
  text is a human briefing; the cell body is a σ\*\_LLM anchor.)
- **MECE check (the real curatorial question).** The existing 3 are one axis (oversight intensity). HBTL adds
  a _labor-division_ axis; HATL adds a _governance-scope_ axis. Confirm — via **blind introspection** (does a
  clean R=LLM fire each as a distinct `address` stance?) — that they are genuine distinct values, not
  re-spellings of on-the-loop / out-of-the-loop. If a candidate collapses into an existing value, say so and
  drop it rather than bloat the enum.
- New TS modules under `packages/mind/src/organs/address/` (+ the markdown cell if dual-maintained until
  cutover); round-trip / byte-identical projection holds; verify PASS.

## Acceptance criteria

- `human-beside-the-loop` + `human-above-the-loop` exist as `address` values (R=LLM-dense, typed), iff the
  MECE/blind gate passes for each; a dropped candidate is recorded with the reason.
- They surface in `create-agent`'s option-space automatically (via C3; if C1 lands first, note the one-time
  table touch as debt C3 erases).
- `pnpm build/test/lint` + verify PASS green.

## Out of scope

The other organs (C2). Re-deciding the existing 3.

## Done (2026-06-24) — NEGATIVE result: both candidates rejected from `address`

The blind σ\*\_LLM/MECE gate (2 clean instances, unpolluted) converged: `in/on/out` are the genuine distinct
trichotomy on ONE axis (real-time control); **`human-beside-the-loop` collapses into on-the-loop** (niche
coinage ≈ human-machine-teaming) — DROPPED; **`human-above-the-loop` is real but OFF-AXIS** — it rides the
governance/authority axis (established name **human-in-command**), not a fourth degree of real-time autonomy
— so it is NOT an `address` value. Net: **no new `address` values** (the enum stays in/on/out). This is the
"drop rather than bloat" outcome the gate exists for. The HATL/in-command axis is the "intent-before /
audit-after" envelope — folded into the sharpened `human-out-of-the-loop` definiens (commit `ab2a84f`).
**Carried to C2:** evaluate `human-in-command` as a possible **charter/governance** value (vs the existing
`human-oversight` / `scope-of-authority` / `accountability`) — a different organ, not address.
