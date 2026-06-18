# fix-harness-projection-test

**State:** ready · **Lead:** Mav (composer/harness machinery) · **Source:** discovered 2026-06-17 running the full toolkit test suite during the CITE-TWICE gate work.

## Finding

`toolkit/test_harness_projection.py` **FAILs** with two assertions:
- `POSITIONS exemplify provenance: skill refs not projected`
- `POSITIONS exemplify body: a skill ref still rendered bold`

**Pre-existing** — confirmed FAILing on base `be9add5` (before any of this session's changes); `exemplify.md`
was not touched. The other 14 toolkit tests PASS. Not caused by the CITE-TWICE → FAIL change.

## Likely cause (unconfirmed — Mav to trace)

`exemplify.md` composes/references `kind: skill` cells (conceptualize · signify · materialize). The harness
ref-projection (`compose/harness.py` `ref_text`) appears to not project a skill ref the way the test expects
(a skill `[[ref]]` should become a `/trigger` link, not stay bold). Either the test's expectation drifted from
the composer, or the composer regressed on skill-ref projection inside a non-skill cell. Trace which.

## Done when

- `test_harness_projection.py` PASS (or the test corrected if its expectation is the stale side).
- Full toolkit suite green.
