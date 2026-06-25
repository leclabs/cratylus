# C2 — Organ-library robustness (blind-introspection enrichment)

**Lane** Nico · **Depends on** C3 (so new values surface without table edits) · **Part of** organ-catalog.

## Scope

Give `create-agent` fuller option-spaces by widening genuinely-sparse organ value-sets — using the proven
`canonical-organ-values` methodology (blind model introspection, 2 rounds), not coinage. For each OPEN organ
(mandate · telos · competence · construal · disclosure · appraisal · effectors · enaction · percept ·
disposition-memory · instructions · …): ask a clean R=LLM what the model-native value-set for this organ is,
corroborate with the web, and compare against the current corpus values.

- **Mint only real gaps** — a missing distinction the corpus lacks (the `semantic-partition` test). Do NOT
  pad enums for symmetry; bloat is the failure mode (prose-bloat's organ-level cousin).
- Each new value: **R=LLM-dense** `definiens`, **MECE** against siblings, typed TS module, verify PASS,
  byte-identical round-trip.
- Closed enums (persona/comportment/gestalt/deliberation/resolve/sensors/ledger/address-as-ladder) are
  model-native and largely fixed — touch only with a strong blind-introspection mandate.

## Acceptance criteria

- A per-organ report: current values vs blind-introspected candidate set; for each candidate, mint-or-drop
  with reason (the decision docs, like `canonical-organ-values/decisions/`).
- Net-new values landed where gaps are real; nothing padded.
- `pnpm build/test/lint` + verify PASS green; `koine catalog` shows the widened sets; `create-agent`
  option-space tracks them with no skill edit (C3).

## Out of scope

Address (C1, the worked starter). The discovery mechanism (C3).
