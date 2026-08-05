# story↔test map — the forge story library

GENERATED — do not hand-edit. Regenerate: `pnpm exec tsx test/stories/tools/render-map.ts`
(coverage.test.ts fails when this file is stale). Source of truth: the
`story()` / `story.tracked()` call sites under `test/stories/E*/`.

Library: 8 stories · excluded-by-marker 2 (E6.S6 RETIRED · E6.S8 RETIRED) · testable 6.
Tests: 11 total · green 11 · tracked-failing 0 () — enumerated with reasons in TRACKED-FAILING.md.

## Story → tests

| Story | Tests | Status             | File · test name                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | ----- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E6.S1 | 2     | green              | E6/S1.accept-gate-manifest.test.ts · `a verbose human CLAUDE.md passes the exemplify accept gate: REC ≽ · minimal · conform (register = LLM)`<br>E6/S1.accept-gate-manifest.test.ts · `the R3 routing manifest .manifests/<source>.json routes every concept exactly once; a withheld concept makes the gate refuse`                                                                                                                                                                   |
| E6.S2 | 2     | green              | E6/S2.prose-to-skill-cell.test.ts · `the emitted SKILL.md is a well-formed cell: name+description frontmatter, verb H1, fenced declarations-above/laws-below formal block with no undeclared symbol`<br>E6/S2.prose-to-skill-cell.test.ts · `round-trip: the formal block alone re-derives the procedure steps of the pinned answer key`                                                                                                                                               |
| E6.S3 | 3     | green              | E6/S3.agent-elevation.test.ts · `the elevation target contract is runtime-introspectable: exactly 22 dimensions, 5 Persona, 6 set dimensions`<br>E6/S3.agent-elevation.test.ts · `exemplify+elicit elevates a free-text source form to a compiling 22-dimension vector with a provenance trace per non-null dimension`<br>E6/S3.agent-elevation.test.ts · `replacement semantics: on accept the vector is the one source form — no lingering twin, source content recoverable (REC ≽)` |
| E6.S4 | 2     | green              | E6/S4.elicit-markers.test.ts · `the emitted vector carries greppable ELICIT: markers at exactly the silent dimensions, each with a bisecting elicitation script`<br>E6/S4.elicit-markers.test.ts · `negative: a pipeline run that invents a concrete enum value for a silent dimension fails`                                                                                                                                                                                          |
| E6.S5 | 1     | green              | E6/S5.idempotence.test.ts · `second run over accepted output: routes all reuse, delta empty, artifacts byte-identical`                                                                                                                                                                                                                                                                                                                                                                 |
| E6.S6 | —     | EXCLUDED (RETIRED) | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| E6.S7 | 1     | green              | E6/S7.opt-in-lossless.test.ts · `the R3 manifest ledger covers every conceptualized concept: routes ∪ delta = C_R, checked mechanically`                                                                                                                                                                                                                                                                                                                                               |
| E6.S8 | —     | EXCLUDED (RETIRED) | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

(⟂ = tracked-failing test.)

## Test file → stories

| File                               | Stories |
| ---------------------------------- | ------- |
| E6/S1.accept-gate-manifest.test.ts | E6.S1   |
| E6/S2.prose-to-skill-cell.test.ts  | E6.S2   |
| E6/S3.agent-elevation.test.ts      | E6.S3   |
| E6/S4.elicit-markers.test.ts       | E6.S4   |
| E6/S5.idempotence.test.ts          | E6.S5   |
| E6/S7.opt-in-lossless.test.ts      | E6.S7   |

Epics: E6 exemplify-optimization.
