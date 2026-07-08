# S6 · VERIFY-GREEN — whole-repo gate on a clean worktree

**Objective.** Prove the de-braid landed: the whole repo builds+tests green on a CLEAN worktree with the build
cache bypassed, the cold-oracle `accept()` passes over the corpus, and the projection output is sound. Report
(do not fix) the two watched out-of-scope drifts.

## Ground state (READ FIRST)

- Branch `tmp-illustrate-conceptual-architecture`. By this wave the deliberately-broken WIP must be fully
  realized — GREEN is now the bar (the earlier "red is expected" no longer applies; a red here is a real
  defect). Green reference base = `7fd1c43`. push/deploy **Operator-reserved** — verify only, never push/deploy.

## Inputs

- The full monorepo at the S5-completed state (S1–S5 ⊳dep).
- Gate: `packages/agent-anatomy/src/toolkit/cold-oracle/` (`accept.ts`, `cold-oracle.sh`, `sweep.mjs`); live
  path via `COLD_ORACLE_LIVE=1`.
- Projection drivers: `toolkit/project-cli.ts` (skill/SOUL), `toolkit/project-human*.ts` (human view).
- Watch items (report only): the memory-contract prose duplication (`genus/memory.md` ↔ the `episodic.mjs`
  runtime, mirrored by prose with no import edge) and the `bundle:` path drift (`memory.md:6`
  `../episodic/dist/episodic.mjs` vs the actual `agent-memory` dir).

## Constraints (hard rules — learned the hard way)

1. **Gate a CLEAN worktree of the commit, never the working tree.** A sibling's or a prior session's
   uncommitted edits mask the real state. Check out the commit into a fresh worktree (or `git stash` +
   clean-verify) before gating.
2. **Bypass the build cache.** Run the whole-repo build+test with `--force` (turbo/nx cache OFF). A cached
   green is NOT a verified green — a stale-green cross-package test (anatomy organ values feed forge's
   `enumerate.test`) has produced a FALSE GREEN before. `pnpm -w test` reporting "N cached" is the tell to reject.
3. **Run the live cold-oracle**, not just the static floor: `COLD_ORACLE_LIVE=1` over the corpus, so a real
   isolated blind decode gates each cell (a warm/context-polluted reader false-passes).
4. Do NOT fix LOGIC — S6 is a gate. A logic failure routes back to the owning shard (name which: S1–S5), it
   does not get hand-patched here. EXCEPTION: mechanical `biome`/formatting (`biome check --write` or the repo
   format script) IS allowed to reach whole-repo-clean — S5 left residual WIP formatting dirt (agent vectors +
   ~4 skill-cell formalBlock backtick placements). Format-fix, then gate; a formatting change is not a logic fix.
5. **False-green scrutiny (the load-bearing S6 duty).** S5 REWROTE several gate tests to reach green
   (`test/{symbols, skill-shape, projection-stability, reader-reach, reader-density}.test.ts`). Read each
   rewrite and confirm it asserts a REAL invariant, not a tautology weakened to pass. Specifically:
   `projection-stability`'s "absorbed declarations" test was rewritten because S3 RETIRED that mechanism (forge
   now renders `formalBlock` verbatim) — confirm the NEW assertion (formalBlock law-lines + "Composed from"
   reach the projection) is meaningful, not empty. A test that can no longer FAIL is a finding, route it back.
6. **Canon spot-checks (nico's domain — confirm S5's judgment calls hold):** (a) `operator-lexicon.ts` gained
   `≥ ⊻ ∘` and handles `⊕` register-scoped in the symbols gate (not residue) — confirm the live `accept()` /
   symbols gate passes with these and no formalBlock trips an unrecognized-glyph error; (b) `carry-on` localized
   `carryOnNotation` to a non-exported const — confirm its projection still emits the fenced block verbatim.

## Dependencies

- S1, S2, S3, S4, S5 ⊳dep (the whole chain).

## Outputs

- A verdict: whole-repo build+test result (with the `--force`/cache-bypass evidence), the `accept()` live run
  result per cell, and a projection dry-run byte-check (project + project-human) with any unexplained diff.
- A drift report for the two watch items (severity + suggested follow-up plan), explicitly NOT fixed here.

## Acceptance (falsifier)

- FAIL if the build+test verdict is based on a run showing ANY cached task (cache not bypassed) — reject and
  re-run with `--force`.
- FAIL if the gate ran against the working tree rather than a clean checkout of the commit.
- FAIL if `COLD_ORACLE_LIVE=1 accept()` rejects any corpus cell (the corpus is not at `∀c: accept(c)`).
- FAIL if the projection dry-run shows an unexplained byte-diff in a deployed artifact.
- FAIL if any package is RED under the clean+forced run.
- FAIL if the return claims green without attaching the cache-bypass + clean-worktree evidence, or is
  human-register prose rather than a dense structured verdict.
