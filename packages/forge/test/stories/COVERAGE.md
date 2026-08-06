# COVERAGE — stories × capabilities (CE over the floor)

Library: 1 epic · 8 stories (6 testable), shard `E6-exemplify-optimization.md` in this dir. ρ=LLM.

**THE IR-INTAKE EXCISION (2026-07).** This library was authored for the interop-hardening wave:
10 epics · 81 stories over floors **F1** (import any harness → IR) · **F2** (output IR to
`.{namespace}/`) · **F3** (reimport) · **F4** (round-trip, losses loud) · **F5** (plugin-arch
adapters) · **F6** (exemplify optimization to R=LLM artifacts), plus the research categories
**R-std** · **R-div** · **R-ir** · **R-roster**. F1–F5 and all four research categories were
capabilities of the **IR intake pipeline**, which has been excised: there is no `import`, no
`compile`, no IR, and no 16-adapter roster to round-trip through. E1–E5 and E7–E10 were deleted
with their subject. **F6 is the one floor whose subject survives** — `src/core/exemplify/` and the
`forge optimize` verb — so E6 remains, less the two stories that rode the compile path.

## Actor legend

CURATOR — corpus curator driving the exemplify pipeline · OPERATOR — the project Operator (ELICIT
oracle).

## Floor matrix (capability → stories; CE check: no floor row empty)

| Floor | Stories                                                           |
| ----- | ----------------------------------------------------------------- |
| F6    | E6.S1 E6.S2 E6.S3 E6.S4 E6.S5 E6.S6(RETIRED) E6.S7 E6.S8(RETIRED) |

## Story matrix (story → capabilities; primary bold; CE check: no story capability-less)

| Story | Caps           |
| ----- | -------------- |
| E6.S1 | **F6**         |
| E6.S2 | **F6**         |
| E6.S3 | **F6**         |
| E6.S4 | **F6**         |
| E6.S5 | **F6**         |
| E6.S6 | **F6** RETIRED |
| E6.S7 | **F6**         |
| E6.S8 | **F6** RETIRED |

Excluded-by-marker from the coverage test (on the record): RETIRED — E6.S6 (optimized artifacts
project to every compile target) and E6.S8 (`optimizeRules` over IR `Rule` bodies). Both asserted
the IR compile path; both subjects were excised with the IR-intake lineage. The ids are kept
excluded rather than renumbered so E6.S7's identity is stable. E6.S3's secondary F1 cap
(elevation of a step-1 imported agent) is gone with `import`; the elevation itself is unchanged and
now starts from a free-text description.

E6.S7 was **narrowed, not deleted**: its `import` → optimize → `compile` leg and its
"raw un-optimized compile remains available" leg both asserted the excised pipeline; its ledger leg
(the `routes ∪ delta = C_R` coverage equation over the R3 manifest) has a surviving subject and is
kept with its assertions intact.

## Accept self-check (task falsifiers)

- CE over floor: the F6 row is non-empty ✓; every story carries ≥1 capability ✓.
- Observable acceptance: every story's `✓:` bullets name fixture/command/path/exact check — a
  blind test author derives pass/fail without asking.
- No open intent forks: the only test exclusions are the explicit RETIRED markers above.
  (`ELICIT` appears in the shard only as the in-artifact mechanism of E6.S4 — a runtime marker the
  pipeline emits, not an open question of this library.)
