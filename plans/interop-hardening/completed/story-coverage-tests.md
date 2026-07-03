# story-coverage-tests — an executable test per story; failing tests state the gap

**Lane** Mav (test engineering) + Nico (judge: story↔test fidelity) · **wave(2)** · deps:
⊳capability-user-stories.

## Static

The story library + coverage matrix (⊳). Test substrate: `packages/agent-forge/test/` (vitest,
mirrors `src/`) · existing fixture patterns (`test/adapters/*`) · repo gates.

## Scope

For every story: ≥1 executable test in the agent-forge test tree (unit or integration; fixture
homes for harness config shapes derived from the research's config-contract sheets). Red-green
discipline is the point: a test for an unimplemented/broken capability is authored to FAIL and
marked as the gap statement (a tracked-failing set, explicitly enumerated — not skipped, not
silently green). A story↔test map ships with the suite. NO production-code changes in this task —
tests state the truth about the current library; closing gaps is wave(3+)'s work.

## Accept (falsifiers)

- The story↔test map is total: a story with no test fails; a test tracing to no story fails (ME).
- The tracked-failing set is explicit and reproducible (`pnpm test` output enumerates exactly it);
  a gap hidden by a skip/todo marker fails.
- Green subset stays green: no previously-passing suite regresses; repo gates on the non-tracked
  set 4×0.
- Judge spot-check: for 5 sampled stories, the test provably bites (mutate the asserted behavior →
  test fails) — a vacuous test fails the sample.
