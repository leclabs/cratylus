# A · agent-collapse (per-agent)

**Slice** CORPUS · **Wave** 2 · **Deps** E1 ⊳dep · **State** pending · **Executor** nico

Parameterized by `<agent> ∈` the 11 agents. Each leaf edits ONLY `agents/<agent>.ts` → file-disjoint → concurrent.

## Objective

Collapse one agent to the D2–D6 shape.

## Spec

- **provenance:** `{ mark: { emoji, hue } }`, read from `<agent>`'s **deployed SOUL** (`~/.claude/agents/<agent>.md`
  — ground truth for the mark), assigned directly. NOT recovered from a provenance fragment (deleted / don't map
  — B1/B2). Emoji AND hue both required.
- **autonomy:** the composed set, by **import reference** to the organ values (e.g. nico →
  `[icAuthority, humanOnTheLoop, auftragstaktik]`). Do NOT edit `organs/autonomy/decision-authority.ts` or any
  `organs/**` file here — that is the `O` task's territory (B3). Reference only.
- **persona:** a plain-string identity DESCRIPTION `persona: '<one-liner>'` (D13 — no fragment). Fill the empty
  `persona: ''` placeholders with an appropriate description of the agent's identity (nico's is already the
  empirical-ontologist string). `persona` subsumes the old `description`.
- **memory:** `longTermMemory` iff `<agent> ∈ {nico, mav}`, else `null` (D4).
- Remove the `${name}Resolved` export, the `...base` spread, `sourcePath`, and any `description`/protocol
  restatement (all projection-derived now — D2/D6).

## Acceptance (falsifier)

- FAIL if `provenance` ≠ `{mark}`, or the mark's emoji/hue ≠ the deployed SOUL's (drift or another agent's mark).
- FAIL if any `*Resolved` export or `...base` reference remains in the file.
- FAIL if a non-named agent keeps `memory`, or nico/mav lost it.
- FAIL if this task edited ANY `organs/**` file (lane violation → the B3 collision).
- FAIL if `pnpm --filter @leclabs/agent-anatomy typecheck` REDs for this file.

## Return

Collapsed vector diff · the mark's source line from the deployed SOUL · falsifier clearances · typecheck result.
